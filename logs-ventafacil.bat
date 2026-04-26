@echo off
setlocal

cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker Desktop no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

echo.
echo Logs persistentes del backend:
echo   %~dp0logs\backend-YYYYMMDD-HH.log
echo   %~dp0logs\backend-errors-YYYYMMDD-HH.log
echo.
echo Mostrando logs de Docker en vivo...
echo.

docker compose -f docker-compose.local.yml logs -f --tail=120
