Add-Type -AssemblyName System.Drawing

Get-ChildItem -Path "public\images\media\*.heic" -Recurse | ForEach-Object {
    $newName = $_.Name -replace ".heic", ".jpg"
    [System.IO.File]::WriteAllBytes($_.FullName, [System.Drawing.Image]::FromFile($_.FullName).Save($newName, [System.Drawing.Imaging.ImageFormat]::Jpeg))
}