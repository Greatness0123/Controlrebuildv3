$content = @"
var f = new File("$env:USERPROFILE\ae_test.txt");
f.open("w");
f.write("works!");
f.close();
alert("Script ran!");
"@
$jsxFile = "$env:TEMP\ae_manual_test.jsx"
Set-Content -Path $jsxFile -Value $content -Encoding UTF8
Write-Host "File: $jsxFile"
& "C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.exe" -r $jsxFile