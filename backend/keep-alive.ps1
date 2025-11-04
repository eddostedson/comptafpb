# Script PowerShell pour maintenir le backend en ligne de manière permanente
# Usage: .\keep-alive.ps1

$ErrorActionPreference = "Continue"
$backendPath = $PSScriptRoot
$port = 3001

Write-Host "🔄 Script de maintien du backend en ligne" -ForegroundColor Cyan
Write-Host "📂 Dossier: $backendPath" -ForegroundColor Gray
Write-Host ""

function Test-BackendRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port/api" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Start-Backend {
    Write-Host "🚀 Démarrage du backend..." -ForegroundColor Yellow
    
    Set-Location $backendPath
    
    # Vérifier si pnpm est installé
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Host "❌ pnpm n'est pas installé. Installez-le avec: npm install -g pnpm" -ForegroundColor Red
        return $false
    }
    
    # Démarrer le backend en arrière-plan
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend CGCS - Port $port' -ForegroundColor Cyan; Write-Host '📝 Logs ci-dessous...' -ForegroundColor Gray; Write-Host ''; pnpm start:dev" -PassThru -WindowStyle Minimized
    
    Write-Host "✅ Backend démarré (PID: $($process.Id))" -ForegroundColor Green
    
    # Attendre que le backend soit prêt
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 2
        $attempt++
        
        if (Test-BackendRunning) {
            Write-Host "✅ Backend prêt et accessible sur http://localhost:$port" -ForegroundColor Green
            Write-Host "📚 Swagger: http://localhost:$port/api/docs" -ForegroundColor Cyan
            return $true
        }
        
        Write-Host "⏳ Attente du démarrage... ($attempt/$maxAttempts)" -ForegroundColor Yellow
    }
    
    Write-Host "⚠️ Le backend semble avoir du mal à démarrer. Vérifiez les logs." -ForegroundColor Yellow
    return $false
}

function Stop-Backend {
    Write-Host "🛑 Arrêt des processus Node.js sur le port $port..." -ForegroundColor Yellow
    
    # Trouver les processus qui utilisent le port 3001
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "   Arrêt du processus: $($process.ProcessName) (PID: $processId)" -ForegroundColor Gray
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Arrêter tous les processus node dans le dossier backend
    Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*$backendPath*"
    } | ForEach-Object {
        Write-Host "   Arrêt du processus backend: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Seconds 2
    Write-Host "✅ Processus arrêtés" -ForegroundColor Green
}

# Boucle principale de surveillance
Write-Host "🔄 Démarrage de la surveillance continue..." -ForegroundColor Cyan
Write-Host "   Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Gray
Write-Host ""

$checkInterval = 10 # Vérifier toutes les 10 secondes
$backendStarted = $false

while ($true) {
    try {
        $isRunning = Test-BackendRunning
        
        if (-not $isRunning) {
            if ($backendStarted) {
                Write-Host "❌ Backend offline détecté à $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Red
            }
            
            Write-Host "🔄 Redémarrage du backend..." -ForegroundColor Yellow
            
            # Arrêter les anciens processus
            Stop-Backend
            
            # Démarrer le backend
            $success = Start-Backend
            $backendStarted = $success
            
            if (-not $success) {
                Write-Host "⚠️ Échec du démarrage. Nouvelle tentative dans 30 secondes..." -ForegroundColor Yellow
                Start-Sleep -Seconds 30
                continue
            }
        } else {
            if (-not $backendStarted) {
                Write-Host "✅ Backend en ligne et opérationnel" -ForegroundColor Green
                $backendStarted = $true
            }
        }
        
        Start-Sleep -Seconds $checkInterval
        
    } catch {
        Write-Host "❌ Erreur dans la boucle de surveillance: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 5
    }
}



