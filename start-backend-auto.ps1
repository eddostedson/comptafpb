# Script de démarrage automatique du backend
# Ce script démarre le backend avec surveillance automatique
# Usage: .\start-backend-auto.ps1

$ErrorActionPreference = "Continue"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"

Write-Host "🚀 Démarrage automatique du Backend CGCS" -ForegroundColor Cyan
Write-Host "📂 Dossier backend: $backendPath" -ForegroundColor Gray
Write-Host ""

# Vérifier si le backend est déjà en cours d'exécution
$port = 3001
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port/api" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Le backend est déjà en cours d'exécution sur le port $port" -ForegroundColor Green
    Write-Host "📚 Swagger: http://localhost:$port/api/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Pour utiliser la surveillance automatique (redémarrage en cas de crash):" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   .\keep-alive.ps1" -ForegroundColor White
    exit 0
} catch {
    # Backend non accessible, continuer
}

# Vérifier si pnpm est installé
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm n'est pas installé. Installez-le avec: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

# Vérifier si le dossier backend existe
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Le dossier backend n'existe pas: $backendPath" -ForegroundColor Red
    exit 1
}

# Changer vers le dossier backend
Set-Location $backendPath

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔧 Démarrage du backend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Options disponibles:" -ForegroundColor Cyan
Write-Host "   1. Mode simple (juste démarrer)" -ForegroundColor White
Write-Host "   2. Mode surveillance (redémarre automatiquement en cas de crash)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choisissez une option (1 ou 2, par défaut: 1)"

if ($choice -eq "2") {
    # Utiliser le script de surveillance
    Write-Host ""
    Write-Host "🔄 Démarrage avec surveillance automatique..." -ForegroundColor Cyan
    Write-Host "   Le backend redémarrera automatiquement en cas de crash" -ForegroundColor Gray
    Write-Host ""
    
    if (Test-Path "keep-alive.ps1") {
        & ".\keep-alive.ps1"
    } else {
        Write-Host "❌ Le script keep-alive.ps1 n'existe pas dans le dossier backend" -ForegroundColor Red
        Write-Host "💡 Démarrage en mode simple..." -ForegroundColor Yellow
        pnpm start:dev
    }
} else {
    # Mode simple
    Write-Host ""
    Write-Host "🚀 Démarrage du backend (mode simple)" -ForegroundColor Cyan
    Write-Host "   Pour arrêter: Appuyez sur Ctrl+C" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Pour démarrer avec surveillance automatique plus tard:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   .\keep-alive.ps1" -ForegroundColor White
    Write-Host ""
    
    pnpm start:dev
}



