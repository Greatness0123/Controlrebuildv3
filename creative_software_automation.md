# Creative Software Automation: Terminal Control Reference

> **For all entries:**
> - **Install check:** `pip show <package>` before installing
> - **Base requirement:** Python 3.x (`python --version`)
> - **All pip installs:** `pip install <package>`

> **📚 IMPORTANT - Library Suggestions File:**
> Before starting any automation task, the AI should read `ai_library_suggestions.md`
> This file contains the recommended libraries for each software, download links,
> installation commands, and platform notes. The AI should use this as the primary
> reference for library selection.

---

## TIER LEGEND
- 🟢 **Native / Deep API** — Official or near-official scripting layer; full programmatic control
- 🟡 **Bridge/Wrapper** — Python wraps the app's own scripting engine; very capable
- 🟠 **GUI Automation** — Controls the app via mouse/keyboard simulation; works on any app
- 🔴 **Limited/Workaround** — No real API; indirect or partial control only

---

## GRAPHICS & PHOTOGRAPHY

---

### 1. Adobe Photoshop 🟡
**Best Library:** `photoshop-python-api` + `pywin32`

**What it can do:**
- Open, create, save, and export documents (PSD, PNG, JPEG, TIFF, etc.)
- Full layer control: create, delete, merge, group, rename, toggle visibility
- Adjustments: brightness/contrast, hue/saturation, curves, levels
- Apply filters and effects
- Edit text layer content, font, size, color
- Resize, crop, rotate, flip documents
- Run batch operations across hundreds of files
- Export assets to web formats

**Limitations:**
- Windows only (COM-based); macOS requires AppleScript or `appscript`
- Cannot run headlessly — Photoshop GUI must be open
- Some advanced/newer features not in the DOM require Action Manager code
- Container indices are 1-based (not 0-based)

**How to use:**
```python
# pip install photoshop-python-api pywin32
import photoshop.api as ps

app = ps.Application()
doc = app.open("C:/path/to/file.psd")
layer = doc.artLayers.getByName("Background")
layer.visible = False
doc.save()
```

**Install:**
```bash
pip install photoshop-python-api pywin32
```

---

### 2. Adobe Illustrator 🟡
**Best Library:** `pywin32` (via COM interface)

**What it can do:**
- Create/open/close/save AI and SVG documents
- Create path items, shapes (rectangles, ellipses, polygons)
- Add and modify text frames (point text, area text)
- Manipulate layers: add, delete, rename, show/hide
- Export to JPEG, PNG, SVG, PDF
- Change fill/stroke colors (RGB and CMYK)
- Access and modify all document symbols, variables, and tags

**Limitations:**
- Windows COM only (Mac requires AppleScript path)
- Illustrator must be running (no headless mode)
- No direct pip package — uses raw COM dispatch
- Documentation is scattered; must cross-reference VBScript API docs

**How to use:**
```python
# pip install pywin32
from win32com.client import Dispatch

app = Dispatch("Illustrator.Application")
doc = app.Documents.Add()
rect = doc.PathItems.Rectangle(700, 50, 100, 100)
text = doc.TextFrames.Add()
text.Contents = "Hello from Python"
doc.Export("C:/output/file.svg", 1)  # aiSVG = 1
```

**Install:**
```bash
pip install pywin32
```

---

### 3. Affinity Photo 🟠
**Best Library:** `pyautogui` (macOS: `pyobjc` for Accessibility API)

**What it can do:**
- Run built-in Macros via menu simulation
- Trigger batch job workflows
- Click menus, open files, apply filters, export
- On macOS: navigate accessibility tree (AXUIElement) for more precise control

**Limitations:**
- **No public scripting API exists** — Serif/Canva has no plans to add one
- Automation is entirely GUI-driven; fragile to UI changes
- Cannot run headlessly
- Version-specific menu paths differ (v1 vs v2)
- Must grant Accessibility permissions to Terminal on macOS

