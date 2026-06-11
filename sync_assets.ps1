# PowerShell script to sync web assets to Android assets folder
$ErrorActionPreference = "Stop"

$srcRoot = Get-Item .
$destDir = Join-Path $srcRoot.FullName "android\app\src\main\assets\www"

Write-Host "Iniciando sincronizacao de arquivos para o projeto Android..." -ForegroundColor Cyan

# Clean destination
if (Test-Path $destDir) {
    Write-Host "Limpando assets antigos em: $destDir..." -ForegroundColor Yellow
    Remove-Item -Path $destDir -Recurse -Force
}

# Create destination dir
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

# Copy index.html
Write-Host "Copiando index.html..."
Copy-Item -Path (Join-Path $srcRoot.FullName "index.html") -Destination (Join-Path $destDir "index.html") -Force

# Copy css folder
Write-Host "Copiando css/..."
Copy-Item -Path (Join-Path $srcRoot.FullName "css") -Destination $destDir -Recurse -Force

# Copy js folder
Write-Host "Copiando js/..."
Copy-Item -Path (Join-Path $srcRoot.FullName "js") -Destination $destDir -Recurse -Force

Write-Host "Sincronizacao concluida com sucesso!" -ForegroundColor Green
Write-Host "Os arquivos web foram copiados para: $destDir" -ForegroundColor Green
