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
- Access logs HTTP: apagados por defecto en archivos persistentes; activar `LOG_HTTP_ACCESS=true` solo para diagnostico.
- Escritura: asincrona mediante cola de logging para reducir impacto en requests.

## Configuracion

Variables disponibles:

```env
LOG_DIR=../logs
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=14
LOG_HTTP_ACCESS=false
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