**How to use:**
```python
# pip install pyautogui pillow
import pyautogui, time
pyautogui.hotkey('ctrl', 'o')  # Open file dialog
time.sleep(1)
pyautogui.write('C:/image.jpg')
pyautogui.press('enter')
```

**Install:**
```bash
pip install pyautogui pillow
# macOS only (for accessibility tree control):
pip install pyobjc-core pyobjc
```

---

### 4. Affinity Designer 🟠
**Best Library:** `pyautogui` / `pyobjc` (same as Affinity Photo)

**What it can do:** Same as Affinity Photo — menu simulation, macro playback, batch export via GUI automation.

**Limitations:** Identical to Affinity Photo. No scripting API. Consider Inkscape for heavily automated vector workflows.

**Install:**
```bash
pip install pyautogui pillow
```

---

### 5. GIMP 🟢
**Best Library:** `gimpfu` (built-in Python-Fu) — **no install needed**

**What it can do:**
- Full programmatic image editing: filters, levels, curves, color balance
- Batch processing entire folders of images
- Script filters, effects, and exports from terminal via `gimp --batch`
- Create/modify layers, channels, selections, paths
- Run completely non-interactively (headless with `--no-interface`)
- Call any GIMP procedure through Python-Fu

**Limitations:**
- Uses GIMP's embedded Python interpreter (not system Python)
- Script-Fu (Scheme) is the "native" language; Python-Fu wraps it
- Some operations require running from within GIMP's batch mode

**How to use (terminal batch):**
```bash
gimp --no-interface --batch '
(python-fu-eval
  "from gimpfu import *
   img = pdb.gimp_file_load(RUN_NONINTERACTIVE, \"/in/photo.jpg\", \"photo.jpg\")
   pdb.gimp_brightness_contrast(img.active_drawable, 20, 30)
   pdb.file_png_save(RUN_NONINTERACTIVE, img, img.active_drawable, \"/out/photo.png\", \"photo.png\", 0,9,1,1,1,1,1)"
)
(gimp-quit 0)'
```

**Install:**
```bash
# GIMP itself ships with Python-Fu
# No additional install needed. Just install GIMP:
# Windows/macOS: https://www.gimp.org/downloads/
# Linux: sudo apt install gimp
```

---

### 6. Inkscape 🟢
**Best Library:** Inkscape CLI + `inkex` Python extension library

**What it can do:**
- Full headless/terminal operation: `inkscape --export-png`, `--export-pdf`, etc.
- Convert SVG to PNG, PDF, EPS, EMF from the command line
- Apply transformations, resize, set DPI
- Write custom extensions with `inkex` that manipulate SVG XML directly
- Batch convert entire directories of files

**Limitations:**
- `inkex` extensions run inside Inkscape's process, not standalone (for complex edits)
- Terminal CLI handles exports well but not interactive editing
- Complex filter/effect manipulation requires extension development

**How to use:**
```bash
# CLI export (no Python needed):
inkscape input.svg --export-filename=output.png --export-dpi=300

# Python extension using inkex:
# pip install inkex
import inkex
class MyExtension(inkex.EffectExtension):
    def effect(self):
        for elem in self.svg.selection:
            elem.style['fill'] = '#ff0000'
```

**Install:**
```bash
pip install inkex
# Inkscape itself: https://inkscape.org/release/
```

---

### 7. Canva 🟢
**Best Library:** `requests` + Canva Connect API (REST)

**What it can do:**
- Create, read, update, and delete designs via REST API
- Export designs to PNG, JPG, PDF, MP4
- Manage assets (upload images, fonts)
- Autofill templates with dynamic data
- Access design metadata and structure

**Limitations:**
- Web/API only — cannot control the Canva desktop/browser app GUI directly
- Write access to design files requires specific API scopes
- Rate limits apply
- Full design creation (placing elements) is limited compared to desktop

**How to use:**
```python
# pip install requests
import requests

headers = {"Authorization": "Bearer YOUR_TOKEN"}
r = requests.get("https://api.canva.com/rest/v1/designs", headers=headers)
designs = r.json()
```

