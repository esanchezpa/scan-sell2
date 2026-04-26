@echo off
setlocal

cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker Desktop no esta instalado o no esta en PATH.
  pause
  exit /b 1
)

docker compose -f docker-compose.local.yml logs -f --tail=120
