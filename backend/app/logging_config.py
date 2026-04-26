from __future__ import annotations

import atexit
from datetime import datetime, timedelta
import logging
import queue
from logging.handlers import QueueHandler, QueueListener
from pathlib import Path
from typing import Any

_listener: QueueListener | None = None
_queue_handler: QueueHandler | None = None


def configure_logging(settings: Any) -> None:
    """Configure lightweight rotating file logs for the API process."""
    global _listener, _queue_handler

    if _listener is not None:
        return

    log_dir = Path(settings.log_dir).expanduser()
    if not log_dir.is_absolute():
        log_dir = Path.cwd() / log_dir
    log_dir.mkdir(parents=True, exist_ok=True)

    log_level = _resolve_level(settings.log_level)
    retention_hours = max(int(settings.log_retention_days), 1) * 24

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    info_handler = _build_hourly_handler(
        log_dir,
        "backend",
        logging.INFO,
        retention_hours,
        formatter,
    )
    error_handler = _build_hourly_handler(
        log_dir,
        "backend-errors",
        logging.ERROR,
        retention_hours,
        formatter,
    )

    log_queue: queue.Queue[logging.LogRecord] = queue.Queue(-1)
    _queue_handler = QueueHandler(log_queue)
    _queue_handler.setLevel(logging.DEBUG)
    setattr(_queue_handler, "_ventafacil_queue_handler", True)

    _listener = QueueListener(
        log_queue,
        info_handler,
        error_handler,
        respect_handler_level=True,
    )
    _listener.start()
    atexit.register(_stop_listener)

    _install_queue_handler(logging.getLogger("app"), _queue_handler, log_level)
    _install_queue_handler(logging.getLogger("uvicorn.error"), _queue_handler, log_level)

    if settings.log_http_access:
        _install_queue_handler(
            logging.getLogger("uvicorn.access"),
            _queue_handler,
            logging.INFO,
        )

    _install_queue_handler(logging.getLogger(), _queue_handler, logging.WARNING)
    _quiet_database_loggers()
    logging.getLogger("app").info("Hourly file logging initialized in %s", log_dir)


def _build_hourly_handler(
    log_dir: Path,
    prefix: str,
    level: int,
    retention_hours: int,
    formatter: logging.Formatter,
) -> "HourlyLogFileHandler":
    handler = HourlyLogFileHandler(log_dir, prefix, retention_hours)
    handler.setLevel(level)
    handler.setFormatter(formatter)
    setattr(handler, "_ventafacil_file_handler", True)
    return handler


class HourlyLogFileHandler(logging.Handler):
    terminator = "\n"

    def __init__(self, log_dir: Path, prefix: str, retention_hours: int) -> None:
        super().__init__()
        self.log_dir = log_dir
        self.prefix = prefix
        self.retention_hours = retention_hours
        self.current_period: str | None = None
        self.last_cleanup_period: str | None = None
        self.stream = None

    def emit(self, record: logging.LogRecord) -> None:
        try:
            record_time = datetime.fromtimestamp(record.created)
            period = record_time.strftime("%Y%m%d-%H")
            if period != self.current_period:
                self._open_period(period)

            message = self.format(record)
            self.stream.write(message + self.terminator)
            self.stream.flush()

            if self.last_cleanup_period != period:
                self._cleanup_old_files(record_time)
                self.last_cleanup_period = period
        except Exception:
            self.handleError(record)

    def close(self) -> None:
        if self.stream:
            self.stream.close()
            self.stream = None
        super().close()

    def _open_period(self, period: str) -> None:
        if self.stream:
            self.stream.close()

        path = self.log_dir / f"{self.prefix}-{period}.log"
        self.stream = path.open("a", encoding="utf-8")
        self.current_period = period

    def _cleanup_old_files(self, record_time: datetime) -> None:
        cutoff = record_time - timedelta(hours=self.retention_hours)

        for path in self.log_dir.glob(f"{self.prefix}-*.log"):
            timestamp = path.stem.removeprefix(f"{self.prefix}-")
            try:
                file_period = datetime.strptime(timestamp, "%Y%m%d-%H")
            except ValueError:
                continue

            if file_period < cutoff:
                try:
                    path.unlink()
                except OSError:
                    continue


def _install_queue_handler(
    logger: logging.Logger,
    handler: QueueHandler,
    level: int,
) -> None:
    if not any(getattr(existing, "_ventafacil_queue_handler", False) for existing in logger.handlers):
        logger.addHandler(handler)
    logger.setLevel(level)

    if logger.name:
        logger.propagate = False


def _resolve_level(value: str) -> int:
    level_name = str(value).upper()
    return getattr(logging, level_name, logging.INFO)


def _quiet_database_loggers() -> None:
    for logger_name in (
        "sqlalchemy.engine",
        "sqlalchemy.pool",
        "sqlalchemy.dialects",
        "sqlalchemy.orm",
    ):
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.WARNING)


def _stop_listener() -> None:
    global _listener

    if _listener is not None:
        _listener.stop()
        _listener = None
