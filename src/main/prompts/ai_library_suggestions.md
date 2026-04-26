# AI Library Suggestions for Creative Software Control

> **Purpose:** This file tells the AI which Python libraries to use to control specific creative software.
> **Scripting Setup:** Run `src/scripts/enable_scripting.py` to enable scripting for all apps.
> **How to use:** The AI reads this file FIRST before any automation task to determine which libraries to install.
> **Update:** If a better library is found or a software's API changes, update this file.

---

## QUICK START

1. **Check if library exists:** `pip show <package>`
2. **Install:** `pip install <package>` (for pip packages)
3. **Manual download:** See download links below for non-pip libraries
4. **Built-in:** No install needed - use the software's built-in API

---

## SOFTWARE LIBRARY REFERENCE

### ADOBE CREATIVE CLOUD

| Software | Best Method | Scripting Permission Required |
|---|---|---|
| **After Effects** | ExtendScript via CLI (`-r` flag) | YES - Edit Prefs file |
| **Photoshop** | COM via pywin32 or File > Scripts | NO - Enabled by default |
| **Illustrator** | COM via pywin32 or File > Scripts | NO - Enabled by default |
| **Premiere Pro** | UXP scripting | NO - Enabled by default |
| **Audition** | COM via pywin32 | NO - Enabled by default |

