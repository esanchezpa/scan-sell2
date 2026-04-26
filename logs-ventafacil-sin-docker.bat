@echo off
setlocal

cd /d "%~dp0"

echo.
echo Buscando el log persistente mas reciente del backend...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$log = Get-ChildItem -Path '.\logs' -Filter 'backend-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if (-not $log) { Write-Host 'No hay logs backend todavia. Inicia la app primero.'; exit 0 }; Write-Host ('Siguiendo: ' + $log.FullName); Get-Content -Path $log.FullName -Tail 120 -Wait"
