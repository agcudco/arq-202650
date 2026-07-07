 $BaseDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
 $LogDir = Join-Path $BaseDir "config\logs"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

Write-Host "======================================" -ForegroundColor Green
Write-Host "  INICIANDO MICROSERVICIOS PARKIN    " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# 1. vehiculos (NestJS) - Puerto 3000
Write-Host "[1/5] Iniciando vehiculos... (puerto 3000)" -ForegroundColor Magenta
Set-Location "$BaseDir\vehiculos"
Start-Process -NoNewWindow cmd -ArgumentList "/c", "npm run start:dev > `"$LogDir\vehiculos.log`" 2>&1"
Write-Host "      OK vehiculos iniciado" -ForegroundColor Magenta
Write-Host ""

# 2. tickets (NestJS) - Puerto 3001
Write-Host "[2/5] Iniciando tickets... (puerto 3001)" -ForegroundColor Cyan
Set-Location "$BaseDir\tickets"
Start-Process -NoNewWindow cmd -ArgumentList "/c", "npm run start:dev > `"$LogDir\tickets.log`" 2>&1"
Write-Host "      OK tickets iniciado" -ForegroundColor Cyan
Write-Host ""

# 3. ms-audit (NestJS) - Puerto 3002
Write-Host "[3/5] Iniciando ms-audit... (puerto 3002)" -ForegroundColor Yellow
Set-Location "$BaseDir\ms-audit"
Start-Process -NoNewWindow cmd -ArgumentList "/c", "npm run start:dev > `"$LogDir\ms-audit.log`" 2>&1"
Write-Host "      OK ms-audit iniciado" -ForegroundColor Yellow
Write-Host ""

# 4. usuarios (SpringBoot) - Puerto 8080
Write-Host "[4/5] Iniciando usuarios... (puerto 8080)" -ForegroundColor Blue
Set-Location "$BaseDir\usuarios"
Start-Process -NoNewWindow cmd -ArgumentList "/c", "mvn spring-boot:run > `"$LogDir\usuarios.log`" 2>&1"
Write-Host "      OK usuarios iniciado" -ForegroundColor Blue
Write-Host ""

# 5. zonas-espacios (SpringBoot) - Puerto 8081
Write-Host "[5/5] Iniciando zonas-espacios... (puerto 8081)" -ForegroundColor Green
Set-Location "$BaseDir\zonas-espacios"
Start-Process -NoNewWindow cmd -ArgumentList "/c", "mvn spring-boot:run > `"$LogDir\zonas-espacios.log`" 2>&1"
Write-Host "      OK zonas-espacios iniciado" -ForegroundColor Green
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "  TODOS LOS MICROSERVICIOS INICIADOS " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "  vehiculos:       http://localhost:3000" -ForegroundColor Magenta
Write-Host "  tickets:         http://localhost:3001" -ForegroundColor Cyan
Write-Host "  ms-audit:        http://localhost:3002" -ForegroundColor Yellow
Write-Host "  usuarios:        http://localhost:8080" -ForegroundColor Blue
Write-Host "  zonas-espacios:  http://localhost:8081" -ForegroundColor Green
Write-Host ""
Write-Host "Logs en: $LogDir"
Write-Host "Para detener: .\config\stop.ps1" -ForegroundColor Yellow
Write-Host "Para estado:  .\config\status.ps1" -ForegroundColor Yellow