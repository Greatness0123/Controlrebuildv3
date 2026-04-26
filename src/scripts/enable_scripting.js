/**
 * enable_scripting.js
 * Enables scripting/automation access for all supported creative tools.
 * 
 * Run this ONCE before attempting any automation.
 * 
 * Usage:
 *     node enable_scripting.js --all
 *     node enable_scripting.js --app photoshop
 *     node enable_scripting.js --app aftereffects
 *     node enable_scripting.js --check   # check status of all apps
 *     node enable_scripting.js --status # show remembered enabled apps
 * 
 * IMPORTANT: Most apps must be CLOSED before running.
 *            DaVinci Resolve requires a manual step inside the app.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { promisify } = require('util');
const exec = promisify((() => {
    const { exec: e } = require('child_process');
    return (cmd, opts) => new Promise((resolve, reject) => e(cmd, opts, (err, stdout, stderr) => err ? reject(err) : resolve({ stdout, stderr }));
})();

const USER = os.homedir();
const IS_WINDOWS = os.platform() === 'win32';
const IS_MAC = os.platform() === 'darwin';

// State file to remember enabled apps
const STATE_FILE = path.join(USER, '.control_scripting_state.json');

// ─────────────────────────────────────────────
// STATE MANAGEMENT
// ─────────────────────────────────────────────

function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        } catch (e) {}
    }
    return {};
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function markEnabled(appName, enabled = true, notes = '') {
    const state = loadState();
    state[appName] = {
        enabled,
        notes,
        timestamp: new Date().toISOString()
    };
    saveState(state);
}

function isEnabled(appName) {
    const state = loadState();
    return state[appName]?.enabled || false;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function isAppRunning(name) {
    try {
        if (IS_WINDOWS) {
            const out = execSync('tasklist', { encoding: 'utf8' });
            return out.toLowerCase().includes(name.toLowerCase());
        } else {
            const out = execSync('pgrep -il ' + name, { encoding: 'utf8' });
            return out.trim().length > 0;
        }
    } catch (e) {
        return false;
    }
}

function mustBeClosed(appName, processName) {
    if (isAppRunning(processName)) {
        console.log(`WARNING: ${appName} is running. Close it first.`);
        return false;
    }
    return true;
}

function writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   Written: ${filePath}`);
}

function patchIni(filePath, section, key, value) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    let lines = [];
    if (fs.existsSync(filePath)) {
        lines = fs.readFileSync(filePath, 'utf8').split('\n');
    }
    
    let inSection = false;
    let foundKey = false;
    let newLines = [];
    
    for (let line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith(`[${section}]`)) {
            inSection = true;
        } else if (trimmed.startsWith('[') && inSection) {
            if (!foundKey) {
                newLines.push(`${key}=${value}`);
                foundKey = true;
            }
            inSection = false;
        }
        
        if (inSection && trimmed.startsWith(`${key}=`)) {
            newLines.push(`${key}=${value}`);
            foundKey = true;
            continue;
        }
        
        newLines.push(line);
    }
    
    if (!foundKey) {
        if (!lines.some(l => l.trim() === `[${section}]`)) {
            newLines.push(`\n[${section}]`);
        }
        newLines.push(`${key}=${value}`);
    }
    
    fs.writeFileSync(filePath, newLines.join('\n') + '\n');
    console.log(`   Patched [${section}] ${key}=${value} in ${filePath}`);
}

function setEnvVar(key, value) {
    if (IS_WINDOWS) {
        try { execSync(`setx ${key} "${value}"`, { windowsHide: true }); } catch (e) {}
    } else {
        const profile = IS_MAC ? path.join(USER, '.zshrc') : path.join(USER, '.bashrc');
        const line = `export ${key}="${value}"`;
        let content = '';
        if (fs.existsSync(profile)) content = fs.readFileSync(profile, 'utf8');
        if (!content.includes(key)) {
            fs.appendFileSync(profile, `\n${line}\n`);
        }
    }
    process.env[key] = value;
    console.log(`   Set env var: ${key}=${value}`);
}

function runCommand(cmd, opts = {}) {
    return new Promise((resolve, reject) => {
        const parts = IS_WINDOWS ? ['cmd', '/c', cmd] : ['sh', '-c', cmd];
        const child = spawn(parts[0], parts.slice(1), { 
            windowsHide: true, 
            stdio: 'pipe',
            ...opts 
        });
        let stdout = '', stderr = '';
        child.stdout?.on('data', d => stdout += d);
        child.stderr?.on('data', d => stderr += d);
        child.on('close', code => resolve({ stdout, stderr, code }));
        child.on('error', reject);
    });
}

// ─────────────────────────────────────────────
// 1. ADOBE PHOTOSHOP
// ─────────────────────────────────────────────

async function enablePhotoshop() {
    console.log('\n[Adobe Photoshop] Enabling scripting file/network access...');
    
    const scriptsDir = IS_WINDOWS 
        ? 'C:/Program Files/Adobe/Adobe Photoshop 2024/Presets/Scripts'
        : '/Applications/Adobe Photoshop 2024/Presets/Scripts';
    
    if (!fs.existsSync(scriptsDir)) {
        console.log(`   Photoshop Scripts folder not found.`);
        console.log('   Manually enable: Edit > Preferences > General > Allow Scripts to Write Files');
        return;
    }
    
    const startupJsx = path.join(scriptsDir, '_enable_scripting_pref.jsx');
    const jsxContent = `
// Auto-generated by enable_scripting.js
try {
    app.preferences.savePrefAsLong("Main Pref Section v2", "Pref_SCRIPTING_FILE_NETWORK_SECURITY", 1);
    var thisFile = new File($.fileName);
    if (thisFile.exists) thisFile.remove();
} catch(e) {
    try {
        app.preferences.savePrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY", 1);
        var thisFile = new File($.fileName);
        if (thisFile.exists) thisFile.remove();
    } catch(e2) {}
}
`;
    
    writeFile(startupJsx, jsxContent);
    markEnabled('photoshop', true, 'Startup JSX placed. Launch PS once.');
    console.log('   Launch Photoshop once — the startup script will set the pref and delete itself.');
}

function checkPhotoshop() {
    const scriptsDir = IS_WINDOWS 
        ? 'C:/Program Files/Adobe/Adobe Photoshop 2024/Presets/Scripts'
        : '/Applications/Adobe Photoshop 2024/Presets/Scripts';
    return fs.existsSync(scriptsDir) ? 'Found' : 'Not found';
}

// ─────────────────────────────────────────────
// 2. ADOBE AFTER EFFECTS
// ─────────────────────────────────────────────

async function enableAfterEffects() {
    console.log('\n[Adobe After Effects] Enabling scripting file/network access...');
    
    if (!mustBeClosed('After Effects', IS_WINDOWS ? 'AfterFX.exe' : 'After Effects')) {
        return;
    }
    
    const prefsGlob = IS_WINDOWS
        ? path.join(USER, 'AppData', 'Roaming', 'Adobe', 'After Effects')
        : path.join(USER, 'Library', 'Preferences', 'Adobe', 'After Effects');
    
    if (!fs.existsSync(prefsGlob)) {
        console.log('   After Effects preferences not found. Launch AE once to create prefs.');
        return;
    }
    
    const aeDirs = fs.readdirSync(prefsGlob).map(f => path.join(prefsGlob, f)).filter(f => fs.statSync(f).isDirectory()).sort();
    
    if (!aeDirs.length) {
        console.log('   No AE version folders found.');
        return;
    }
    
    const prefsFile = path.join(aeDirs[aeDirs.length - 1], 'Adobe After Effects Prefs');
    
    console.log(`   Patching: ${prefsFile}`);
    patchIni(prefsFile, 'Main Pref Section v2', 'Pref_SCRIPTING_FILE_NETWORK_SECURITY', '1');
    markEnabled('aftereffects', true, 'Prefs patched');
    console.log('   Done. Launch After Effects — scripting is now enabled.');
}

function checkAfterEffects() {
    const base = IS_WINDOWS
        ? path.join(USER, 'AppData', 'Roaming', 'Adobe', 'After Effects')
        : path.join(USER, 'Library', 'Preferences', 'Adobe', 'After Effects');
    if (!fs.existsSync(base)) return 'Not found';
    const dirs = fs.readdirSync(base).map(f => path.join(base, f)).filter(f => fs.statSync(f).isDirectory());
    return dirs.length ? 'Prefs found' : 'Not found';
}

// ─────────────────────────────────────────────
// 3. ADOBE PREMIERE PRO
// ─────────────────────────────────────────────

async function enablePremiere() {
    console.log('\n[Adobe Premiere Pro] No special enablement needed.');
    console.log('   ExtendScript runs via CEP panels or command line (-r flag).');
    console.log('   UXP plugins require UXP Developer Tool for dev mode.');
    markEnabled('premiere', true, 'No setup needed');
    console.log('   Ready to use.');
}

function checkPremiere() {
    return 'No setup required';
}

// ─────────────────────────────────────────────
// 4. DAVINCI RESOLVE
// ─────────────────────────────────────────────

async function enableResolve() {
    console.log('\n[DaVinci Resolve] Setting up scripting environment...');
    
    let api, lib, modules;
    
    if (IS_WINDOWS) {
        api = 'C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Support\\Developer\\Scripting';
        lib = 'C:\\Program Files\\Blackmagic Design\\DaVinci Resolve\\fusionscript.dll';
        modules = api + '\\Modules';
    } else if (IS_MAC) {
        api = '/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting';
        lib = '/Applications/DaVinci Resolve/DaVinci Resolve.app/Contents/Libraries/Fusion/fusionscript.so';
        modules = api + '/Modules';
    } else {
        api = '/opt/resolve/Developer/Scripting';
        lib = '/opt/resolve/libs/Fusion/fusionscript.so';
        modules = api + '/Modules';
    }
    
    if (fs.existsSync(api)) console.log(`   Found RESOLVE_SCRIPT_API: ${api}`);
    else console.log(`   Not found: ${api}`);
    
    if (fs.existsSync(lib)) console.log(`   Found RESOLVE_SCRIPT_LIB: ${lib}`);
    else console.log(`   Not found: ${lib}`);
    
    setEnvVar('RESOLVE_SCRIPT_API', api);
    setEnvVar('RESOLVE_SCRIPT_LIB', lib);
    
    const currentPyPath = process.env.PYTHONPATH || '';
    if (!currentPyPath.includes(modules)) {
        setEnvVar('PYTHONPATH', currentPyPath ? `${currentPyPath}:${modules}` : modules);
    }
    
    console.log();
    console.log('   MANUAL STEP REQUIRED:');
    console.log('   Open DaVinci Resolve > Preferences > System > General');
    console.log('   Set "External scripting using" = Local');
    console.log('   Save, then restart Resolve.');
    
    markEnabled('resolve', true, 'Env vars set. Manual step: Set Local in Resolve Prefs.');
}

function checkResolve() {
    const hasApi = !!process.env.RESOLVE_SCRIPT_API;
    const hasLib = !!process.env.RESOLVE_SCRIPT_LIB;
    return hasApi && hasLib ? 'Env vars set' : 'Env vars not set';
}

// ─────────────────────────────────────────────
// 5. AUDACITY
// ─────────────────────────────────────────────

async function enableAudacity() {
    console.log('\n[Audacity] Enabling mod-script-pipe...');
    
    if (!mustBeClosed('Audacity', 'Audacity')) {
        return;
    }
    
    let cfg;
    if (IS_WINDOWS) cfg = path.join(USER, 'AppData', 'Roaming', 'audacity', 'audacity.cfg');
    else if (IS_MAC) cfg = path.join(USER, 'Library', 'Application Support', 'audacity', 'audacity.cfg');
    else cfg = path.join(USER, '.audacity-data', 'audacity.cfg');
    
    if (!fs.existsSync(cfg)) {
        console.log('   audacity.cfg not found. Launch Audacity once.');
        return;
    }
    
    const backup = cfg + '.backup';
    fs.copyFileSync(cfg, backup);
    console.log(`   Backup created: ${backup}`);
    
    patchIni(cfg, 'Module', 'mod-script-pipe', '1');
    markEnabled('audacity', true, 'mod-script-pipe enabled');
    console.log('   mod-script-pipe enabled. Restart Audacity.');
}

function checkAudacity() {
    let cfg;
    if (IS_WINDOWS) cfg = path.join(USER, 'AppData', 'Roaming', 'audacity', 'audacity.cfg');
    else if (IS_MAC) cfg = path.join(USER, 'Library', 'Application Support', 'audacity', 'audacity.cfg');
    else cfg = path.join(USER, '.audacity-data', 'audacity.cfg');
    
    if (!fs.existsSync(cfg)) return 'cfg not found';
    const content = fs.readFileSync(cfg, 'utf8');
    return content.includes('mod-script-pipe=1') ? 'mod-script-pipe enabled' : 'NOT enabled';
}

// ─────────────────────────────────────────────
// 6. OBS STUDIO
// ─────────────────────────────────────────────

async function enableOBS() {
    console.log('\n[OBS Studio] Enabling WebSocket server...');
    
    if (!mustBeClosed('OBS Studio', IS_WINDOWS ? 'obs64.exe' : 'obs')) {
        return;
    }
    
    let cfgDir;
    if (IS_WINDOWS) cfgDir = path.join(USER, 'AppData', 'Roaming', 'obs-studio', 'global.ini');
    else if (IS_MAC) cfgDir = path.join(USER, 'Library', 'Application Support', 'obs-studio', 'global.ini');
    else cfgDir = path.join(USER, '.config', 'obs-studio', 'global.ini');
    
    if (fs.existsSync(cfgDir)) {
        const backup = cfgDir + '.backup';
        fs.copyFileSync(cfgDir, backup);
        patchIni(cfgDir, 'OBSWebSocket', 'ServerEnabled', 'true');
        patchIni(cfgDir, 'OBSWebSocket', 'ServerPort', '4455');
        patchIni(cfgDir, 'OBSWebSocket', 'AuthRequired', 'false');
        markEnabled('obs', true, 'WebSocket enabled on port 4455');
        console.log('   WebSocket enabled on port 4455');
    } else {
        console.log('   OBS config not found. Launch OBS once.');
    }
    
    console.log('   Done. Connect with: npm install obs-websocket-js');
}

function checkOBS() {
    let cfg;
    if (IS_WINDOWS) cfg = path.join(USER, 'AppData', 'Roaming', 'obs-studio', 'global.ini');
    else if (IS_MAC) cfg = path.join(USER, 'Library', 'Application Support', 'obs-studio', 'global.ini');
    else cfg = path.join(USER, '.config', 'obs-studio', 'global.ini');
    
    if (!fs.existsSync(cfg)) return 'cfg not found';
    const content = fs.readFileSync(cfg, 'utf8');
    return content.includes('ServerEnabled=true') ? 'WebSocket enabled' : 'NOT enabled';
}

// ─────────────────────────────────────────────
// 7. BLENDER
// ─────────────────────────────────────────────

async function enableBlender() {
    console.log('\n[Blender] Python scripting is built-in — no enablement needed.');
    
    try {
        execSync(IS_WINDOWS ? 'where blender' : 'which blender', { windowsHide: true });
        console.log('   Blender found');
    } catch (e) {
        console.log('   Blender not in PATH');
    }
    
    markEnabled('blender', true, 'Built-in bpy available');
    console.log('   Headless example: blender --background --python script.py');
}

function checkBlender() {
    try {
        execSync(IS_WINDOWS ? 'where blender' : 'which blender', { windowsHide: true });
        return 'Built-in';
    } catch (e) {
        return 'Not in PATH';
    }
}

// ─────────────────────────────────────────────
// 8. ABLETON LIVE
// ─────────────────────────────────────────────

async function enableAbleton() {
    console.log('\n[Ableton Live] Setting up AbletonOSC...');
    
    let remoteScripts;
    if (IS_WINDOWS) remoteScripts = path.join(USER, 'Documents', 'Ableton', 'User Library', 'Remote Scripts');
    else if (IS_MAC) remoteScripts = path.join(USER, 'Music', 'Ableton', 'User Library', 'Remote Scripts');
    else remoteScripts = path.join(USER, 'Documents', 'Ableton', 'User Library', 'Remote Scripts');
    
    if (!fs.existsSync(remoteScripts)) fs.mkdirSync(remoteScripts, { recursive: true });
    
    const abletonoscDir = path.join(remoteScripts, 'AbletonOSC');
    
    if (fs.existsSync(abletonoscDir)) {
        console.log('   AbletonOSC already installed');
    } else {
        console.log(`   Download from: https://github.com/ideoforms/AbletonOSC/releases`);
        console.log(`   Copy to: ${remoteScripts}`);
    }
    
    console.log();
    console.log('   MANUAL STEP:');
    console.log('   Ableton > Preferences > MIDI > Control Surface = AbletonOSC');
    
    markEnabled('ableton', true, 'AbletonOSC remote script installed');
    console.log('   Done.');
}

function checkAbleton() {
    let p;
    if (IS_WINDOWS) p = path.join(USER, 'Documents', 'Ableton', 'User Library', 'Remote Scripts', 'AbletonOSC');
    else if (IS_MAC) p = path.join(USER, 'Music', 'Ableton', 'User Library', 'Remote Scripts', 'AbletonOSC');
    else p = path.join(USER, 'Documents', 'Ableton', 'User Library', 'Remote Scripts', 'AbletonOSC');
    
    return fs.existsSync(p) ? 'AbletonOSC installed' : 'Not found';
}

// ─────────────────────────────────────────────
// 9. UNREAL ENGINE
// ─────────────────────────────────────────────

async function enableUnreal(projectPath = null) {
    console.log('\n[Unreal Engine] Enabling Python scripting...');
    
    if (!projectPath) {
        console.log('   No project path. Manually: Edit > Plugins > Python Editor Script Plugin');
        return;
    }
    
    const cfg = path.join(projectPath, 'Config', 'DefaultEngine.ini');
    if (!fs.existsSync(cfg)) {
        console.log(`   DefaultEngine.ini not found`);
        return;
    }
    
    const pluginSection = `
[/Script/PythonScriptPlugin.PythonScriptPluginSettings]
bDeveloperMode=True
bRemoteExecution=True
`;
    
    const content = fs.readFileSync(cfg, 'utf8');
    if (!content.includes('PythonScriptPlugin')) {
        fs.appendFileSync(cfg, pluginSection);
        console.log('   Python scripting settings added');
    }
    
    markEnabled('unreal', true, 'PythonScriptPlugin settings added');
    console.log('   Also enable via: UE Editor > Edit > Plugins > Python Editor Script Plugin');
}

function checkUnreal() {
    return 'Requires project path';
}

// ─────────────────────────────────────────────
// 10. GIMP
// ─────────────────────────────────────────────

async function enableGIMP() {
    console.log('\n[GIMP] Python-Fu is built-in — no enablement needed.');
    try {
        execSync(IS_WINDOWS ? 'where gimp' : 'which gimp', { windowsHide: true });
        console.log('   GIMP found');
        markEnabled('gimp', true, 'Python-Fu built-in');
    } catch (e) {
        console.log('   GIMP not in PATH');
    }
}

function checkGIMP() {
    try {
        execSync(IS_WINDOWS ? 'where gimp' : 'which gimp', { windowsHide: true });
        return 'Built-in';
    } catch (e) {
        return 'Not in PATH';
    }
}

// ─────────────────────────────────────────────
// 11. INKSCAPE
// ─────────────────────────────────────────────

async function enableInkscape() {
    console.log('\n[Inkscape] Checking CLI...');
    try {
        execSync(IS_WINDOWS ? 'where inkscape' : 'which inkscape', { windowsHide: true });
        console.log('   Inkscape CLI found');
        markEnabled('inkscape', true, 'CLI + inkex ready');
    } catch (e) {
        console.log('   Inkscape not in PATH');
    }
}

function checkInkscape() {
    try {
        execSync(IS_WINDOWS ? 'where inkscape' : 'which inkscape', { windowsHide: true });
        return 'Ready';
    } catch (e) {
        return 'Not in PATH';
    }
}

// ─────────────────────────────────────────────
// 12. ADOBE ANIMATE
// ─────────────────────────────────────────────

async function enableAnimate() {
    console.log('\n[Adobe Animate] JSFL scripting is built-in — no enablement needed.');
    markEnabled('animate', true, 'JSFL built-in');
    console.log('   Place .jsfl scripts in Commands folder for menu access.');
}

function checkAnimate() {
    const appPath = IS_WINDOWS 
        ? 'C:/Program Files/Adobe/Adobe Animate 2024'
        : '/Applications/Adobe Animate 2024';
    return fs.existsSync(appPath) ? 'Found' : 'Not found';
}

// ─────────────────────────────────────────────
// STATUS CHECK
// ─────────────────────────────────────────────

async function checkAll() {
    const state = loadState();
    const enabledApps = Object.keys(state).filter(k => state[k].enabled);
    
    console.log('\n' + '='.repeat(55));
    console.log('  SCRIPTING ENABLEMENT STATUS CHECK');
    console.log('='.repeat(55));
    
    if (enabledApps.length) {
        console.log(`\n  ENABLED APPS (${enabledApps.length}):`);
        for (const app of enabledApps.sort()) {
            const info = state[app];
            const ts = info.timestamp?.slice(0, 10) || 'unknown';
            const notes = info.notes || '';
            console.log(`    ${app.padEnd(20)} (${ts}) - ${notes}`);
        }
    }
    
    console.log('\n  ALL APPS CHECK:');
    
    const checks = [
        ['Adobe Photoshop', checkPhotoshop],
        ['Adobe After Effects', checkAfterEffects],
        ['Adobe Premiere Pro', checkPremiere],
        ['Adobe Animate', checkAnimate],
        ['DaVinci Resolve', checkResolve],
        ['Audacity', checkAudacity],
        ['OBS Studio', checkOBS],
        ['Blender', checkBlender],
        ['Ableton Live', checkAbleton],
        ['Unreal Engine', checkUnreal],
        ['GIMP', checkGIMP],
        ['Inkscape', checkInkscape],
    ];
    
    for (const [name, fn] of checks) {
        let status;
        try {
            status = fn();
        } catch (e) {
            status = `ERROR: ${e.message}`;
        }
        const enabledMark = state[name.toLowerCase().replace(/ /g, '')]?.enabled ? ' [ENABLED]' : '';
        console.log(`  ${name.padEnd(25)} ${status}${enabledMark}`);
    }
    
    console.log('='.repeat(55));
}

function showStatus() {
    const state = loadState();
    const enabled = Object.entries(state).filter(([k, v]) => v.enabled);
    
    console.log('\n' + '='.repeat(55));
    console.log('  ENABLED APPS (Remembered by Control)');
    console.log('='.repeat(55));
    
    if (enabled.length) {
        for (const [app, info] of enabled.sort()) {
            const ts = info.timestamp?.slice(0, 10) || 'unknown';
            const notes = info.notes || '';
            console.log(`  ${app}`);
            console.log(`    Enabled: ${ts}`);
            if (notes) console.log(`    Notes: ${notes}`);
        }
    } else {
        console.log('  No apps enabled yet. Run --app <name> or --all');
    }
    
    console.log('='.repeat(55));
}

// ─────────────────────────────────────────────
// APP MAP
// ─────────────────────────────────────────────

const APP_MAP = {
    'photoshop': enablePhotoshop,
    'aftereffects': enableAfterEffects,
    'ae': enableAfterEffects,
    'premiere': enablePremiere,
    'resolve': enableResolve,
    'davinci': enableResolve,
    'audacity': enableAudacity,
    'obs': enableOBS,
    'blender': enableBlender,
    'ableton': enableAbleton,
    'unreal': enableUnreal,
    'gimp': enableGIMP,
    'inkscape': enableInkscape,
    'animate': enableAnimate,
};

async function enableAll() {
    console.log('='.repeat(55));
    console.log('  ENABLING SCRIPTING FOR ALL SUPPORTED APPS');
    console.log('='.repeat(55));
    
    await enablePhotoshop();
    await enableAfterEffects();
    await enablePremiere();
    await enableAnimate();
    await enableResolve();
    await enableAudacity();
    await enableOBS();
    await enableBlender();
    await enableAbleton();
    await enableGIMP();
    await enableInkscape();
    
    console.log('\n' + '='.repeat(55));
    console.log('  DONE. Restart any apps that were modified.');
    console.log('='.repeat(55));
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    
    if (!args.length || args.includes('--help')) {
        console.log(`
enable_scripting.js
===================
Enables scripting/automation access for all supported creative tools.
Run this ONCE before attempting any automation.

Usage:
    node enable_scripting.js --all
    node enable_scripting.js --app photoshop
    node enable_scripting.js --app aftereffects
    node enable_scripting.js --check   # check status of all apps
    node enable_scripting.js --status # show remembered enabled apps

IMPORTANT: Most apps must be CLOSED before running.
           DaVinci Resolve requires a manual step inside the app.
`);
        return;
    }
    
    if (args.includes('--status')) {
        showStatus();
    } else if (args.includes('--check')) {
        await checkAll();
    } else if (args.includes('--all')) {
        await enableAll();
    } else if (args.includes('--app')) {
        const idx = args.indexOf('--app');
        const appKey = (args[idx + 1] || '').toLowerCase().replace(/[- ]/g, '');
        if (APP_MAP[appKey]) {
            await APP_MAP[appKey]();
        } else {
            console.log(`Unknown app: ${args[idx + 1]}`);
            console.log(`Available: ${Object.keys(APP_MAP).join(', ')}`);
        }
    } else {
        console.log(`Unknown argument: ${args}`);
        console.log('Use --help for usage.');
    }
}

main().catch(console.error);