@echo off
setlocal

cd /d "%~dp0"
set "ROOT=%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python no esta instalado o no esta en PATH.
  echo Instala Python 3.12 o superior y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js/npm no esta instalado o no esta en PATH.
  echo Instala Node.js 20 o superior y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

if not exist ".env" (
  echo Falta el archivo .env.
  echo Copia .env.example a .env y configura DATABASE_URL, VITE_BUSINESS_ID y VITE_STORE_ID.
  pause
  exit /b 1
)

if not exist "backend\.venv\Scripts\python.exe" (
  echo Creando entorno virtual Python...
  python -m venv backend\.venv
  if errorlevel 1 (
    echo No se pudo crear backend\.venv.
    pause
    exit /b 1
  )
)

echo Preparando backend...
pushd backend
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
if errorlevel 1 (
  popd
  echo No se pudo actualizar pip.
  pause
  exit /b 1
)

pip install -r requirements.txt
if errorlevel 1 (
  popd
  echo No se pudieron instalar las dependencias Python.
  pause
  exit /b 1
)

alembic upgrade head
if errorlevel 1 (
  popd
  echo No se pudieron aplicar las migraciones Alembic.
  echo Revisa DATABASE_URL en .env y que la base PostgreSQL este disponible.
  pause
  exit /b 1
)
popd

if not exist "node_modules" (
  echo Instalando dependencias frontend...
  npm install
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias npm.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando VentaFacil POS 1.0.3 sin Docker...
start "VentaFacil Backend" /D "%ROOT%backend" cmd /k "call .venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "VentaFacil Frontend" /D "%ROOT%" cmd /k "npm run dev -- --host 127.0.0.1"

echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000/health
echo.
echo Si es la primera ejecucion, espera unos segundos antes de usar la app.
timeout /t 5 /nobreak >nul
start "" http://localhost:5173
pause
