# Native Scripting Methods for Creative Software

> **Purpose:** Control's complete reference for native scripting of every creative app.
> **Rule:** GUI automation (`pyautogui`) is LAST resort — use native scripting first.
> **Both READ and WRITE:** These scripting methods work for BOTH reading software state AND modifying it.

---

## THE ADOBE SCRIPTING STACK

| Layer | Language | Status | Best For |
|---|---|---|---|
| **ExtendScript** | JavaScript ES3 (`.jsx`) | Legacy — still works | Quick automation scripts |
| **CEP** (Common Extensibility Platform) | HTML/CSS/JS + ExtendScript | Being phased out (Premiere: Sept 2026) | Panel UIs, complex workflows |
| **UXP** (Unified Extensibility Platform) | JavaScript ES6+ (`.psjs`) | **Current & Future** | Modern plugins |

**AI PROACTIVE THINKING CHECKLIST** — When user mentions ANY creative app, automatically think:
1. What file type? (Image, video, audio, 3D, etc.)
2. Does this app support scripting? What language?
3. Are permissions enabled? (Use `enable_scripting` tool)
4. What's the native API/library instead of GUI clicking?
5. Should I manage assets? (Import, organize, replace, relink)
6. Use temp folder for outputs?

**Rule of thumb:**
- For **scripting/automation** → ExtendScript (still the standard for most apps)
- For **plugins/panels** → UXP (modern, async/await, ES6+)
- **Premiere Pro** → Moving to UXP (ExtendScript until Sept 2026)
- **Animate** → **JSFL only** (its own separate JS flavor, NOT ExtendScript)

---

## ADOBE APPS - SCRIPTING REFERENCE

### 1. Adobe After Effects
**Script:** ExtendScript (`.jsx`) — UXP in development

**READ (Query State):**
```javascript
// List all compositions
for (var i = 1; i <= app.project.numItems; i++) {
    if (app.project.item(i) instanceof CompItem) {
        $.writeln("Comp: " + app.project.item(i).name);
    }
}

// Get all layers in active composition
var comp = app.project.activeItem;
for (var i = 1; i <= comp.layers.length; i++) {
    var layer = comp.layers[i];
    $.writeln(layer.name + " - " + layer.type);
}

// Query property values
var pos = comp.layers[1].property("Transform").property("Position").value;
var scale = comp.layers[1].property("Transform").property("Scale").value;
```

**WRITE (Modify):**
```javascript
// Create composition and text layer
var comp = app.project.items.addComp("Main", 1920, 1080, 1, 10, 24);
var textLayer = comp.layers.addText("Hello World");
textLayer.property("Transform").property("Position").setValue([960, 540]);
```

**ASSET MANAGEMENT:**
```javascript
// 1. Create folder structure
var folder = app.project.items.addFolder('CONTROL_ASSETS');

// 2. Import file
var importOptions = new ImportOptions(new File('C:/path/asset.png'));
var footage = app.project.importFile(importOptions);
footage.parentFolder = folder;

// 3. Auto-scale to fit composition
var layer = comp.layers.add(footage);
var scaleX = (comp.width / footage.width) * 100;
var scaleY = (comp.height / footage.height) * 100;
layer.property('Scale').setValue([Math.min(scaleX, scaleY), Math.min(scaleX, scaleY)]);

// 4. Replace source for personalization
layer.replaceSource(new File('C:/new_path/user_photo.png'), false);

// 5. Fix missing footage
for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (item.footageMissing) {
        item.replace(new File('C:/new_path/asset.png'));
    }
}

// 6. Import image sequence (from Blender 3D renders)
var seqOptions = new ImportOptions(new File('C:/path/render_0001.png'));
seqOptions.sequence = true;
app.project.importFile(seqOptions);

// 7. Project cleanup
app.project.consolidateFootage();
app.project.removeUnusedFootage();
```

**Run from terminal:**
```powershell
# Windows:
"C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.exe" -r "C:\scripts\script.jsx"
```

**SMART WORKFLOW:**
```json
// 1. Check if scripting is enabled
{ "action": "enable_scripting", "parameters": { "app": "aftereffects", "mode": "status" } }
// 2. Only enable if needed
{ "action": "enable_scripting", "parameters": { "app": "aftereffects" } }
// 3. Wait briefly if just enabled or launched AE
{ "action": "wait", "parameters": { "duration": 2 } }
// 4. Verify target app is ready
{ "action": "screenshot" }
// 5. RunExtendScript
{ "action": "run_extendscript", "parameters": { "script": "..." } }
```

