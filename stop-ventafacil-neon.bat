@echo off
setlocal

cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker Desktop no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

echo Deteniendo VentaFacil POS con Neon...
docker compose -f docker-compose.neon.yml down
echo.
echo VentaFacil detenido. La base de datos permanece en Neon.
pause
