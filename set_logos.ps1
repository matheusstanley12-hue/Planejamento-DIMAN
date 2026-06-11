# PowerShell script to resize and set logos for Web and Android App
$ErrorActionPreference = "Stop"

$sourceImg = "C:\Users\Mathe\.gemini\antigravity\brain\51148a50-8def-41a1-a264-c13df8f6475d\media__1781188613321.png"
$webLogo = "c:\Users\Mathe\Documents\Planejamento Geosol\logo.png"
$androidAssetLogo = "c:\Users\Mathe\Documents\Planejamento Geosol\android\app\src\main\assets\www\logo.png"

Write-Host "Iniciando criacao e configuracao das logos..." -ForegroundColor Cyan

# Copy to web app root
Write-Host "Copiando logo para a raiz do site..."
Copy-Item -Path $sourceImg -Destination $webLogo -Force

# Copy to android web assets
if (Test-Path "c:\Users\Mathe\Documents\Planejamento Geosol\android\app\src\main\assets\www") {
    Write-Host "Copiando logo para assets do Android..."
    Copy-Item -Path $sourceImg -Destination $androidAssetLogo -Force
}

# Generate Android launcher icons (mipmaps)
$resDir = "c:\Users\Mathe\Documents\Planejamento Geosol\android\app\src\main\res"
if (-not (Test-Path $resDir)) {
    New-Item -ItemType Directory -Path $resDir -Force | Out-Null
}
if (Test-Path $resDir) {
    Write-Host "Gerando icones do aplicativo (launcher icons)..."
    
    Add-Type -AssemblyName System.Drawing

    function Resize-Image {
        param(
            [string]$SourcePath,
            [string]$OutputPath,
            [int]$Size
        )
        
        $srcImage = [System.Drawing.Image]::FromFile($SourcePath)
        $destImage = New-Object System.Drawing.Bitmap($Size, $Size)
        $graphics = [System.Drawing.Graphics]::FromImage($destImage)
        
        # Configure high quality settings
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        
        $graphics.DrawImage($srcImage, 0, 0, $Size, $Size)
        
        # Save image
        $destImage.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Dispose
        $graphics.Dispose()
        $destImage.Dispose()
        $srcImage.Dispose()
    }

    # Densities map
    $densities = @{
        "mipmap-mdpi" = 48
        "mipmap-hdpi" = 72
        "mipmap-xhdpi" = 96
        "mipmap-xxhdpi" = 144
        "mipmap-xxxhdpi" = 192
    }

    foreach ($folder in $densities.Keys) {
        $targetFolder = Join-Path $resDir $folder
        if (-not (Test-Path $targetFolder)) {
            New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
        }
        
        $size = $densities[$folder]
        Write-Host "Gerando icone em $folder (${size}x${size})..."
        
        # Standard icon
        $outIcon = Join-Path $targetFolder "ic_launcher.png"
        Resize-Image -SourcePath $sourceImg -OutputPath $outIcon -Size $size
        
        # Round icon
        $outIconRound = Join-Path $targetFolder "ic_launcher_round.png"
        Resize-Image -SourcePath $sourceImg -OutputPath $outIconRound -Size $size
    }
}

Write-Host "Processo de geracao de logos concluido com sucesso!" -ForegroundColor Green
