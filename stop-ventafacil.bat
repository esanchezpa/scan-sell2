@echo off
setlocal

cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker Desktop no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

echo Deteniendo VentaFacil POS...
docker compose -f docker-compose.local.yml down
echo.
echo VentaFacil detenido. Los datos locales se conservan en volumenes Docker.
pause
