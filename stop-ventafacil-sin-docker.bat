@echo off
setlocal

echo Deteniendo VentaFacil POS sin Docker...
echo.

taskkill /F /T /FI "WINDOWTITLE eq VentaFacil Backend*" >nul 2>nul
taskkill /F /T /FI "WINDOWTITLE eq VentaFacil Frontend*" >nul 2>nul

echo Si las ventanas siguen abiertas, cierralas manualmente.
echo VentaFacil detenido en modo sin Docker.
pause
