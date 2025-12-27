# Keep-Alive Script for Render Service
# Pings your server every 14 minutes to prevent it from spinning down

# Configuration
$SERVICE_URL = $env:RENDER_SERVICE_URL
if (-not $SERVICE_URL) {
    $SERVICE_URL = "YOUR_RENDER_URL_HERE"
}

$PING_INTERVAL_MINUTES = 14
$HEALTH_ENDPOINT = "/api/health"

Write-Host "Keep-Alive Script Started" -ForegroundColor Green
Write-Host "Target: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "Interval: $PING_INTERVAL_MINUTES minutes" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

function Ping-Server {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $url = "$SERVICE_URL$HEALTH_ENDPOINT"
    
    try {
        Write-Host "[$timestamp] Pinging $url..." -ForegroundColor White
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "[$timestamp] ✓ Ping successful! Status: $($response.StatusCode)" -ForegroundColor Green
        } else {
            Write-Host "[$timestamp] ⚠ Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "[$timestamp] ✗ Ping failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Initial ping
Ping-Server

# Loop indefinitely with interval
while ($true) {
    Start-Sleep -Seconds ($PING_INTERVAL_MINUTES * 60)
    Ping-Server
}
