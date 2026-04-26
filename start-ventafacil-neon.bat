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

if not exist ".env" (
  echo Falta el archivo .env.
  echo Copia .env.example a .env y configura DATABASE_URL, DIRECT_DATABASE_URL, VITE_BUSINESS_ID y VITE_STORE_ID.
  pause
  exit /b 1
)

echo Iniciando VentaFacil POS 1.0.2 con base de datos Neon...
docker compose -f docker-compose.neon.yml up --build -d
if errorlevel 1 (
  echo No se pudo iniciar VentaFacil con Neon.
  echo Revisa que Docker Desktop este abierto, que .env tenga la URL de Neon y que los puertos 5173, 8000 y 6379 esten libres.
  pause
  exit /b 1
)

echo.
echo VentaFacil se esta iniciando con Neon.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000/health
echo.
echo Si es la primera ejecucion en esta maquina, espera 30-60 segundos antes de usar la app.
start "" http://localhost:5173
pause
