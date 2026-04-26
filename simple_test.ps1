$script = @"
// NO ALERTS - just operations
var newComp = app.project.items.addComp("Control Comp", 1920, 1080, 1, 10, 30);
var textLayer = newComp.layers.addText("GREATNESS");
textLayer.transform.opacity.value = 100;
"@

$jsxFile = "$env:TEMP\test_control.jsx"
$script | Set-Content $jsxFile -Encoding UTF8
Write-Host "Script: $jsxFile"

& "C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.exe" -r $jsxFile
Write-Host "Done - check AE for new comp"