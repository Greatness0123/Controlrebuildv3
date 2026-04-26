"""
Enables scripting/automation access for all supported creative tools.
Run this ONCE before attempting any automation.

Usage:
    python enable_scripting.py --all
    python enable_scripting.py --app photoshop
    python enable_scripting.py --app aftereffects
    python enable_scripting.py --app resolve
    python enable_scripting.py --app audacity
    python enable_scripting.py --app obs
    python enable_scripting.py --app blender
    python enable_scripting.py --check   # check current status of all apps

IMPORTANT: Most apps must be CLOSED before running this script.
           DaVinci Resolve requires a manual step inside the app.
           OBS WebSocket is enabled inside OBS settings (script automates this).
"""

import os, sys, platform, subprocess, shutil, json, re
from pathlib import Path
from datetime import datetime

OS = platform.system()  # "Windows", "Darwin", "Linux"
USER = Path.home()

# State file to remember what has been enabled
STATE_FILE = USER / ".control_scripting_state.json"

def load_state():
    """Load the persisted state of enabled apps."""
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except:
            return {}
    return {}

def save_state(state):
    """Save the state of enabled apps."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))

def is_enabled(app_name):
    """Check if an app's scripting has been enabled."""
    state = load_state()
    return state.get(app_name, {}).get("enabled", False)

def mark_enabled(app_name, enabled=True, notes=""):
    """Mark an app's scripting as enabled/disabled."""
    state = load_state()
    state[app_name] = {
        "enabled": enabled,
        "notes": notes,
        "timestamp": datetime.now().isoformat()
    }
    save_state(state)

def get_enabled_apps():
    """Get list of apps that have been enabled."""
    state = load_state()
    return [k for k, v in state.items() if v.get("enabled", False)]

def get_all_states():
    """Get all app states."""
    return load_state()

def is_app_running(name):
    try:
        if OS == "Windows":
            out = subprocess.check_output(["tasklist"], text=True)
            return name.lower() in out.lower()
        else:
            out = subprocess.check_output(["pgrep", "-il", name], text=True)
            return bool(out.strip())
    except:
        return False

def must_be_closed(app_name, process_name):
    if is_app_running(process_name):
        print(f"WARNING: {app_name} is currently running. Close it first.")
        choice = input("Force-close it now? (y/n): ").strip().lower()
        if choice == 'y':
            if OS == "Windows":
                subprocess.run(["taskkill", "/F", "/IM", process_name], capture_output=True)
            else:
                subprocess.run(["pkill", "-f", process_name], capture_output=True)
            print(f"   {app_name} closed.")
        else:
            print(f"   Skipping {app_name}.")
            return False
    return True

def write_or_patch_file(path, content):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"   Written: {path}")