**Common ExtendScript Errors:**
- Script runs but does nothing → App not fully loaded, or syntax error
- Check error log: `C:\Users\<user>\AppData\Local\Temp\ae_control_error.log`
- If script fails, check if app is responding first

**ALWAYS TRY EXTENDSCRIPT FIRST:**
For After Effects, ALWAYS try `run_extendscript` FIRST before GUI:
1. ExtendScript is faster, more precise, and repeatable
2. Only use GUI if ExtendScript truly fails
3. Check error log for ExtendScript bugs, then decide

Example - Try ExtendScript first, then GUI if it fails:
```json
// Try ExtendScript FIRST (preferred)
{ "action": "run_extendscript", "parameters": { "script": "..." } }
// If fails, THEN use GUI
{ "action": "screenshot" }
{ "action": "click", "parameters": { "x": 100, "y": 80 } }
```

**Permissions:** Requires editing Prefs file:
```powershell
$prefPath = "$env:APPDATA\Adobe\After Effects\24.0\Adobe After Effects 2024 Prefs-indep-general.txt"
if (Test-Path $prefPath) {
    $content = Get-Content $prefPath -Raw
    if ($content -notmatch 'Pref_SCRIPTING_FILE_NETWORK_SECURITY.*=.*1') {
        Add-Content -Path $prefPath -Value "`n`n[User Preferences]
Pref_SCRIPTING_FILE_NETWORK_SECURITY = 1" -NoNewline
    }
}
```

---

### 2. Adobe Photoshop
**Script:** ExtendScript (`.jsx`) → transitioning to **UXP** (`.psjs`)

```javascript
// ExtendScript (current standard)
var doc = app.open(new File("/path/to/image.psd"));
var layer = doc.artLayers.getByName("Background");
layer.visible = false;
doc.exportDocument(new File("/output/image.png"), ExportType.SAVEFORWEB);
app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
```

```javascript
// UXP (modern/future)
const { app } = require("photoshop");
const doc = app.activeDocument;
await doc.flatten();
await doc.save();
```

**Run from terminal:**
```python
import subprocess
subprocess.run([
    "C:/Program Files/Adobe/Adobe Photoshop 2024/Photoshop.exe",
    "-r", "C:/scripts/myscript.jsx"
])
```

**Permissions:** Enabled by default — no special setup needed.

---

### 3. Adobe Illustrator
**Script:** ExtendScript (`.jsx`)

```javascript
var doc = app.documents.add();
var rect = doc.pathItems.rectangle(500, 100, 200, 150);
rect.filled = true;
rect.fillColor = new RGBColor();
rect.fillColor.red = 255;
doc.exportFile(new File("/output/file.svg"), ExportType.SVG);
```

**Permissions:** Enabled by default.

---

### 4. Adobe Premiere Pro
**Script:** ExtendScript (`.jsx`) → **Moving to UXP** (Sept 2026)

```javascript
var proj = app.project;
var seq = proj.activeSequence;
var track = seq.videoTracks[0];
for (var i = 0; i < track.clips.numItems; i++) {
    $.writeln(track.clips[i].name);
}
// Export via AME
app.encoder.encodeSequence(seq, "/output/export.mp4", "H.264", "Match Source - Adaptive High Bitrate", false);
```

**Permissions:** UXP enabled by default.

---

### 5. Adobe Animate ⚠️ CRITICAL: Uses JSFL, NOT ExtendScript
**Script:** **JSFL** (JavaScript Flash Language) — completely separate from ExtendScript

```javascript
// JSFL (NOT ExtendScript!)
fl.createDocument("timeline");
var doc = fl.getDocumentDOM();
doc.addNewRectangle({left: 0, top: 0, right: 100, bottom: 100}, 0);
doc.addNewText({left: 150, top: 50, right: 350, bottom: 100});
doc.save(false);
```

**Run from terminal:**
```bash
# Windows:
"C:\Program Files\Adobe\Adobe Animate 2024\Animate.exe" "C:\scripts\myscript.jsfl" -AlwaysRunJSFL
```

**Permissions:** JSFL enabled by default.

---

### 6. Adobe Audition
**Script:** COM/VBScript (Windows)

```python
# Python via COM
from win32com.client import Dispatch
aud = Dispatch("Audition.Application")
aud.OpenProjectFile("/path/to/project.psp")
```

**Permissions:** Enabled by default.

---

## OTHER CREATIVE SOFTWARE

### DaVinci Resolve
**Script:** DaVinci Resolve Python API

```python
import DaVinciResolveScript as dvr
resolve = dvr.scriptapp("Resolve")
pm = resolve.GetProjectManager()
project = pm.CreateProject("My Project")
```

**Install:** `pip install pydavinci`

---

### Blender
**Script:** bpy (Python)