**Install:**
```bash
pip install requests
```

---

### 8. Adobe Lightroom 🟡
**Best Library:** Lightroom SDK (Lua-based plugin) + `lightroom-sdk-python` wrapper OR Adobe Lightroom REST API

**What it can do:**
- Adobe Lightroom Classic: Lua SDK plugins for export presets, metadata editing, batch ops
- Adobe Lightroom (cloud): REST API for asset management, album operations, metadata
- Batch RAW processing via export presets triggered from plugins
- Metadata read/write (EXIF, IPTC, XMP)

**Limitations:**
- Lightroom Classic SDK is **Lua**, not Python — Python wraps Lua or uses COM
- Cloud Lightroom API lacks fine-grained editing controls (no curves/adjustments via API)
- No headless execution for Classic
- API access requires Adobe Developer credentials + OAuth

**How to use:**
```python
# Adobe Lightroom REST API (cloud version)
# pip install requests
import requests
# Use OAuth2 to get access_token, then:
headers = {"Authorization": f"Bearer {access_token}"}
r = requests.get("https://lr.adobe.io/v2/catalog", headers=headers)
```

**Install:**
```bash
pip install requests
# Lightroom Classic SDK: https://developer.adobe.com/lightroom-sdk/
```

---

### 9. CorelDRAW 🟡
**Best Library:** `pywin32` (COM automation via `CorelDRAW.Application`)

**What it can do:**
- Open, create, save, export documents
- Create and manipulate vector shapes (rectangles, ellipses, curves)
- Apply fills, outlines, transformations
- Add/edit text frames
- Export to PDF, PNG, SVG, JPG

**Limitations:**
- Windows only (COM interface)
- Less community documentation than Photoshop/Illustrator COM
- Must have CorelDRAW running

**How to use:**
```python
# pip install pywin32
from win32com.client import Dispatch

app = Dispatch("CorelDRAW.Application")
doc = app.NewDocument("", 1, 210, 297, 0, 1, 300, 300)  # A4 doc
layer = doc.ActivePage.ActiveLayer
rect = layer.CreateRectangle2(10, 10, 100, 50)
doc.SaveAs("C:/output/file.cdr")
```

**Install:**
```bash
pip install pywin32
```

---

### 10. Pixlr 🔴
**Best Library:** N/A — web-based only, no public API or CLI

**What it can do:** Pixlr is a cloud editor with no official scripting API or terminal access.

**Best Alternative:** Use `Pillow` (PIL) for programmatic image processing tasks, or GIMP CLI.

**Install:**
```bash
pip install Pillow
```

---

## VIDEO & MOTION GRAPHICS

---

### 1. Adobe Premiere Pro 🟡
**Best Library:** `pymiere`

**What it can do:**
- Open, create, save Premiere projects
- Import media into project bins
- Add/remove/reorder clips on timeline sequences
- Set clip in/out points and speed
- Apply video/audio effects and transitions
- Export via AME (Adobe Media Encoder) render queue
- Access metadata of all clips and sequences

**Limitations:**
- Premiere Pro **must be running** (no headless)
- Requires installing a companion Node.js extension (`Pymiere Link`) inside Premiere
- Tested up to Premiere Pro 2023; newer versions may need testing

**How to use:**
```python
# pip install pymiere
# Also install Pymiere Link extension in Premiere Pro
import pymiere

seq = pymiere.objects.app.project.activeSequence
clip = seq.videoTracks[0].clips[0]
print(clip.name)
```

**Install:**
```bash
pip install pymiere
# Then run the Pymiere Link extension installer (from the pymiere GitHub repo)
```

---

### 2. DaVinci Resolve 🟢
**Best Library:** `DaVinciResolveScript` (built-in) + `pydavinci` (wrapper)

**What it can do:**
- Create/open/save/close projects
- Import media into the Media Pool
- Create and edit timelines, add clips to tracks
- Set render settings and trigger renders
- Control color grading (node creation, grade application)
- Manage project settings (resolution, frame rate, color space)
- Batch operations across multiple projects

