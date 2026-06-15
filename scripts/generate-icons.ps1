# Generate simple PNG icons for sebbye extension
# Uses System.Drawing to create basic icons

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$iconsDir = Join-Path (Split-Path -Parent $scriptDir) "public\icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

function Generate-Icon {
    param([int]$Size)
    
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    
    # Background gradient
    $bgRect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $bgRect,
        [System.Drawing.Color]::FromArgb(30, 58, 95),
        [System.Drawing.Color]::FromArgb(13, 27, 42),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $graphics.FillRectangle($bgBrush, $bgRect)
    
    # Shield shape
    $shieldWidth = [int]($Size * 0.6)
    $shieldHeight = [int]($Size * 0.7)
    $shieldX = [int](($Size - $shieldWidth) / 2)
    $shieldY = [int]($Size * 0.15)
    
    $shieldPoints = @(
        [System.Drawing.Point]::new([int]($shieldX + $shieldWidth / 2), $shieldY),
        [System.Drawing.Point]::new([int]($shieldX + $shieldWidth), [int]($shieldY + $shieldHeight * 0.25)),
        [System.Drawing.Point]::new([int]($shieldX + $shieldWidth), [int]($shieldY + $shieldHeight * 0.5)),
        [System.Drawing.Point]::new([int]($shieldX + $shieldWidth * 0.8), [int]($shieldY + $shieldHeight * 0.85)),
        [System.Drawing.Point]::new([int]($shieldX + $shieldWidth / 2), [int]($shieldY + $shieldHeight)),
        [System.Drawing.Point]::new([int]($shieldX + $shieldWidth * 0.2), [int]($shieldY + $shieldHeight * 0.85)),
        [System.Drawing.Point]::new([int]($shieldX), [int]($shieldY + $shieldHeight * 0.5)),
        [System.Drawing.Point]::new([int]($shieldX), [int]($shieldY + $shieldHeight * 0.25))
    )
    
    $shieldBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle($shieldX, $shieldY, $shieldWidth, $shieldHeight)),
        [System.Drawing.Color]::FromArgb(74, 144, 217),
        [System.Drawing.Color]::FromArgb(37, 99, 235),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $graphics.FillPolygon($shieldBrush, $shieldPoints)
    
    # Shield border
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(96, 165, 250), [int]($Size * 0.03))
    $graphics.DrawPolygon($borderPen, $shieldPoints)
    
    # Letter S
    $fontSize = [int]($Size * 0.38)
    if ($fontSize -lt 7) { $fontSize = 7 }
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = [System.Drawing.Brushes]::White
    $textFormat = [System.Drawing.StringFormat]::GenericTypographic
    $textSize = $graphics.MeasureString("S", $font, $Size, $textFormat)

    $shieldCenterX = $shieldX + ($shieldWidth / 2)
    $shieldCenterY = $shieldY + ($shieldHeight * 0.42) 

    $textX = $shieldCenterX - ($textSize.Width / 2)
    $textY = $shieldCenterY - ($textSize.Height / 2)

    if ($Size -eq 16) { $textY += 0.5 } 

    $graphics.DrawString("S", $font, $textBrush, $textX, $textY, $textFormat)

    # Save
    $outputPath = Join-Path $iconsDir "icon${Size}.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated $Size x $Size icon: $outputPath"

    $graphics.Dispose()
    $bitmap.Dispose()
    $font.Dispose()
}

Generate-Icon 16
Generate-Icon 48
Generate-Icon 128

Write-Host "All icons generated successfully!"