```python
import bpy
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0,0,0))
```

```bash
# Headless:
blender --background scene.blend --python my_script.py
```

**Install:** `pip install bpy`

---

### GIMP
**Script:** Python-Fu

```bash
gimp --no-interface --batch-interpreter python-fu-eval -b "
import gimp, gimpconstants
img = pdb.gimp_file_load(RUN_NONINTERACTIVE, '/input/photo.jpg', 'photo.jpg')
pdb.gimp_brightness_contrast(img.active_drawable, 20, 30)
pdb.file_png_save(RUN_NONINTERACTIVE, img, img.active_drawable, '/output/photo.png', 'photo.png', 0,9,1,1,1,1,1)
" -b "(gimp-quit 0)"
```

**Install:** Built-in — no install needed.

---

### Inkscape
**Script:** inkex Python extension

```bash
# CLI (fully headless)
inkscape input.svg --export-filename=output.png --export-dpi=300
```

```python
# inkex extension
import inkex
class RedFill(inkex.EffectExtension):
    def effect(self):
        for elem in self.svg.selection:
            elem.style['fill'] = '#ff0000'
```

**Install:** `pip install inkex`

---

### OBS Studio
**Script:** obs-websocket

```python
from obswebsocket import obsws, requests as obsreq
ws = obsws("localhost", 4455, "password")
ws.connect()
ws.call(obsreq.SetCurrentProgramScene(sceneName="Main"))
ws.disconnect()
```

**Install:** `pip install obs-websocket-py`

---

### HandBrake
**Script:** HandBrakeCLI

```python
import subprocess
subprocess.run([
    "HandBrakeCLI",
    "-i", "/input/video.mp4",
    "-o", "/output/compressed.mp4",
    "--preset", "Fast 1080p30"
])
```

**Install:** Download HandBrake CLI.

---

### AutoCAD
**Script:** pyautocad via COM

```python
from pyautocad import Autocad, APoint
acad = Autocad(create_if_not_exists=True)
acad.model.AddLine(APoint(0, 0, 0), APoint(100, 100, 0))
```

**Install:** `pip install pyautocad pywin32`

---

### Cinema 4D
**Script:** c4d Python module

```python
import c4d
cube = c4d.BaseObject(c4d.Ocube)
doc.InsertObject(cube)
c4d.EventAdd()
```

```bash
# Headless:
/path/to/c4dpy my_script.py
```

**Install:** Built-in — use c4dpy CLI.

---

### CorelDRAW
**Script:** VBA / COM

```python
from win32com.client import Dispatch
app = Dispatch("CorelDRAW.Application")
doc = app.NewDocument("", 1, 210, 297, 0, 1, 300, 300)
```

**Install:** `pip install pywin32`

---

### Figma
**Script:** REST API (read) / Plugin API (read/write)

```python
import requests
headers = {"X-Figma-Token": "YOUR_TOKEN"}
file = requests.get("https://api.figma.com/v1/files/FILE_KEY", headers=headers).json()
```

**Install:** `pip install requests`

---

### UI / Interface Control (Control App Itself)
Control exposes scripting interfaces for AI to interact with its own UI:

| Interface | Method | Purpose |
|---|---|---|
| **window.chatAPI** | `executeTask()` | Execute task in ACT/ASK mode |
| **window.chatAPI** | `sendMessage()` | Send message to AI |
| **window.chatAPI** | `stopAction()` | Stop current task |
| **window.chatAPI** | `onAIResponse()` | Listen for AI responses |
| **window.chatAPI** | `onActionStart/Complete()` | Listen for actions |
| **window.chatAPI** | `addMessage()` | Add message to chat |
| **window.chatAPI** | `speakGreeting()` | Text-to-speech |
| **window.electronAPI** | `dragWindow()` | Move window |
| **window.electronAPI** | `openExternal()` | Open URL in browser |

**JavaScript Examples:**
```javascript
// Execute a task
await window.chatAPI.executeTask({
    type: 'execute_task',
    text: 'Open notepad and type hello',
    attachments: []
}, 'act');

// Add a message to chat
window.chatAPI.addMessage('Hello from script!', 'ai');

// Listen for AI response
window.chatAPI.onAIResponse((event, data) => {
    console.log('AI said:', data.text);
});

// Drag window
window.electronAPI.dragWindow({ deltaX: 10, deltaY: 0 });
```

---

### Canva
**Script:** REST API

```python
import requests
headers = {"Authorization": "Bearer TOKEN"}
designs = requests.get("https://api.canva.com/rest/v1/designs", headers=headers).json()
```

**Install:** `pip install requests`

---

### Ableton Live
**Script:** AbletonOSC + pylive

