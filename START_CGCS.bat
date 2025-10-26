@echo off
REM Script de démarrage rapide pour CGCS sur Windows
REM Double-cliquez sur ce fichier pour démarrer l'application

echo ========================================
echo    Demarrage de CGCS
echo ========================================
echo.

REM Aller dans le dossier du projet
cd /d "%~dp0"

REM Démarrer les conteneurs
echo [1/3] Demarrage des conteneurs Docker...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo ERREUR: Docker n'est pas demarre ou une erreur s'est produite
    echo Veuillez demarrer Docker Desktop et reessayer
    pause
    exit /b 1
)

echo.
echo [2/3] Attente du demarrage (20 secondes)...
timeout /t 20 /nobreak > nul

echo.
echo [3/3] Verification de l'etat...
docker-compose ps

echo.
echo ========================================
echo    CGCS est pret !
echo ========================================
echo.
echo Acces a l'application:
echo   Frontend:  http://localhost:3975
echo   Backend:   http://localhost:3001
echo   Swagger:   http://localhost:3001/api/docs
echo.
echo Comptes de test:
echo   Admin:      admin@cgcs.cg / admin123
echo   Regisseur:  regisseur1@cgcs.cg / regisseur123
echo   Chef:       chef1@cgcs.cg / chef123
echo.
echo Appuyez sur une touche pour ouvrir le navigateur...
pause > nul

REM Ouvrir le navigateur
start http://localhost:3975

echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul

