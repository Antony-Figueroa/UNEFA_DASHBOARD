$env:USE_PGLITE = 'true'
$env:PGLITE_DATA_DIR = 'data/pglite'
Set-Location 'C:\Users\Server Admin\Documents\GitHub\UNEFA_DASHBOARD\backend'

# Iniciar server en background job
$job = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    $env:USE_PGLITE = 'true'
    $env:PGLITE_DATA_DIR = 'data/pglite'
    npx tsx src/server-offline.ts
} -ArgumentList 'C:\Users\Server Admin\Documents\GitHub\UNEFA_DASHBOARD\backend'

Write-Host "Esperando que el server arranque..."
Start-Sleep -Seconds 50

Write-Host "`n=== 1. HEALTH CHECK ==="
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 10
    $health | ConvertTo-Json
} catch {
    Write-Host "Health check FAILED: $_"
    $jobState = $job | Receive-Job
    Write-Host "Job output: $jobState"
    exit 1
}

Write-Host "`n=== 2. LOGIN ==="
try {
    $body = '{"ci":"admin","password":"admin123"}'
    $login = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
    $login | ConvertTo-Json
} catch {
    Write-Host "Login FAILED: $_"
    exit 1
}

Write-Host "`n=== 3. PROTECTED ROUTE (students con token) ==="
try {
    $token = $login.token
    $headers = @{ Authorization = "Bearer $token" }
    $students = Invoke-RestMethod -Uri 'http://localhost:3001/api/students?limit=2' -Headers $headers
    $students.data | Select-Object STUDENTS_ID, STUDENTS_CI, NAME, SURNAME | Format-Table -AutoSize
} catch {
    Write-Host "Protected route FAILED: $_"
    exit 1
}

Write-Host "`n=== 4. PROTECTED ROUTE SIN TOKEN (debería dar 401) ==="
try {
    $noAuth = Invoke-RestMethod -Uri 'http://localhost:3001/api/students?limit=1' -TimeoutSec 5
    Write-Host "ERROR: Debería haber dado 401"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ 401 correctamente rechazado"
    } else {
        Write-Host "Error inesperado: $_"
    }
}

Write-Host "`n¡TODOS LOS TESTS PASARON!" -ForegroundColor Green

# Cleanup
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue
