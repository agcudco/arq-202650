Write-Host "======================================" -ForegroundColor Red
Write-Host "  DETENIENDO MICROSERVICIOS PARKIN   " -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Red
Write-Host ""

# Matar procesos por puerto
 $Ports = @(3000, 3001, 3002, 8080, 8081)
 $Names = @("vehiculos", "tickets", "ms-audit", "usuarios", "zonas-espacios")

for ($i = 0; $i -lt $Ports.Count; $i++) {
    $Port = $Ports[$i]
    $Name = $Names[$i]
    
    $Connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($Connections) {
        $Pids = $Connections.OwningProcess | Select-Object -Unique
        foreach ($Pid in $Pids) {
            Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue
            Write-Host "X $Name detenido (PID: $Pid)" -ForegroundColor Red
        }
    } else {
        Write-Host "! $Name ya no estaba corriendo" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Todos los microservicios detenidos" -ForegroundColor Green