**Limitations:**
- Studio (paid) version has more scripting capability than free version
- Free version requires scripts to be placed in the Scripts folder and run from the Workspace menu (not externally)
- Clip positioning/rearranging on timeline has limitations in free version API
- DaVinci Resolve must be running

**How to use:**
```python
# Built-in — no pip install needed
# Ensure PYTHONPATH includes Resolve's scripting module path
import DaVinciResolveScript as dvr
resolve = dvr.scriptapp("Resolve")
pm = resolve.GetProjectManager()
project = pm.CreateProject("MyProject")
timeline = project.GetMediaPool().CreateEmptyTimeline("Main Timeline")
```

**Install:**
```bash
# pydavinci (Pythonic wrapper with type hints):
pip install pydavinci
# Set env variables:
# RESOLVE_SCRIPT_API="/path/to/DaVinci Resolve/Support/Developer/Scripting"
# PYTHONPATH="$PYTHONPATH:$RESOLVE_SCRIPT_API/Modules"
```

---

### 3. After Effects 🟡
**Best Library:** `pywin32` (COM) + `AEPython` plugin (for deeper control)

**What it can do:**
- Create compositions, add/modify layers
- Set keyframes and animate properties
- Apply effects to layers
- Render compositions to output queue
- Manipulate text layer content and properties
- Open, save, close AE projects

**Limitations:**
- COM interface is Windows-only
- AEPython plugin must be manually installed
- Render triggering requires render queue setup
- After Effects must be running

**How to use:**
```python
# pip install pywin32
from win32com.client import Dispatch

ae = Dispatch("AfterEFfects.Application")
proj = ae.NewProject()
comp = proj.Items.AddComp("Main Comp", 1920, 1080, 1, 10, 24)
```

**Install:**
```bash
pip install pywin32
# AEPython plugin: https://github.com/takeshi-okuya/AEPython
```

---

### 4. Final Cut Pro 🔴
**Best Library:** `applescript` via Python `subprocess` (macOS only)

**What it can do:**
- Open/close projects via AppleScript
- Limited: trigger menu actions, keyboard shortcuts
- FCPXML import/export is the most reliable automation path — generate XML in Python and import it

**Limitations:**
- Final Cut Pro has very limited scripting support
- No COM or Python API; AppleScript support is minimal
- Best approach: generate FCPXML files with Python (`pip install fcpxml`) and import them

**How to use:**
```python
# pip install fcpxml
import subprocess
script = 'tell application "Final Cut Pro" to activate'
subprocess.run(["osascript", "-e", script])
```

**Install:**
```bash
pip install fcpxml
```

---

### 5. CapCut 🔴
**Best Library:** `pyautogui` (GUI automation only)

**What it can do:** Basic GUI automation — clicking, importing media, exporting. No scripting API exists.

**Limitations:** Desktop app has no automation API. Web version has no public API. Very fragile automation.

---

### 6. HandBrake 🟢
**Best Library:** `HandBrakeCLI` (official) + `subprocess`/`handbrake-python`

**What it can do:**
- Full headless video transcoding from terminal
- Convert any video to MP4, MKV, WebM, etc.
- Encode with H.264, H.265, AV1, VP9
- Apply presets, set bitrate, resolution, frame rate
- Batch convert entire folders of videos
- Strip/add audio tracks, subtitles

**Limitations:**
- HandBrakeCLI must be installed separately
- Not a "live" GUI app — purely a batch tool
- No real-time preview capability

**How to use:**
```python
import subprocess
subprocess.run([
    "HandBrakeCLI",
    "-i", "input.mp4",
    "-o", "output.mp4",
    "--preset", "Fast 1080p30"
])
```

**Install:**
```bash
pip install handbrake-python  # optional Python wrapper
# HandBrakeCLI: https://handbrake.fr/downloads2.php
```

---

### 7. LottieFiles 🟢
**Best Library:** `lottie` (Python) + LottieFiles REST API

