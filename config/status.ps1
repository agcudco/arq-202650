Write-Host "==========================================" -ForegroundColor Green
Write-Host "    ESTADO DE MICROSERVICIOS PARKIN      " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

 $Services = @(
    @{ Name = "vehiculos";       Port = 3000; Type = "NestJS"    }
    @{ Name = "tickets";         Port = 3001; Type = "NestJS"    }
    @{ Name = "ms-audit";        Port = 3002; Type = "NestJS"    }
    @{ Name = "usuarios";        Port = 8080; Type = "SpringBoot" }
    @{ Name = "zonas-espacios";  Port = 8081; Type = "SpringBoot" }
)

foreach ($Svc in $Services) {
    $Connection = Get-NetTCPConnection -LocalPort $Svc.Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($Connection) {
        $ProcId = $Connection.OwningProcess
        Write-Host "  $($Svc.Name)" -NoNewline
        Write-Host " [$($Svc.Type)]" -ForegroundColor DarkGray -NoNewline
        Write-Host " :$($Svc.Port)" -NoNewline
        Write-Host " ● ACTIVO" -ForegroundColor Green -NoNewline
        Write-Host "  PID: $ProcId"
    } else {
        Write-Host "  $($Svc.Name)" -NoNewline
        Write-Host " [$($Svc.Type)]" -ForegroundColor DarkGray -NoNewline
        Write-Host " :$($Svc.Port)" -NoNewline
        Write-Host " ● INACTIVO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green