def patch_ini(path, section, key, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = path.read_text().splitlines() if path.exists() else []
    in_section = False
    found_key = False
    new_lines = []
    for line in lines:
        if line.strip().startswith(f"[{section}]"):
            in_section = True
        elif line.strip().startswith("[") and in_section:
            if not found_key:
                new_lines.append(f"{key}={value}")
                found_key = True
            in_section = False
        if in_section and line.strip().startswith(f"{key}="):
            new_lines.append(f"{key}={value}")
            found_key = True
            continue
        new_lines.append(line)
    if not found_key:
        if not any(l.strip() == f"[{section}]" for l in new_lines):
            new_lines.append(f"\n[{section}]")
        new_lines.append(f"{key}={value}")
    path.write_text("\n".join(new_lines) + "\n")
    print(f"   Patched [{section}] {key}={value} in {path}")

def set_env_var_persistent(key, value):
    if OS == "Windows":
        subprocess.run(["setx", key, value], capture_output=True)
    elif OS == "Darwin":
        profile = USER / ".zshrc"
        line = f'export {key}="{value}"'
        content = profile.read_text() if profile.exists() else ""
        if key not in content:
            with open(profile, 'a') as f:
                f.write(f"\n{line}\n")
    else:
        profile = USER / ".bashrc"
        line = f'export {key}="{value}"'
        content = profile.read_text() if profile.exists() else ""
        if key not in content:
            with open(profile, 'a') as f:
                f.write(f"\n{line}\n")
    os.environ[key] = value
    print(f"   Set env var: {key}={value}")

# ─────────────────────────────────────────────
# 1. ADOBE PHOTOSHOP
# ─────────────────────────────────────────────

def enable_photoshop():
    print("\n[Adobe Photoshop] Enabling scripting file/network access...")

    if OS == "Windows":
        scripts_dir = Path("C:/Program Files/Adobe/Adobe Photoshop 2024/Presets/Scripts")
    elif OS == "Darwin":
        scripts_dir = Path("/Applications/Adobe Photoshop 2024/Presets/Scripts")
    else:
        print("   Photoshop not supported on Linux.")
        return

    if not scripts_dir.exists():
        base = scripts_dir.parent.parent
        matches = list(base.glob("Adobe Photoshop*/Presets/Scripts")) if base.exists() else []
        if matches:
            scripts_dir = matches[-1]
        else:
            print(f"   Photoshop Scripts folder not found. Manually enable: Edit > Preferences > General > Allow Scripts to Write Files")
            return

    startup_jsx = scripts_dir / "_enable_scripting_pref.jsx"
    jsx_content = """
// Auto-generated by enable_scripting.py
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
"""
    write_or_patch_file(startup_jsx, jsx_content)
    mark_enabled("photoshop", enabled=True, notes="Startup JSX placed. Launch PS once.")
    print("   Launch Photoshop once — the startup script will set the pref and delete itself.")
    print("   Or manually: Edit > Preferences > General > Allow Scripts to Write Files")

def check_photoshop():
    if OS == "Windows":
        path = Path("C:/Program Files/Adobe/Adobe Photoshop 2024/Presets/Scripts")
    elif OS == "Darwin":
        path = Path("/Applications/Adobe Photoshop 2024/Presets/Scripts")
    else:
        return "N/A"
    return "Found" if path.exists() else "Not found"

# ─────────────────────────────────────────────
# 2. ADOBE AFTER EFFECTS
# ─────────────────────────────────────────────

def enable_aftereffects():
    print("\n[Adobe After Effects] Enabling scripting file/network access...")

    if not must_be_closed("After Effects", "AfterFX.exe" if OS == "Windows" else "After Effects"):
        return

    if OS == "Windows":
        prefs_glob = USER / "AppData/Roaming/Adobe/After Effects"
    elif OS == "Darwin":
        prefs_glob = USER / "Library/Preferences/Adobe/After Effects"
    else:
        print("   After Effects not supported on Linux.")
        return

    ae_dirs = sorted(prefs_glob.glob("*")) if prefs_glob.exists() else []
    if not ae_dirs:
        print(f"   After Effects preferences not found. Launch AE once to create prefs, then re-run this script.")
        return

    prefs_file = ae_dirs[-1] / "Adobe After Effects Prefs"
    if not prefs_file.exists():
        candidates = list(ae_dirs[-1].glob("*.txt")) + list(ae_dirs[-1].glob("*Prefs*"))
        prefs_file = candidates[0] if candidates else prefs_file

    print(f"   Patching: {prefs_file}")
    patch_ini(prefs_file, "Main Pref Section v2", "Pref_SCRIPTING_FILE_NETWORK_SECURITY", "1")
    mark_enabled("aftereffects", enabled=True, notes="Prefs patched")
    print("   Done. Launch After Effects — scripting is now enabled.")

def check_aftereffects():
    if OS == "Windows":
        base = USER / "AppData/Roaming/Adobe/After Effects"
    elif OS == "Darwin":
        base = USER / "Library/Preferences/Adobe/After Effects"
    else:
        return "N/A"
    dirs = sorted(base.glob("*")) if base.exists() else []
    return "Prefs found" if dirs else "Not found"

# ─────────────────────────────────────────────
# 3. ADOBE PREMIERE PRO
# ─────────────────────────────────────────────

def enable_premiere():
    print("\n[Adobe Premiere Pro] No special enablement needed.")
    print("   ExtendScript runs via CEP panels or command line (-r flag).")
    print("   UXP plugins require UXP Developer Tool for dev mode.")
    mark_enabled("premiere", enabled=True, notes="No setup needed")
    print("   Ready to use.")

def check_premiere():
    return "No setup required"

# ─────────────────────────────────────────────
# 4. DAVINCI RESOLVE
# ─────────────────────────────────────────────

def enable_resolve():
    print("\n[DaVinci Resolve] Setting up scripting environment...")

    if OS == "Windows":
        api = r"C:\ProgramData\Blackmagic Design\DaVinci Resolve\Support\Developer\Scripting"
        lib = r"C:\Program Files\Blackmagic Design\DaVinci Resolve\fusionscript.dll"
        modules = api + r"\Modules"
    elif OS == "Darwin":
        api = "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting"
        lib = "/Applications/DaVinci Resolve/DaVinci Resolve.app/Contents/Libraries/Fusion/fusionscript.so"
        modules = api + "/Modules"
    else:
        api = "/opt/resolve/Developer/Scripting"
        lib = "/opt/resolve/libs/Fusion/fusionscript.so"
        modules = api + "/Modules"

    for p, name in [(api, "RESOLVE_SCRIPT_API"), (lib, "RESOLVE_SCRIPT_LIB")]:
        if Path(p).exists():
            print(f"   Found {name}: {p}")
        else:
            print(f"   Not found: {p}")

    set_env_var_persistent("RESOLVE_SCRIPT_API", api)
    set_env_var_persistent("RESOLVE_SCRIPT_LIB", lib)

    current_pypath = os.environ.get("PYTHONPATH", "")
    if modules not in current_pypath:
        new_pypath = f"{current_pypath}{os.pathsep}{modules}" if current_pypath else modules
        set_env_var_persistent("PYTHONPATH", new_pypath)

    mark_enabled("resolve", enabled=True, notes="Env vars set. Manual step: Set Local in Resolve Prefs.")
    print()
    print("   MANUAL STEP REQUIRED:")
    print("   Open DaVinci Resolve > Preferences > System > General")
    print('   Set "External scripting using" = Local')
    print("   Save, then restart Resolve.")

def check_resolve():
    has_api = bool(os.environ.get("RESOLVE_SCRIPT_API"))
    has_lib = bool(os.environ.get("RESOLVE_SCRIPT_LIB"))
    if has_api and has_lib:
        return "Env vars set"
    return "Env vars not set"

# ───────────────────────────��─────────────────
# 5. AUDACITY
# ─────────────────────────────────────────────

def enable_audacity():
    print("\n[Audacity] Enabling mod-script-pipe...")

    if not must_be_closed("Audacity", "Audacity"):
        return

    if OS == "Windows":
        cfg = USER / "AppData/Roaming/audacity/audacity.cfg"
    elif OS == "Darwin":
        cfg = USER / "Library/Application Support/audacity/audacity.cfg"
    else:
        cfg = USER / ".audacity-data/audacity.cfg"

    if not cfg.exists():
        print(f"   audacity.cfg not found. Launch Audacity once to create it.")
        return

    backup = str(cfg) + ".backup"
    shutil.copy2(cfg, backup)
    print(f"   Backup created: {backup}")

    patch_ini(cfg, "Module", "mod-script-pipe", "1")
    mark_enabled("audacity", enabled=True, notes="mod-script-pipe enabled")
    print("   mod-script-pipe enabled. Restart Audacity.")

def check_audacity():
    if OS == "Windows":
        cfg = USER / "AppData/Roaming/audacity/audacity.cfg"
    elif OS == "Darwin":
        cfg = USER / "Library/Application Support/audacity/audacity.cfg"
    else:
        cfg = USER / ".audacity-data/audacity.cfg"
    if not cfg.exists():
        return "cfg not found"
    content = cfg.read_text()
    if "mod-script-pipe=1" in content:
        return "mod-script-pipe enabled"
    return "NOT enabled"

# ─────────────────────────────────────────────
# 6. OBS STUDIO
# ─────────────────────────────────────────────

def enable_obs():
    print("\n[OBS Studio] Enabling WebSocket server...")

    if not must_be_closed("OBS Studio", "obs64.exe" if OS == "Windows" else "obs"):
        return

    if OS == "Windows":
        cfg_dir = USER / "AppData/Roaming/obs-studio/global.ini"
    elif OS == "Darwin":
        cfg_dir = USER / "Library/Application Support/obs-studio/global.ini"
    else:
        cfg_dir = USER / ".config/obs-studio/global.ini"

    if cfg_dir.exists():
        backup = str(cfg_dir) + ".backup"
        shutil.copy2(cfg_dir, backup)
        patch_ini(cfg_dir, "OBSWebSocket", "ServerEnabled", "true")
        patch_ini(cfg_dir, "OBSWebSocket", "ServerPort", "4455")
        patch_ini(cfg_dir, "OBSWebSocket", "AuthRequired", "false")
        mark_enabled("obs", enabled=True, notes="WebSocket enabled on port 4455")
        print("   WebSocket enabled on port 4455")
    else:
        print(f"   OBS config not found. Launch OBS once.")

    print("   Done. Connect with: pip install obs-websocket-py")

def check_obs():
    if OS == "Windows":
        cfg = USER / "AppData/Roaming/obs-studio/global.ini"
    elif OS == "Darwin":
        cfg = USER / "Library/Application Support/obs-studio/global.ini"
    else:
        cfg = USER / ".config/obs-studio/global.ini"
    if not cfg.exists():
        return "cfg not found"
    content = cfg.read_text()
    if "ServerEnabled=true" in content:
        return "WebSocket enabled"
    return "NOT enabled"

# ─────────────────────────────────────────────
# 7. BLENDER
# ─────────────────────────────────────────────

def enable_blender():
    print("\n[Blender] Python scripting is built-in — no enablement needed.")
    blender_path = shutil.which("blender")
    if blender_path:
        print(f"   Blender found: {blender_path}")
        mark_enabled("blender", enabled=True, notes="Built-in bpy available")
        print("   Headless example: blender --background --python script.py")
    else:
        print("   Blender not in PATH")

def check_blender():
    return "Built-in" if shutil.which("blender") else "Not in PATH"

# ─────────────────────────────────────────────
# 8. ABLETON LIVE
# ─────────────────────────────────────────────

def enable_ableton():
    print("\n[Ableton Live] Setting up AbletonOSC...")

    if OS == "Windows":
        remote_scripts = USER / "Documents/Ableton/User Library/Remote Scripts"
    elif OS == "Darwin":
        remote_scripts = USER / "Music/Ableton/User Library/Remote Scripts"
    else:
        remote_scripts = USER / "Documents/Ableton/User Library/Remote Scripts"

    remote_scripts.mkdir(parents=True, exist_ok=True)
    abletonosc_dir = remote_scripts / "AbletonOSC"

    if abletonosc_dir.exists():
        print(f"   AbletonOSC already installed")
    else:
        print(f"   Download from: https://github.com/ideoforms/AbletonOSC/releases")
        print(f"   Copy to: {remote_scripts}")

    print()
    print("   MANUAL STEP:")
    print("   Ableton > Preferences > MIDI > Control Surface = AbletonOSC")

    mark_enabled("ableton", enabled=True, notes="AbletonOSC remote script installed")
    print("   Installing pylive and python-osc...")
    subprocess.run([sys.executable, "-m", "pip", "install", "pylive", "python-osc", "-q"])
    print("   Packages installed.")

def check_ableton():
    if OS == "Windows":
        p = USER / "Documents/Ableton/User Library/Remote Scripts/AbletonOSC"
    elif OS == "Darwin":
        p = USER / "Music/Ableton/User Library/Remote Scripts/AbletonOSC"
    else:
        p = USER / "Documents/Ableton/User Library/Remote Scripts/AbletonOSC"
    return "AbletonOSC installed" if p.exists() else "Not found"

# ─────────────────────────────────────────────
# 9. UNREAL ENGINE
# ─────────────────────────────────────────────

def enable_unreal(project_path=None):
    print("\n[Unreal Engine] Enabling Python scripting...")

    if not project_path:
        print("   No project path. Manually: Edit > Plugins > Python Editor Script Plugin")
        return

    cfg = Path(project_path) / "Config/DefaultEngine.ini"
    if not cfg.exists():
        print(f"   DefaultEngine.ini not found")
        return

    plugin_section = """
[/Script/PythonScriptPlugin.PythonScriptPluginSettings]
bDeveloperMode=True
bRemoteExecution=True
"""
    content = cfg.read_text()
    if "PythonScriptPlugin" not in content:
        with open(cfg, 'a') as f:
            f.write(plugin_section)
        print("   Python scripting settings added")

    mark_enabled("unreal", enabled=True, notes="PythonScriptPlugin settings added")
    print("   Also enable via: UE Editor > Edit > Plugins > Python Editor Script Plugin")

def check_unreal():
    return "Requires project path"

# ─────────────────────────────────────────────
# 10. GIMP
# ─────────────────────────────────────────────

def enable_gimp():
    print("\n[GIMP] Python-Fu is built-in — no enablement needed.")
    gimp = shutil.which("gimp")
    if gimp:
        print(f"   GIMP found: {gimp}")
        mark_enabled("gimp", enabled=True, notes="Python-Fu built-in")

def check_gimp():
    return "Built-in" if shutil.which("gimp") else "Not in PATH"

# ─────────────────────────────────────────────
# 11. INKSCAPE
# ─────────────────────────────────────────────

def enable_inkscape():
    print("\n[Inkscape] Checking CLI and inkex...")
    ink = shutil.which("inkscape")
    if ink:
        print(f"   Inkscape CLI found: {ink}")
    else:
        print("   Inkscape not in PATH")

    try:
        import inkex
        print("   inkex Python package installed")
        mark_enabled("inkscape", enabled=True, notes="CLI + inkex ready")
    except ImportError:
        print("   Installing inkex...")
        subprocess.run([sys.executable, "-m", "pip", "install", "inkex", "-q"])
        print("   inkex installed")

def check_inkscape():
    has_cli = bool(shutil.which("inkscape"))
    try:
        import inkex
        has_inkex = True
    except ImportError:
        has_inkex = False
    return f"Ready" if (has_cli and has_inkex) else f"CLI {'OK' if has_cli else 'MISSING'}"

# ─────────────────────────────────────────────
# 12. ADOBE ANIMATE
# ─────────────────────────────────────────────

def enable_animate():
    print("\n[Adobe Animate] JSFL scripting is built-in — no enablement needed.")
    mark_enabled("animate", enabled=True, notes="JSFL built-in")
    print("   Place .jsfl scripts in Commands folder for menu access.")
    if OS == "Windows":
        print("     %APPDATA%\\Adobe\\Animate 2024\\<lang>\\Configuration\\Commands\\")
    elif OS == "Darwin":
        print("     ~/Library/Application Support/Adobe/Animate 2024/<lang>/Configuration/Commands/")

def check_animate():
    if OS == "Windows":
        path = Path("C:/Program Files/Adobe/Adobe Animate 2024")
    elif OS == "Darwin":
        path = Path("/Applications/Adobe Animate 2024")
    else:
        return "N/A"
    return "Found" if path.exists() else "Not found"

# ─────────────────────────────────────────────
# STATUS CHECK
# ─────────────────────────────────────────────

def check_all():
    state = load_state()
    enabled_apps = [k for k, v in state.items() if v.get("enabled", False)]
    
    print("\n" + "="*55)
    print("  SCRIPTING ENABLEMENT STATUS CHECK")
    print("="*55)
    
    if enabled_apps:
        print(f"\n  ENABLED APPS ({len(enabled_apps)}):")
        for app in sorted(enabled_apps):
            info = state[app]
            ts = info.get("timestamp", "unknown")
            notes = info.get("notes", "")
            print(f"    {app:<25} ({ts[:10]}) - {notes}")
    
    print(f"\n  ALL APPS CHECK:")
    checks = [
        ("Adobe Photoshop",     check_photoshop),
        ("Adobe After Effects", check_aftereffects),
        ("Adobe Premiere Pro",  check_premiere),
        ("Adobe Animate",       check_animate),
        ("DaVinci Resolve",     check_resolve),
        ("Audacity",            check_audacity),
        ("OBS Studio",          check_obs),
        ("Blender",             check_blender),
        ("Ableton Live",        check_ableton),
        ("Unreal Engine",       check_unreal),
        ("GIMP",                check_gimp),
        ("Inkscape",            check_inkscape),
    ]
    for name, fn in checks:
        try:
            status = fn()
        except Exception as e:
            status = f"ERROR: {e}"
        enabled_mark = " [ENABLED]" if state.get(name.lower().replace(" ", ""), {}).get("enabled") else ""
        print(f"  {name:<25} {status}{enabled_mark}")
    print("="*55)

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

APP_MAP = {
    "photoshop":    enable_photoshop,
    "aftereffects": enable_aftereffects,
    "ae":           enable_aftereffects,
    "premiere":     enable_premiere,
    "resolve":      enable_resolve,
    "davinci":      enable_resolve,
    "audacity":     enable_audacity,
    "obs":          enable_obs,
    "blender":      enable_blender,
    "ableton":      enable_ableton,
    "unreal":       enable_unreal,
    "gimp":         enable_gimp,
    "inkscape":     enable_inkscape,
    "animate":      enable_animate,
}

def enable_all():
    print("="*55)
    print("  ENABLING SCRIPTING FOR ALL SUPPORTED APPS")
    print("="*55)
    enable_photoshop()
    enable_aftereffects()
    enable_premiere()
    enable_animate()
    enable_resolve()
    enable_audacity()
    enable_obs()
    enable_blender()
    enable_ableton()
    enable_gimp()
    enable_inkscape()
    print("\n" + "="*55)
    print("  DONE. Restart any apps that were modified.")
    print("="*55)

if __name__ == "__main__":
    args = sys.argv[1:]

    if not args or "--help" in args:
        print(__doc__)
    elif "--status" in args:
        # Show only the enabled apps (what Control has enabled)
        state = load_state()
        print("\n" + "="*55)
        print("  ENABLED APPS (Remembered by Control)")
        print("="*55)
        enabled = [(k, v) for k, v in state.items() if v.get("enabled", False)]
        if enabled:
            for app, info in sorted(enabled):
                ts = info.get("timestamp", "")
                notes = info.get("notes", "")
                print(f"  {app:<25}")
                print(f"    Enabled: {ts[:10] if ts else 'unknown'}")
                if notes:
                    print(f"    Notes: {notes}")
        else:
            print("  No apps enabled yet. Run --app <name> or --all")
        print("="*55)
    elif "--check" in args:
        check_all()
    elif "--all" in args:
        enable_all()
    elif "--app" in args:
        idx = args.index("--app")
        if idx + 1 < len(args):
            app_key = args[idx + 1].lower().replace("-", "").replace(" ", "")
            if app_key in APP_MAP:
                APP_MAP[app_key]()
            else:
                print(f"Unknown app: {args[idx+1]}")
                print(f"Available: {', '.join(APP_MAP.keys())}")
        else:
            print("--app requires an argument. e.g. --app photoshop")
    else:
        print(f"Unknown argument: {args}")
        print("Use --help for usage.")