**What it can do:**
- Parse, create, and modify Lottie JSON animations programmatically
- Extract/replace keyframe data
- Change colors, shapes, and properties in animations
- Export to GIF, video via LottieFiles API
- Integrate Lottie animations into pipelines

**How to use:**
```python
# pip install lottie
import lottie
anim = lottie.parsers.parse("animation.json")
anim.layers[0].shapes[0].fill.color = lottie.objects.Color(1, 0, 0)
lottie.exporters.export(anim, "output.json")
```

**Install:**
```bash
pip install lottie requests
```

---

### 8. OBS Studio 🟢
**Best Library:** `obs-websocket-py` (via OBS WebSocket plugin)

**What it can do:**
- Switch scenes, start/stop streams and recordings
- Control audio sources (mute, volume)
- Toggle filters and transitions
- Trigger scene collections and profiles
- Get/set any OBS setting programmatically
- Also: native Python scripting API inside OBS (Python 3 + Lua)

**Limitations:**
- Requires OBS WebSocket plugin (bundled in OBS 28+)
- OBS must be running

**How to use:**
```python
# pip install obs-websocket-py
import obswebsocket, obswebsocket.requests as obs_req

ws = obswebsocket.obsws("localhost", 4455, "your_password")
ws.connect()
ws.call(obs_req.SetCurrentProgramScene(sceneName="Main Scene"))
ws.call(obs_req.StartStream())
ws.disconnect()
```

**Install:**
```bash
pip install obs-websocket-py
```

---

## 3D, CAD & GAME DEV

---

### 1. Blender 🟢
**Best Library:** `bpy` (built-in Blender Python API) — **no install needed**

**What it can do:**
- Complete 3D scene creation, modification, and rendering
- Create meshes, materials, lights, cameras from scratch
- Apply modifiers, constraints, shape keys
- Animate objects (keyframes, drivers)
- Render to image/video (Cycles, EEVEE, Workbench)
- Import/export FBX, OBJ, GLTF, SVG, Alembic, etc.
- Full headless batch rendering from terminal
- Create custom UI panels and operators
- Run simulations (cloth, fluid, particles)

**Limitations:**
- Uses Blender's embedded Python, not system Python (for `bpy`)
- Can use `bpy` as standalone via `pip install bpy` for Python 3.11+
- Some GPU rendering features need Blender's process context

**How to use:**
```python
# Inside Blender Python console or --python flag:
import bpy
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
bpy.context.active_object.name = "MyCube"
bpy.ops.render.render(write_still=True)
```

```bash
# Headless batch render from terminal:
blender --background scene.blend --python render_script.py
```

**Install:**
```bash
pip install bpy  # standalone (Python 3.11+)
# Or use Blender's built-in Python at: <blender_dir>/python/bin/python
```

---

### 2. AutoCAD 🟡
**Best Library:** `pyautocad` + `pywin32`

**What it can do:**
- Create drawings: lines, arcs, circles, polylines, splines
- Add/edit dimensions, annotations, and text
- Insert blocks and external references (XREFs)
- Apply layers, linetypes, colors
- Open/save/export DWG, DXF files
- Iterate over all entities in a drawing
- Run LISP routines and scripts

**Limitations:**
- Windows only (COM via AutoCAD ActiveX)
- AutoCAD must be running
- `pyautocad` is a thin wrapper — raw COM via pywin32 gives more power
- No headless mode

**How to use:**
```python
# pip install pyautocad pywin32
from pyautocad import Autocad, APoint

acad = Autocad(create_if_not_exists=True)
acad.prompt("Hello from Python!")
acad.model.AddLine(APoint(0, 0, 0), APoint(100, 100, 0))
```

**Install:**
```bash
pip install pyautocad pywin32
```

---

### 3. Unreal Engine 🟢
**Best Library:** `unreal` (built-in UE Python API via Editor Scripting plugin)

**What it can do:**
- Import assets (FBX, textures, audio) into Content Browser
- Create/modify Blueprints, materials, levels
- Spawn and configure Actors in the level
- Set up LODs, collision, physics
- Automate packaging and building
- Batch process assets (rename, redirect, optimize)
- Create Editor utility widgets (Python-driven tools)

