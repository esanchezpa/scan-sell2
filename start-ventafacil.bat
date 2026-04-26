@echo off
setlocal

cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker Desktop no esta instalado o no esta en PATH.
  echo Instala Docker Desktop y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

echo Iniciando VentaFacil POS 1.0.3 con base de datos local Docker...
docker compose -f docker-compose.local.yml up --build -d
if errorlevel 1 (
  echo No se pudo iniciar VentaFacil.
  echo Revisa que Docker Desktop este abierto y que los puertos 5173, 8000, 5433 y 6379 esten libres.
  pause
  exit /b 1
)

echo.
echo VentaFacil se esta iniciando.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000/health
echo.
echo Si es la primera ejecucion, espera 30-60 segundos antes de usar la app.
start "" http://localhost:5173
pause
