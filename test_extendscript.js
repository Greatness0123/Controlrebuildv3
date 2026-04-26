const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = os.tmpdir();
const testScript = `var f = new File("$env:USERPROFILE\\ae_test.txt"); f.open("w"); f.write("test"); f.close();`;

const jsxFile = path.join(tmpDir, `ae_extendscript_${Date.now()}.jsx`);
fs.writeFileSync(jsxFile, testScript, 'utf8');

const aePath = 'C:\\Program Files\\Adobe\\Adobe After Effects 2024\\Support Files\\AfterFX.exe';
const ps1 = 'C:\\Users\\USER\\Downloads\\Controlrebuildv3\\scripts\\run_extendscript.ps1';

console.log('=== Using PS1 wrapper script ===');

exec(`powershell -ExecutionPolicy Bypass -File "${ps1}" -ExePath "${aePath}" -ScriptPath "${jsxFile}"`, (err, stdout, stderr) => {
  console.log('err:', err ? err.message : 'none');
  console.log('stdout:', stdout);
  
  setTimeout(() => {
    const testFile = path.join(os.homedir(), 'ae_test.txt');
    if (fs.existsSync(testFile)) {
      console.log('SUCCESS - file created!');
      fs.unlinkSync(testFile);
    } else {
      console.log('No file');
    }
    try { fs.unlinkSync(jsxFile); } catch(e) {}
  }, 3000);
});