**Limitations:**
- Editor-only scripting (not runtime gameplay)
- Must enable "Python Editor Script Plugin" in UE settings
- Uses UE's embedded Python — not all external libraries work
- No headless execution in classic sense (Editor process must run)

**How to use:**
```python
# Inside UE Python Console or via -ExecutePythonScript
import unreal

asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
task = unreal.ImportTask()
task.filename = "C:/Models/character.fbx"
task.destination_path = "/Game/Characters/"
asset_tools.import_asset_tasks([task])
```

**Install:**
```
# Enable in UE Editor: Edit > Plugins > Python Editor Script Plugin
# No pip install — uses UE's bundled Python
```

---

### 4. Unity 🟡
**Best Library:** Unity Python Scripting package (`com.unity.scripting.python`) + `C# Editor scripts`

**What it can do:**
- Run Python scripts from within the Unity Editor
- Modify GameObjects, assets, and scenes
- Automate asset pipeline (import settings, LOD setup)
- Batch rename, organize, or validate project assets
- Trigger builds via Unity CLI (`unity -batchmode -buildTarget`)

**Limitations:**
- Python Scripting package **support ends with Unity 6.1** — C# is the primary language
- Best long-term approach: use Unity CLI + C# editor scripts
- Python is in-editor only, not runtime gameplay
- `numpy`, `PySide` and other C-extension packages may crash on domain reload

**How to use:**
```bash
# Unity CLI build from terminal (no Python needed):
Unity -batchmode -quit -projectPath /path/to/project -buildTarget Win64 -executeMethod BuildScript.Build
```

```python
# Inside Unity Python Script Editor:
import UnityEngine
objs = UnityEngine.Object.FindObjectsOfType(UnityEngine.GameObject)
for go in objs:
    print(go.name)
```

**Install:**
```
# Unity Package Manager: com.unity.scripting.python
# Or use Unity CLI directly with C# scripts
```

---

### 5. Cinema 4D 🟢
**Best Library:** `c4d` (built-in Cinema 4D Python API) + `c4dpy` CLI executable

**What it can do:**
- Create/modify 3D objects, scenes, materials, lights
- Apply deformers, generators, tags, and effectors
- Animate via keyframes, XPresso, and Python tags
- Trigger renders (standard, physical, ProRender)
- Batch process via `c4dpy` CLI (headless execution)
- Import/export FBX, OBJ, Alembic, SVG

**Limitations:**
- Uses Cinema 4D's own Python interpreter (CPython-based but not identical)
- C-extension libraries may not work
- Full headless via `c4dpy` is available but feature-limited vs. full editor
- Scripts run inside C4D's Script Manager or as tags/plugins

**How to use:**
```python
# Inside C4D Script Manager or via c4dpy:
import c4d

doc = c4d.documents.GetActiveDocument()
cube = c4d.BaseObject(c4d.Ocube)
cube[c4d.PRIM_CUBE_LEN] = c4d.Vector(200, 200, 200)
doc.InsertObject(cube)
c4d.EventAdd()
```

```bash
# Headless batch via c4dpy:
/Applications/MAXON/Cinema\ 4D\ 2024/c4dpy my_script.py
```

**Install:**
```
# No pip install — c4d module is built into Cinema 4D
# Use Cinema 4D's built-in Script Manager (Extensions > Script Manager)
```

---

### 6. Spline 🔴
**Best Library:** REST API + `requests` (read-only)

**What it can do:**
- Export scenes via Spline REST API
- Embed exported 3D scenes in web projects
- No programmatic scene editing from terminal

**Limitations:** Web-based tool with no scripting API for editing scenes. Use Three.js or Blender for terminal-controlled 3D.

---

## UI/UX & WEB DESIGN

---

### 1. Figma 🟢
**Best Library:** `figmapy` (Python REST wrapper) + Figma REST API