```python
import live
s = live.Set()
s.scan()
s.tempo = 128.0
s.start_playing()
```

**Install:** `pip install pylive python-osc`

---

### Audacity
**Script:** mod-script-pipe

```python
to_pipe = open('/tmp/audacity_script_pipe.to.1000', 'w')
from_pipe = open('/tmp/audacity_script_pipe.from.1000', 'rt')
to_pipe.write("Import2: Filename=/audio/voice.wav\n")
to_pipe.flush()
```

**Install:** Enable mod-script-pipe in Audacity preferences.

---

### Lightroom Classic
**Script:** Lua SDK

```lua
local LrApplication = import "LrApplication"
local catalog = LrApplication.activeCatalog()
```

**Install:** Download Lua SDK from Adobe Developer portal.

---

## MASTER REFERENCE TABLE

| Software | Native Script | Language | File Ext | Headless | Platform |
|---|---|---|---|---|---|
| **After Effects** | ExtendScript | JS ES3 | `.jsx` | ❌ | Win/Mac |
| **Photoshop** | ExtendScript/UXP | JS | `.jsx`/`.psjs` | ❌ | Win/Mac |
| **Illustrator** | ExtendScript | JS ES3 | `.jsx` | ❌ | Win/Mac |
| **Premiere Pro** | ExtendScript→UXP | JS | `.jsx` | ❌ | Win/Mac |
| **Animate** | **JSFL** | **JS (custom)** | **`.jsfl`** | ❌ | Win/Mac |
| **Audition** | COM | Python/VBA | — | ❌ | Win |
| **Lightroom Classic** | Lua SDK | Lua | `.lua` | ❌ | Win/Mac |
| **DaVinci Resolve** | Python API | Python | `.py` | ❌ | Win/Mac |
| **Blender** | bpy | Python | `.py` | ✅ | All |
| **GIMP** | Python-Fu | Python | `.py` | ✅ | All |
| **Inkscape** | inkex/CLI | Python | `.py` | ✅ | All |
| **OBS Studio** | WebSocket | Python | `.py` | ❌ | All |
| **HandBrake** | CLI | Python | — | ✅ | All |
| **AutoCAD** | COM/pyautocad | Python | `.py` | ❌ | Win |
| **Cinema 4D** | c4dpy | Python | `.py` | ✅ | Win/Mac |
| **CorelDRAW** | COM/VBA | Python | — | ❌ | Win |
| **Figma** | REST API | Python | — | ✅ | Cloud |
| **Canva** | REST API | Python | — | ✅ | Cloud |
| **Ableton Live** | OSC/pylive | Python | `.py` | ❌ | Win/Mac |
| **Audacity** | mod-script-pipe | Python | `.py` | ❌ | All |
| **Final Cut Pro** | FCPXML | Python | `.fcpxml` | ❌ | Mac |
| **Unreal Engine** | unreal module | Python | `.py` | ❌ | Win/Mac |
| **Unity** | CLI + C# | C# | `.cs` | ✅ | All |
| **Sketch** | sketchtool/CocoaScript | JS | `.sketchplugin` | ✅ | Mac |

---

## PYTHON BRIDGE TEMPLATES

```python
import subprocess, os

def run_jsx(script, app_name="Adobe After Effects 2024", exe_path=None):
    """Run ExtendScript .jsx from Python on Windows"""
    import tempfile
    tmp = tempfile.NamedTemporaryFile(suffix='.jsx', delete=False, mode='w', encoding='utf-8')
    tmp.write(script)
    tmp.close()
    if not exe_path:
        exe_path = f"C:/Program Files/Adobe/{app_name}/Support Files/AfterFX.exe"
    subprocess.run([exe_path, "-r", tmp.name], windowsHide=True)
    os.unlink(tmp.name)

def run_jsfl(script_path, app_path=None):
    """Run JSFL for Adobe Animate"""
    if not app_path:
        app_path = r"C:\Program Files\Adobe\Adobe Animate 2024\Animate.exe"
    subprocess.Popen([app_path, script_path, "-AlwaysRunJSFL"])

def run_blender(script_path, blend_file=""):
    """Run Python script in Blender headlessly"""
    cmd = ["blender", "--background"]
    if blend_file:
        cmd.append(blend_file)
    cmd += ["--python", script_path]
    subprocess.run(cmd)

def run_handbrake(input_file, output_file, preset="Fast 1080p30"):
    """Run HandBrakeCLI"""
    subprocess.run([
        "HandBrakeCLI",
        "-i", input_file,
        "-o", output_file,
        "--preset", preset
    ])
```

---

(End of file - last updated: 2026-04-25)