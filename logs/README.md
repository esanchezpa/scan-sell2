# Logs de VentaFacil

Esta carpeta guarda logs tecnicos persistentes del backend cuando la app corre en local o con Docker.

## Archivos

- `backend-YYYYMMDD-HH.log`: eventos normales del backend por hora.
- `backend-errors-YYYYMMDD-HH.log`: errores y excepciones por hora.

Los archivos reales de log no se versionan en Git.

## Politica

- Rotacion: por hora, con fecha y hora en el nombre del archivo.
- Retencion: 14 dias por defecto.
- Nivel normal: `INFO`.
- SQLAlchemy: no se guarda por defecto; activar `DB_ECHO=true` solo para depurar consultas.
- Requests API: guardados por defecto para `GET`, `POST`, `PATCH`, `DELETE`, etc., con metodo, ruta, status y duracion.
- Preflight `OPTIONS`: se omiten por defecto para no llenar el log.
- Escritura: asincrona mediante cola de logging para reducir impacto en requests.

Ejemplo:

```text
2026-04-26 11:12:40 INFO [app.api] POST /api/v1/sales/ -> 201 238.4ms client=127.0.0.1
2026-04-26 11:12:41 INFO [app.api] GET /api/v1/products/?business_id=6 -> 200 48.9ms client=127.0.0.1
2026-04-26 11:12:45 WARNING [app.api] GET /api/v1/products/barcode/0000?business_id=6 -> 404 19.7ms client=127.0.0.1
```

## Configuracion

Variables disponibles:

```env
LOG_DIR=../logs
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=14
LOG_HTTP_ACCESS=true
LOG_HTTP_SKIP_OPTIONS=true
LOG_SLOW_REQUEST_MS=1000
DB_ECHO=false
```

Para reducir ruido en una maquina lenta, usar:

```env
LOG_LEVEL=WARNING
LOG_HTTP_ACCESS=false
```

## Ver logs en vivo

Docker completo:

```powershell
logs-ventafacil.bat
```

Solo archivo backend:

```powershell
$latestLog = (Get-ChildItem .\logs\backend-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
Get-Content $latestLog -Tail 120 -Wait
```

Solo errores:

```powershell
$latestErrorLog = (Get-ChildItem .\logs\backend-errors-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
Get-Content $latestErrorLog -Tail 120 -Wait
```