**What it can do:**
- Read all file contents: pages, frames, components, styles
- Export frames/components as PNG, SVG, JPEG, PDF
- Read/write comments
- Manage team projects and files
- Retrieve version history
- Publish library components and styles

**Limitations:**
- **REST API is read-only for design files** — write access requires a Figma Plugin (JavaScript)
- Writing (editing elements, creating designs) requires the Plugin API inside Figma
- Rate limited

**How to use:**
```python
# pip install figmapy requests
from figmapy import FigmaPy

figma = FigmaPy(token="YOUR_TOKEN")
file = figma.get_file(key="FILE_KEY")
for page in file.document.children:
    print(page.name)
```

**Install:**
```bash
pip install figmapy requests
```

---

### 2. Adobe XD 🟡
**Best Library:** `pywin32` (COM, Windows) + Adobe XD Plugin API (JavaScript)

**What it can do:**
- Launch XD, open/close/save files via COM
- Prototype interactions and export specs via XD plugins
- Export assets to PNG/SVG via plugin

**Limitations:**
- Adobe XD is being deprecated/discontinued — consider migrating to Figma or Framer
- Plugin scripting is JavaScript-only
- COM control is limited

---

### 3. Framer 🔴
**Best Library:** REST API / `requests` for content management

**What it can do:** Framer has a CMS API for managing content. The design tool itself has no Python scripting interface.

---

### 4. Sketch 🟠
**Best Library:** `sketch-py` + AppleScript via `subprocess` (macOS only)

**What it can do:**
- Open/export Sketch files via CLI plugin (`sketchtool`)
- Export artboards, slices, pages as PNG/PDF/SVG
- List artboard names and sizes
- Batch export entire files

**Limitations:**
- macOS only
- `sketchtool` CLI is powerful for export but not for editing
- No Python API for design manipulation

**How to use:**
```bash
# sketchtool (bundled with Sketch):
sketchtool export artboards /path/to/file.sketch --output=/output/ --formats=png
```

**Install:**
```bash
# sketchtool is bundled with Sketch.app
# Python subprocess wrapper:
import subprocess
subprocess.run(["sketchtool", "export", "artboards", "file.sketch"])
```

---

## AUDIO & MUSIC

---

