@echo off
REM Script d'arrêt pour CGCS sur Windows

echo ========================================
echo    Arret de CGCS
echo ========================================
echo.

cd /d "%~dp0"

echo Arret des conteneurs Docker...
docker-compose down

echo.
echo ========================================
echo    CGCS est arrete !
echo ========================================
echo.
echo Pour redemarrer, double-cliquez sur START_CGCS.bat
echo.
pause

