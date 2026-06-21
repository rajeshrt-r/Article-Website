Add-Type -AssemblyName System.Drawing
$imgPath = 'D:\Html Files\SAVE_20250926_151540.jpg'
$img = [System.Drawing.Image]::FromFile($imgPath)
$size = 64
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $size, $size)
$g.Dispose()
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$b64 = [Convert]::ToBase64String($ms.ToArray())
$ms.Dispose()
$bmp.Dispose()
$img.Dispose()
[System.IO.File]::WriteAllText('D:\Html Files\favicon_base64.txt', $b64)
Write-Host "Done. Length: $($b64.Length)"