### 1. Audacity 🟡
**Best Library:** `mod-script-pipe` (Audacity's built-in pipe) via Python

**What it can do:**
- Import/export audio files (WAV, MP3, FLAC, OGG)
- Apply effects: noise reduction, equalization, normalization, compression
- Trim, split, merge tracks
- Generate tones, silence
- Run any Effect or Analyze function scripted
- Batch process files

**Limitations:**
- Requires enabling the `mod-script-pipe` module in Audacity preferences
- Audacity must be running
- Communication is through OS pipes (slightly lower-level)

**How to use:**
```python
# No pip install — uses named pipes
import os, time

TONAME = '/tmp/audacity_script_pipe.to.' + str(os.getuid())
FROMNAME = '/tmp/audacity_script_pipe.from.' + str(os.getuid())

to_pipe = open(TONAME, 'w')
from_pipe = open(FROMNAME, 'rt')

def send_command(cmd):
    to_pipe.write(cmd + '\n')
    to_pipe.flush()
    return from_pipe.readline()

send_command("Import2: Filename=/path/to/audio.wav")
send_command("Normalize: PeakLevel=-1.0")
send_command("Export2: Filename=/output/normalized.wav Format=WAV")
```

**Install:**
```
# Enable: Audacity > Edit > Preferences > Modules > mod-script-pipe = Enabled
# Restart Audacity. No pip install needed.
# Optional helper scripts: https://github.com/audacity/audacity/tree/master/scripts/piped-work
```

---

### 2. Ableton Live 🟢
**Best Library:** `AbletonOSC` (remote script) + `pylive` + `python-osc`

**What it can do:**
- Full control over Live Object Model: tempo, tracks, clips, scenes
- Start/stop playback and recording
- Fire/stop clips and scenes
- Create MIDI notes and clips programmatically
- Adjust device parameters (EQ, compressor, synth settings)
- Trigger cue points
- Real-time bidirectional communication (Live sends state updates to your script)

**Limitations:**
- Requires installing AbletonOSC as a Remote Script inside Ableton
- Ableton Live must be running
- Live 11 or higher required for AbletonOSC
- Not all LOM objects are fully implemented (DrumPad, RackDevice still WIP)

**How to use:**
```python
# pip install pylive python-osc
import live

# Connect to Ableton Live (AbletonOSC must be active as control surface)
s = live.Set()
s.scan()

# Set tempo
s.tempo = 128.0

# Fire first clip on first track
s.tracks[0].clips[0].play()
```

```python
# Direct OSC (lower level):
from pythonosc.udp_client import SimpleUDPClient
client = SimpleUDPClient("127.0.0.1", 11000)
client.send_message("/live/song/set/tempo", 140.0)
```

**Install:**
```bash
pip install pylive python-osc
# AbletonOSC: https://github.com/ideoforms/AbletonOSC
# Copy AbletonOSC folder to: ~/Music/Ableton/User Library/Remote Scripts/
# Then: Ableton > Preferences > MIDI > Control Surface = AbletonOSC
```

---

## QUICK REFERENCE TABLE

| Software | Best Library | Language | Platform | Headless? |
|---|---|---|---|---|
| Photoshop | `photoshop-python-api` | Python | Win/Mac | ❌ |
| Illustrator | `pywin32` (COM) | Python | Win | ❌ |
| Affinity Photo | `pyautogui` | Python | Win/Mac | ❌ |
| Affinity Designer | `pyautogui` | Python | Win/Mac | ❌ |
| GIMP | `gimpfu` (built-in) | Python | All | ✅ |
| Inkscape | `inkex` + CLI | Python | All | ✅ |
| Canva | REST API + `requests` | Python | Cloud | ✅ |
| Lightroom | Lua SDK / REST API | Lua/Python | Win/Mac | ❌ |
| CorelDRAW | `pywin32` (COM) | Python | Win | ❌ |
| Pixlr | N/A | — | Cloud | — |
| Premiere Pro | `pymiere` | Python | Win/Mac | ❌ |
| DaVinci Resolve | `DaVinciResolveScript` | Python | Win/Mac | ❌ |
| After Effects | `pywin32` (COM) | Python | Win | ❌ |
| Final Cut Pro | AppleScript/FCPXML | Python | Mac | ❌ |
| CapCut | `pyautogui` | Python | Win/Mac | ❌ |
| HandBrake | `HandBrakeCLI` | Python | All | ✅ |
| LottieFiles | `lottie` library | Python | All | ✅ |
| OBS Studio | `obs-websocket-py` | Python | All | ❌ |
| Blender | `bpy` (built-in) | Python | All | ✅ |
| AutoCAD | `pyautocad` | Python | Win | ❌ |
| Unreal Engine | `unreal` (built-in) | Python | Win/Mac | ❌ |
| Unity | Unity Python pkg | Python/C# | All | ✅ (CLI) |
| Cinema 4D | `c4d` (built-in) | Python | Win/Mac | ✅ (c4dpy) |
| Spline | REST API | Python | Cloud | ✅ |
| Figma | `figmapy` | Python | Cloud | ✅ |
| Adobe XD | Plugin API (JS) | JavaScript | Win/Mac | ❌ |
| Sketch | `sketchtool` CLI | Python | Mac | ✅ |
| Audacity | `mod-script-pipe` | Python | All | ❌ |
| Ableton Live | `pylive` + AbletonOSC | Python | Win/Mac | ❌ |

---

## UNIVERSAL FALLBACK

For any GUI app without a scripting API, use:

```bash
pip install pyautogui pillow
# macOS only (accessibility tree access):
pip install pyobjc-core pyobjc
# Windows (enhanced window control):
pip install pywinauto
```

`pywinauto` is often more reliable than `pyautogui` on Windows as it uses the Win32 accessibility API rather than image recognition.
