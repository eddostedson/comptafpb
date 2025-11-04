# Script de démarrage rapide pour développement local (Windows)
# Utilisation: .\start-dev.ps1

Write-Host "🚀 Démarrage de CGCS en mode développement local..." -ForegroundColor Green

# Vérifier si PostgreSQL Docker tourne
$postgresRunning = docker ps --filter "name=cgcs_postgres" --format "{{.Names}}" | Select-String "cgcs_postgres"
if (-not $postgresRunning) {
    Write-Host "🐘 Démarrage de PostgreSQL Docker..." -ForegroundColor Yellow
    docker start cgcs_postgres 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Impossible de démarrer PostgreSQL. Créez d'abord le conteneur:" -ForegroundColor Red
        Write-Host "   docker run --name cgcs_postgres -e POSTGRES_DB=cgcs_db -e POSTGRES_USER=cgcs_user -e POSTGRES_PASSWORD=cgcs_password_2024 -p 5432:5432 -d postgres:16-alpine" -ForegroundColor Yellow
        exit 1
    }
    Start-Sleep -Seconds 3
} else {
    Write-Host "✅ PostgreSQL est déjà démarré" -ForegroundColor Green
}

# Démarrer le backend dans un nouveau terminal
Write-Host "🔧 Démarrage du Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend CGCS' -ForegroundColor Cyan; pnpm run start:dev"

# Attendre que le backend démarre
Write-Host "⏳ Attente du démarrage du backend (10 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Démarrer le frontend dans un nouveau terminal
Write-Host "🎨 Démarrage du Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '🎨 Frontend CGCS' -ForegroundColor Cyan; pnpm run dev"

Write-Host ""
Write-Host "✅ Services démarrés !" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs disponibles:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3975" -ForegroundColor White
Write-Host "   - Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "   - Swagger: http://localhost:3001/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "💡 Les services s'exécutent dans des fenêtres PowerShell séparées" -ForegroundColor Yellow
Write-Host "💡 Appuyez sur Ctrl+C dans chaque fenêtre pour arrêter les services" -ForegroundColor Yellow