### After Effects - USE EXTENDSCRIPT:
After Effects uses **ExtendScript** (Adobe's JavaScript variant, .jsx format) for automation.

**BOTH READ AND WRITE:**
```json
{
  "action": "run_extendscript",
  "parameters": {
    "script": "// READ: List all layers\nfor (var i = 1; i <= app.project.activeItem.layers.length; i++) {\n  $.writeln(app.project.activeItem.layers[i].name);\n}"
  }
}
```
- **READ:** Query project structure, layers, properties, selection
- **WRITE:** Create compositions, add layers, set keyframes, import assets
- Must enable scripting permissions first (see section above).

### After Effects Automation (RECOMMENDED):

**Best Approach: ExtendScript via CLI**
```json
{
  "action": "run_extendscript",
  "parameters": {
    "script": "app.project.activeItem.layers.addText('Your Text')"
  }
}
```

**Error Handling (Auto-wrapped):**
- Scripts are automatically wrapped in try-catch
- Errors logged to `%TEMP%/ae_control_error.log`
- Prevents AE error popups

**Common Errors to Avoid:**
- ❌ Use UI names ("Glow") → ✅ Use Match Names ("ADBE Glow")
- ❌ Write to C:\Program Files → ✅ Write to %TEMP%
- ❌ Wrong encoding → ✅ UTF-8 No BOM

### VIDEO & MOTION GRAPHICS

| Software | Library | Install | Download/Access | Notes |
|---|---|---|---|---|
| **DaVinci Resolve** | `DaVinciResolveScript` | Built-in + `pip install pydavinci` | [PyPI](https://pypi.org/project/pydavinci/) | Enable scripting |
| **Blender** | `bpy` | `pip install bpy` | [PyPI](https://pypi.org/project/bpy/) | Python 3.11+ |
| **HandBrake** | CLI | Download | [HandBrake](https://handbrake.fr/) | Use CLI |
| **OBS Studio** | `obs-websocket-py` | `pip install obs-websocket-py` | [PyPI](https://pypi.org/project/obs-websocket-py/) | Enable WebSocket |
| **Lottie** | `lottie` | `pip install lottie` | [PyPI](https://pypi.org/project/lottie/) | JSON animations |
| **CapCut** | `pyautogui` | `pip install pyautogui` | PyPI | GUI automation only |
| **Final Cut Pro** | `fcpxml` | `pip install fcpxml` | [PyPI](https://pypi.org/project/fcpxml/) | FCPXML files |

### GRAPHICS & DESIGN

| Software | Library | Install | Download/Access | Notes |
|---|---|---|---|---|
| **GIMP** | `gimpfu` | Built-in | [gimp.org](https://www.gimp.org/) | Use --batch |
| **Inkscape** | `inkex` | `pip install inkex` | [PyPI](https://pypi.org/project/inkex/) | Extension lib |
| **Affinity Photo** | `pyautogui` | `pip install pyautogui pillow` | PyPI | GUI automation |
| **Affinity Designer** | `pyautogui` | `pip install pyautogui pillow` | PyPI | GUI automation |
| **CorelDRAW** | `pywin32` | `pip install pywin32` | PyPI | COM automation |
| **Figma** | `figmapy` | `pip install figmapy requests` | [PyPI](https://pypi.org/project/figmapy/) | REST API |
| **Canva** | REST API | `pip install requests` | [Canva API](https://www.canva.com/developers/) | Connect API |

### 3D & CAD

| Software | Library | Install | Download/Access | Notes |
|---|---|---|---|---|
| **Blender** | `bpy` | `pip install bpy` | [PyPI](https://pypi.org/project/bpy/) | Built-in in app |
| **AutoCAD** | `pyautocad` + `pywin32` | `pip install pyautocad pywin32` | [PyPI](https://pypi.org/project/pyautocad/) | Windows COM |
| **Cinema 4D** | `c4d` | Built-in | Use c4dpy CLI | Headless option |
| **Unreal Engine** | `unreal` | Built-in | Enable in Editor | Enable scripting |
| **Unity** | CLI | N/A | Unity CLI | Use -batchmode |

### AUDIO

| Software | Library | Install | Download/Access | Notes |
|---|---|---|---|---|
| **Audacity** | `mod-script-pipe` | Enable in prefs | [Audacity](https://www.audacityteam.org/) | Enable mod-script-pipe |
| **Ableton Live** | `pylive` + `python-osc` | `pip install pylive python-osc` | [PyPI](https://pypi.org/project/pylive/) + [AbletonOSC](https://github.com/ideoforms/AbletonOSC) | Requires setup |

---

## DETAILED INSTALLATION GUIDE

### For pip packages (most common):

```bash
# 1. Check if already installed
pip show <package>

# 2. Install if not
pip install <package>

# 3. Verify
pip show <package>
```

### For manual/non-pip downloads:

#### AEPython (After Effects deep control):
```bash
# 1. Download from: https://github.com/takeshi-okuya/AEPython
# 2. Extract to After Effects plugins folder:
#    C:\Program Files\Adobe\Adobe After Effects <version>\Support Files\Plug-ins\AEPython\
# 3. Restart After Effects
# 4. Access via Window > Python
```

#### Pymiere Link (Premiere Pro):
```bash
# 1. Download from: https://github.com/pymiere/PymiereLink
# 2. Run the installer inside Premiere Pro
# 3. Or copy .plugin to:
#    C:\Program Files\Adobe\Adobe Premiere Pro <version>\Plug-ins\
# 4. Restart Premiere Pro
```

#### GIMP (built-in Python-Fu):
```bash
# No install needed - built into GIMP
# Use via terminal:
gimp --no-interface --batch '(python-fu-my-script RUN_NONINTERACTIVE)' --batch '(gimp-quit 0)'
```

#### Blender (bpy):
```bash
# Option 1: Use Blender's built-in Python:
#   <blender_dir>\python\bin\python.exe

# Option 2: Install standalone (Python 3.11+):
pip install bpy
# Note: Limited functionality vs embedded version
```

#### DaVinci Resolve (built-in):
```bash
# 1. Enable scripting in Resolve:
#    DaVinci Resolve > Preferences > Scripting > Enable Python API

# 2. Set PYTHONPATH:
#    RESOLVE_SCRIPT_API="C:\Program Files\Blackmagic Design\DaVinci Resolve\Support\Developer\Scripting"
#    PYTHONPATH="$PYTHONPATH:$RESOLVE_SCRIPT_API/Modules"

# 3. Use:
import DaVinciResolveScript as dvr

# Optional wrapper:
pip install pydavinci
```

#### OBS Studio WebSocket:
```bash
# 1. Install obs-websocket-py:
pip install obs-websocket-py

# 2. Enable WebSocket in OBS:
#    Tools > WebSocket Server Settings > Enable
# 3. Set password in settings
```

#### Ableton Live:
```bash
# 1. Install pylive:
pip install pylive python-osc

# 2. Download AbletonOSC:
#    https://github.com/ideoforms/AbletonOSC

# 3. Copy to Ableton Remote Scripts folder:
#    ~/Music/Ableton/User Library/Remote Scripts/

# 4. Enable in Ableton:
#    Preferences > MIDI > Control Surface = AbletonOSC
```

---

## BUNDLED/APPS WITH BUILT-IN APIs

These libraries are built into the software - no pip install needed:

| Software | How to Access |
|---|---|
| **GIMP** | `gimpfu` - Use `gimp --batch` or Python console |
| **Blender** | `bpy` - Use Blender Python or `--python` flag |
| **DaVinci Resolve** | `DaVinciResolveScript` - Enable in preferences |
| **Cinema 4D** | `c4d` - Use Script Manager or c4dpy CLI |
| **Unreal Engine** | `unreal` - Enable Python Editor Script Plugin |
| **Unity** | `UnityEngine` - Install Python Scripting package |
| **Audacity** | Enable mod-script-pipe in preferences |
| **OBS** | Built-in Python scripting |

---

## FALLBACK LIBRARIES

If no specific API exists, use:

| Library | Install | Use Case |
|---|---|---|
| `pyautogui` | `pip install pyautogui pillow` | Cross-platform GUI automation |
| `pywinauto` | `pip install pywinauto` | Windows app automation (better than pyautogui) |
| `pyobjc` | `pip install pyobjc-core pyobjc` | macOS accessibility API |
| `subprocess` | Built-in | CLI tools |

---

## TROUBLESHOOTING

- **ImportError:** Check `pip show <package>` - may need to install
- **Not working:** Ensure target software is running
- **COM errors:** Use `pip show pywin32` - must be installed
- **Permission denied:** Run terminal as administrator
- **Module not found:** Check Python version compatibility

---

(End of file - last updated: 2026-04-25)

---

## SEE ALSO

- `native-scripting-reference.md` — Complete reference for each app's native scripting language, file extensions, and Python bridge templates