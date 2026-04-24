const path = require('path');
const fs = require('fs');
const os = require('os');
const { screen } = require('electron');
const { exec } = require('child_process');

class ToolRegistry {
    constructor() {
        this.tools = {};
        this.registerTools();
    }

    registerTools() {
        this.tools = {};

        this.tools['screenshot'] = {
            name: 'screenshot',
            description: 'Capture a screenshot of the current desktop display. Returns base64-encoded image data that can be analyzed for UI elements, text, and visual state.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const screenshot = require('screenshot-desktop');
                const displays = await screenshot.listDisplays();
                const primary = displays.find(d => d.id !== -1) || displays[0];
                const imgBuffer = await screenshot({ format: 'png', screen: primary.id });
                return {
                    success: true,
                    screenshot: imgBuffer.toString('base64'),
                    format: 'base64',
                    resolution: `${primary.width}x${primary.height}`
                };
            }
        };

        this.tools['click'] = {
            name: 'click',
            description: 'Perform a mouse click at specific screen coordinates. Use screenshot first to identify target coordinates. Supports confidence scores for AI verification.',
            parameters: {
                type: 'object',
                properties: {
                    x: { type: 'integer', minimum: 0, maximum: 10000, description: 'Horizontal position in pixels (normalized 0-1000, scaled to screen)' },
                    y: { type: 'integer', minimum: 0, maximum: 10000, description: 'Vertical position in pixels (normalized 0-1000, scaled to screen)' },
                    box2d: { type: 'array', items: { type: 'number' }, description: 'Bounding box [ymin, xmin, ymax, xmax] for gemini or [xmin, ymin, xmax, ymax] for others' },
                    confidence: { type: 'integer', minimum: 0, maximum: 100, description: 'Confidence percentage (95+ skips AI verification)' },
                    label: { type: 'string', description: 'Label describing what to click' },
                    skip_ai_verify: { type: 'boolean', description: 'Skip AI verification step' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const { mouse, Button, Point } = require('@computer-use/nut-js');
                const screenSize = screen.getPrimaryDisplay().workAreaSize;
                let targetX, targetY;

                if (params.box2d && Array.isArray(params.box2d) && params.box2d.length === 4) {
                    const [ymin, xmin, ymax, xmax] = params.box2d;
                    const centerNormX = xmin + (xmax - xmin) / 2;
                    const centerNormY = ymin + (ymax - ymin) / 2;
                    targetX = Math.round(centerNormX * screenSize.width / 1000);
                    targetY = Math.round(centerNormY * screenSize.height / 1000);
                } else if (params.x !== undefined && params.y !== undefined) {
                    targetX = Math.round((params.x / 1000) * screenSize.width);
                    targetY = Math.round((params.y / 1000) * screenSize.height);
                }

                if (targetX !== undefined && targetY !== undefined) {
                    await mouse.setPosition(new Point(targetX, targetY));
                    await mouse.leftClick();
                    return {
                        success: true,
                        message: `Clicked at (${targetX}, ${targetY}) ${params.label ? `[${params.label}]` : ''}`
                    };
                }
                return { success: false, error: 'No coordinates provided' };
            }
        };

        this.tools['right_click'] = {
            name: 'right_click',
            description: 'Perform a right mouse click at specific screen coordinates.',
            parameters: {
                type: 'object',
                properties: {
                    x: { type: 'integer', minimum: 0, maximum: 10000, description: 'Horizontal position (normalized 0-1000)' },
                    y: { type: 'integer', minimum: 0, maximum: 10000, description: 'Vertical position (normalized 0-1000)' },
                    box2d: { type: 'array', items: { type: 'number' }, description: 'Bounding box [ymin, xmin, ymax, xmax]' },
                    label: { type: 'string', description: 'Label describing target' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const { mouse, Button, Point } = require('@computer-use/nut-js');
                const screenSize = screen.getPrimaryDisplay().workAreaSize;
                let targetX, targetY;

                if (params.box2d && Array.isArray(params.box2d) && params.box2d.length === 4) {
                    const [ymin, xmin, ymax, xmax] = params.box2d;
                    targetX = Math.round(((xmin + (xmax - xmin) / 2) / 1000) * screenSize.width);
                    targetY = Math.round(((ymin + (ymax - ymin) / 2) / 1000) * screenSize.height);
                } else if (params.x !== undefined && params.y !== undefined) {
                    targetX = Math.round((params.x / 1000) * screenSize.width);
                    targetY = Math.round((params.y / 1000) * screenSize.height);
                }

                if (targetX !== undefined && targetY !== undefined) {
                    await mouse.setPosition(new Point(targetX, targetY));
                    await mouse.rightClick();
                    return { success: true, message: `Right-clicked at (${targetX}, ${targetY})` };
                }
                return { success: false, error: 'No coordinates provided' };
            }
        };

        this.tools['double_click'] = {
            name: 'double_click',
            description: 'Perform a double-click at specific screen coordinates.',
            parameters: {
                type: 'object',
                properties: {
                    x: { type: 'integer', minimum: 0, maximum: 10000, description: 'Horizontal position (normalized 0-1000)' },
                    y: { type: 'integer', minimum: 0, maximum: 10000, description: 'Vertical position (normalized 0-1000)' },
                    box2d: { type: 'array', items: { type: 'number' }, description: 'Bounding box [ymin, xmin, ymax, xmax]' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const { mouse, Button, Point } = require('@computer-use/nut-js');
                const screenSize = screen.getPrimaryDisplay().workAreaSize;
                let targetX, targetY;

                if (params.box2d && Array.isArray(params.box2d) && params.box2d.length === 4) {
                    const [ymin, xmin, ymax, xmax] = params.box2d;
                    targetX = Math.round(((xmin + (xmax - xmin) / 2) / 1000) * screenSize.width);
                    targetY = Math.round(((ymin + (ymax - ymin) / 2) / 1000) * screenSize.height);
                } else if (params.x !== undefined && params.y !== undefined) {
                    targetX = Math.round((params.x / 1000) * screenSize.width);
                    targetY = Math.round((params.y / 1000) * screenSize.height);
                }

                if (targetX !== undefined && targetY !== undefined) {
                    await mouse.setPosition(new Point(targetX, targetY));
                    await mouse.doubleClick(Button.LEFT);
                    return { success: true, message: `Double-clicked at (${targetX}, ${targetY})` };
                }
                return { success: false, error: 'No coordinates provided' };
            }
        };

        this.tools['mouse_move'] = {
            name: 'mouse_move',
            description: 'Move the mouse cursor to specific screen coordinates.',
            parameters: {
                type: 'object',
                properties: {
                    x: { type: 'integer', minimum: 0, maximum: 10000, description: 'Horizontal position (normalized 0-1000)' },
                    y: { type: 'integer', minimum: 0, maximum: 10000, description: 'Vertical position (normalized 0-1000)' },
                    box2d: { type: 'array', items: { type: 'number' }, description: 'Bounding box [ymin, xmin, ymax, xmax]' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const { mouse, Point } = require('@computer-use/nut-js');
                const screenSize = screen.getPrimaryDisplay().workAreaSize;
                let targetX, targetY;

                if (params.box2d && Array.isArray(params.box2d) && params.box2d.length === 4) {
                    const [ymin, xmin, ymax, xmax] = params.box2d;
                    targetX = Math.round(((xmin + (xmax - xmin) / 2) / 1000) * screenSize.width);
                    targetY = Math.round(((ymin + (ymax - ymin) / 2) / 1000) * screenSize.height);
                } else if (params.x !== undefined && params.y !== undefined) {
                    targetX = Math.round((params.x / 1000) * screenSize.width);
                    targetY = Math.round((params.y / 1000) * screenSize.height);
                }

                if (targetX !== undefined && targetY !== undefined) {
                    await mouse.setPosition(new Point(targetX, targetY));
                    return { success: true, message: `Mouse moved to (${targetX}, ${targetY})` };
                }
                return { success: false, error: 'No coordinates provided' };
            }
        };

        this.tools['type'] = {
            name: 'type',
            description: 'Type text at the current cursor position. Click target first to focus, then type.',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'The text string to type' },
                    x: { type: 'integer', minimum: 0, maximum: 10000, description: 'Horizontal position to click first (normalized 0-1000)' },
                    y: { type: 'integer', minimum: 0, maximum: 10000, description: 'Vertical position to click first (normalized 0-1000)' },
                    box2d: { type: 'array', items: { type: 'number' }, description: 'Bounding box to click first' },
                    clear_first: { type: 'boolean', description: 'Select all and clear before typing' }
                },
                required: ['text'],
                additionalProperties: false
            },
            execute: async (params) => {
                const { keyboard, mouse, Point, Key } = require('@computer-use/nut-js');

                if (params.box2d || (params.x !== undefined && params.y !== undefined)) {
                    const screenSize = screen.getPrimaryDisplay().workAreaSize;
                    let targetX, targetY;
                    if (params.box2d) {
                        const [ymin, xmin, ymax, xmax] = params.box2d;
                        targetX = Math.round(((xmin + (xmax - xmin) / 2) / 1000) * screenSize.width);
                        targetY = Math.round(((ymin + (ymax - ymin) / 2) / 1000) * screenSize.height);
                    } else {
                        targetX = Math.round((params.x / 1000) * screenSize.width);
                        targetY = Math.round((params.y / 1000) * screenSize.height);
                    }
                    await mouse.setPosition(new Point(targetX, targetY));
                    await mouse.leftClick();
                    await new Promise(r => setTimeout(r, 200));
                }

                if (params.clear_first) {
                    await keyboard.pressKey(Key.LeftControl, Key.A);
                    await keyboard.releaseKey();
                    await keyboard.pressKey(Key.Backspace);
                    await keyboard.releaseKey();
                }

                await keyboard.type(params.text);
                return { success: true, message: `Typed "${params.text.substring(0, 50)}${params.text.length > 50 ? '...' : ''}"` };
            }
        };

        this.tools['key_press'] = {
            name: 'key_press',
            description: 'Press special keyboard keys. Use for navigation (Tab, Enter, Escape) or editing (Backspace, Delete).',
            parameters: {
                type: 'object',
                properties: {
                    keys: { type: 'array', items: { type: 'string' }, description: 'Keys to press: control, shift, alt, win, enter, tab, escape, backspace, delete, space, up, down, left, right, a-z, 0-9' },
                    combo: { type: 'boolean', description: 'Press all keys simultaneously (modifier combo)' }
                },
                required: ['keys'],
                additionalProperties: false
            },
            execute: async (params) => {
                const { keyboard, Key } = require('@computer-use/nut-js');
                const keyMap = {
                    'control': Key.LeftControl, 'ctrl': Key.LeftControl,
                    'shift': Key.LeftShift, 'alt': Key.LeftAlt,
                    'win': Key.LeftWin, 'command': Key.LeftCmd, 'cmd': Key.LeftCmd,
                    'enter': Key.Enter, 'return': Key.Enter,
                    'tab': Key.Tab, 'escape': Key.Escape, 'esc': Key.Escape,
                    'backspace': Key.Backspace, 'delete': Key.Delete,
                    'space': Key.Space, 'up': Key.Up, 'down': Key.Down,
                    'left': Key.Left, 'right': Key.Right
                };

                const keys = params.keys.map(k => {
                    const lowK = k.toLowerCase();
                    if (keyMap[lowK]) return keyMap[lowK];
                    if (/^[a-z]$/.test(lowK)) return Key[lowK.toUpperCase()];
                    if (/^[0-9]$/.test(lowK)) return Key[`Num${lowK}`];
                    return k;
                });

                if (params.combo) {
                    await keyboard.pressKey(...keys);
                    await keyboard.releaseKey();
                } else {
                    for (const k of keys) await keyboard.type(k);
                }
                return { success: true, message: `Keys pressed: ${params.keys.join('+')}` };
            }
        };

        this.tools['key_combo'] = {
            name: 'key_combo',
            description: 'Execute keyboard shortcuts by pressing multiple keys simultaneously. Example: ctrl+c for copy, ctrl+v for paste.',
            parameters: {
                type: 'object',
                properties: {
                    keys: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4, description: 'Keys to press simultaneously (first is modifier)' }
                },
                required: ['keys'],
                additionalProperties: false
            },
            execute: async (params) => {
                const { keyboard, Key } = require('@computer-use/nut-js');
                const keyMap = {
                    'ctrl': Key.LeftControl, 'shift': Key.LeftShift, 'alt': Key.LeftAlt,
                    'cmd': Key.LeftCmd, 'win': Key.LeftWin, 'tab': Key.Tab, 'enter': Key.Enter
                };

                const keys = params.keys.map(k => {
                    const lowK = k.toLowerCase();
                    if (keyMap[lowK]) return keyMap[lowK];
                    if (/^[a-z]$/.test(lowK)) return Key[lowK.toUpperCase()];
                    return k;
                });

                await keyboard.pressKey(...keys);
                await keyboard.releaseKey();
                return { success: true, message: `Executed shortcut: ${params.keys.join('+')}` };
            }
        };

        this.tools['drag'] = {
            name: 'drag',
            description: 'Drag from one position to another. Useful for drag-and-drop operations or selecting text.',
            parameters: {
                type: 'object',
                properties: {
                    x: { type: 'integer', minimum: 0, maximum: 10000, description: 'Start X position (normalized 0-1000)' },
                    y: { type: 'integer', minimum: 0, maximum: 10000, description: 'Start Y position (normalized 0-1000)' },
                    end_x: { type: 'integer', minimum: 0, maximum: 10000, description: 'End X position (normalized 0-1000)' },
                    end_y: { type: 'integer', minimum: 0, maximum: 10000, description: 'End Y position (normalized 0-1000)' },
                    box2d: { type: 'array', items: { type: 'number' }, description: 'Start bounding box [ymin, xmin, ymax, xmax]' },
                    end_box2d: { type: 'array', items: { type: 'number' }, description: 'End bounding box [ymin, xmin, ymax, xmax]' }
                },
                required: [],
                additionalProperties: false
            },
execute: async (params) => {
                const { mouse, Point, straightTo } = require('@computer-use/nut-js');
                const screenSize = screen.getPrimaryDisplay().workAreaSize;
                let sx, sy, ex, ey;

                if (params.box2d && params.end_box2d) {
                    const b1 = params.box2d;
                    const b2 = params.end_box2d;
                    sx = Math.round(((b1[1] + (b1[3] - b1[1]) / 2) / 1000) * screenSize.width);
                    sy = Math.round(((b1[0] + (b1[2] - b1[0]) / 2) / 1000) * screenSize.height);
                    ex = Math.round(((b2[1] + (b2[3] - b2[1]) / 2) / 1000) * screenSize.width);
                    ey = Math.round(((b2[0] + (b2[2] - b2[0]) / 2) / 1000) * screenSize.height);
                } else if (params.x !== undefined && params.y !== undefined && params.end_x !== undefined && params.end_y !== undefined) {
                    sx = Math.round((params.x / 1000) * screenSize.width);
                    sy = Math.round((params.y / 1000) * screenSize.height);
                    ex = Math.round((params.end_x / 1000) * screenSize.width);
                    ey = Math.round((params.end_y / 1000) * screenSize.height);
                }

                if (sx !== undefined && sy !== undefined && ex !== undefined && ey !== undefined) {
                    await mouse.setPosition(new Point(sx, sy));
                    await mouse.drag(straightTo(new Point(ex, ey)));
                    return { success: true, message: 'Dragged from (' + sx + ', ' + sy + ') to (' + ex + ', ' + ey + ')' };
                }
                return { success: false, error: 'No coordinates provided' };
            }
        };

        this.tools['scroll'] = {
            name: 'scroll',
            description: 'Scroll the screen vertically. Position mouse over scrollable area first.',
            parameters: {
                type: 'object',
                properties: {
                    direction: { type: 'string', enum: ['up', 'down'], description: 'Scroll direction' },
                    amount: { type: 'integer', minimum: 1, maximum: 20, default: 3, description: 'Number of scroll units' },
                    x: { type: 'integer', minimum: 0, maximum: 10000, description: 'X position to scroll at (normalized 0-1000)' },
                    y: { type: 'integer', minimum: 0, maximum: 10000, description: 'Y position to scroll at (normalized 0-1000)' },
                    box2d: { type: 'array', items: { type: 'number' }, description: 'Bounding box to scroll at' }
                },
                required: ['direction'],
                additionalProperties: false
            },
            execute: async (params) => {
                const { mouse, Point } = require('@computer-use/nut-js');
                const screenSize = screen.getPrimaryDisplay().workAreaSize;
                const amount = params.amount || 3;

                if (params.box2d || (params.x !== undefined && params.y !== undefined)) {
                    let targetX, targetY;
                    if (params.box2d) {
                        const box = params.box2d;
                        const boxXmin = box[1];
                        const boxYmin = box[0];
                        const boxXmax = box[3];
                        const boxYmax = box[2];
                        targetX = Math.round(((boxXmin + (boxXmax - boxXmin) / 2) / 1000) * screenSize.width);
                        targetY = Math.round(((boxYmin + (boxYmax - boxYmin) / 2) / 1000) * screenSize.height);
                    } else {
                        targetX = Math.round((params.x / 1000) * screenSize.width);
                        targetY = Math.round((params.y / 1000) * screenSize.height);
                    }
                    await mouse.setPosition(new Point(targetX, targetY));
                }

                if (params.direction === 'up') await mouse.scrollUp(amount * 100);
                else await mouse.scrollDown(amount * 100);
                return { success: true, message: `Scrolled ${params.direction} ${amount} units` };
            }
        };

        this.tools['focus_window'] = {
            name: 'focus_window',
            description: 'Bring a window to the foreground and focus it.',
            parameters: {
                type: 'object',
                properties: {
                    app_name: { type: 'string', description: 'Name of the application window to focus' }
                },
                required: ['app_name'],
                additionalProperties: false
            },
            execute: async (params) => {
                return new Promise((resolve) => {
                    let command = '';
                    if (process.platform === 'win32') {
                        command = `powershell -Command "(New-Object -ComObject WScript.Shell).AppActivate('${params.app_name}')"`;
                    } else if (process.platform === 'darwin') {
                        command = `osascript -e 'tell application "${params.app_name}" to activate'`;
                    } else {
                        command = `wmctrl -a "${params.app_name}"`;
                    }
                    exec(command, (err) => {
                        resolve({ success: !err, message: err ? err.message : `Focused ${params.app_name}` });
                    });
                });
            }
        };

        this.tools['verify_coordinates'] = {
            name: 'verify_coordinates',
            description: 'Verify that a location contains a clickable element using AI analysis.',
            parameters: {
                type: 'object',
                properties: {
                    x: { type: 'integer', minimum: 0, maximum: 10000, description: 'X position (normalized 0-1000)' },
                    y: { type: 'integer', minimum: 0, maximum: 10000, description: 'Y position (normalized 0-1000)' },
                    box2d: { type: 'array', items: { type: 'number' }, description: 'Bounding box [ymin, xmin, ymax, xmax]' },
                    label: { type: 'string', description: 'Expected element label' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                return { success: true, message: 'Coordinates verified', coordinates: { x: params.x, y: params.y } };
            }
        };

        this.tools['terminal'] = {
            name: 'terminal',
            description: 'Execute a shell command and return the output.',
            parameters: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'Shell command to execute' }
                },
                required: ['command'],
                additionalProperties: false
            },
            execute: async (params) => {
                return new Promise((resolve) => {
                    exec(params.command, (err, stdout, stderr) => {
                        if (err) resolve({ success: false, error: err.message, code: err.code });
                        else resolve({ success: true, output: stdout.substring(0, 10000), stderr: stderr.substring(0, 2000) });
                    });
                });
            }
        };

this.tools['install_library'] = {
            name: 'install_library',
            description: 'Install a Python or JavaScript library. IMPORTANT: 1) Use research_package FIRST to find best library for the software. 2) Check if already installed with read_libraries. 3) Verify with test script after install.',
            parameters: {
                type: 'object',
                properties: {
                    library: { type: 'string', description: 'Name of the library to install (e.g., pyautogui, pywin32, photoshop-python-api)' },
                    package_manager: { type: 'string', enum: ['pip', 'npm'], description: 'Package manager: pip for Python, npm for JavaScript' },
                    for_software: { type: 'string', description: 'Software this library is for (e.g., photoshop, blender, gimp)' },
                    version: { type: 'string', description: 'Specific version to install (optional)' },
                    verify_install: { type: 'boolean', default: true, description: 'Verify installation by running test' },
                    user_confirmed: { type: 'boolean', description: 'User has confirmed the installation' }
                },
                required: ['library', 'package_manager', 'for_software'],
                additionalProperties: false
            },
            execute: async (params) => {
                const { exec } = require('child_process');
                const { promisify } = require('util');
                const execAsync = promisify(exec);
                
                const lib = params.library;
                const pm = params.package_manager;
                const software = params.for_software || 'unknown';
                const version = params.version || '';
                
                const checkCmd = pm === 'pip' ? `pip show ${lib}` : `npm list ${lib}`;
                let alreadyInstalled = false;
                
                try {
                    await execAsync(checkCmd, { timeout: 10000 });
                    alreadyInstalled = true;
                } catch (e) {
                    alreadyInstalled = false;
                }
                
                if (alreadyInstalled) {
                    return { 
                        success: true, 
                        message: `Library ${lib} is already installed for ${software}`,
                        already_installed: true,
                        library: lib,
                        software: software
                    };
                }
                
                if (!params.user_confirmed) {
                    return { 
                        success: false, 
                        error: 'User confirmation required for library installation',
                        requires_confirmation: true,
                        confirmation_prompt: `Install ${lib} (${pm}) for ${software}?`,
                        library: lib,
                        software: software
                    };
                }
                
                const installCmd = pm === 'pip' 
                    ? `pip install ${version ? lib + '==' + version : lib}` 
                    : `npm install ${lib}${version ? '@' + version : ''}`;
                
                try {
                    const { stdout, stderr } = await execAsync(installCmd, { timeout: 120000 });
                    
                    if (params.verify_install !== false) {
                        let verifyCmd = pm === 'pip' ? `pip show ${lib}` : `npm list ${lib}`;
                        try {
                            await execAsync(verifyCmd, { timeout: 10000 });
                        } catch (vErr) {
                            return { 
                                success: false, 
                                error: 'Installation succeeded but verification failed',
                                install_output: stdout + stderr
                            };
                        }
                    }
                    
                    return { 
                        success: true, 
                        message: `Successfully installed ${lib} for ${software}`,
                        library: lib,
                        software: software,
                        package_manager: pm
                    };
                } catch (installErr) {
                    return { 
                        success: false, 
                        error: `Installation failed: ${installErr.message}`,
                        library: lib,
                        software: software
                    };
                }
            }
        };

        this.tools['research_package'] = {
            name: 'research_package',
            description: 'Research best library for controlling a specific software. Returns recommended library, installation method, and how to use it. CRITICAL: Always use this BEFORE installing libraries.',
            parameters: {
                type: 'object',
                properties: {
                    software: { type: 'string', description: 'Software name (e.g., photoshop, blender, gimp, illustrator, premiere, davinci-resolve, after-effects, audacity, obs, figma, firefox, chrome, word, excel, outlook, slack, discord, zoom, teams, spotify, vlc, steam, epic-games, uplay, minecraft, roblox, unreal-engine, unity, auto-cad, solidworks, revit, fusion-360, sketchup, inkscape, affinity-photo, affinity-designer, canva)' },
                    task: { type: 'string', description: 'What you want to do (e.g., open file, export, create layer, add effect, render, automate)' }
                },
                required: ['software', 'task'],
                additionalProperties: false
            },
            execute: async (params) => {
                const software = (params.software || '').toLowerCase();
                const task = (params.task || '').toLowerCase();
                
                const knowledgeBase = {
                    'photoshop': { lib: 'photoshop-python-api', alt: 'pywin32', pm: 'pip', platform: 'windows', tier: '🟡 Bridge/Wrapper', headless: false, install: 'pip install photoshop-python-api pywin32', usage: 'import photoshop.api as ps; app = ps.Application()' },
                    'illustrator': { lib: 'pywin32', alt: 'comtypes', pm: 'pip', platform: 'windows', tier: '🟡 Bridge/Wrapper', headless: false, install: 'pip install pywin32', usage: 'from win32com.client import Dispatch; app = Dispatch("Illustrator.Application")' },
                    'blender': { lib: 'bpy', alt: 'blender --python', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'pip install bpy (or use blender --python)', usage: 'import bpy; bpy.ops.mesh.primitive_cube_add()' },
                    'gimp': { lib: 'gimpfu', alt: 'subprocess', pm: 'none', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'Install GIMP (bundles Python-Fu)', usage: 'gimp --batch "(python-fu-eval ...)"' },
                    'inkscape': { lib: 'inkex', alt: 'CLI', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'pip install inkex', usage: 'import inkex; class MyExtension(inkex.EffectExtension)' },
                    'premiere': { lib: 'pymiere', alt: 'pywin32', pm: 'pip', platform: 'windows', tier: '🟡 Bridge/Wrapper', headless: false, install: 'pip install pymiere + PymiereLink extension in Premiere', usage: 'import pymiere; seq = pymiere.objects.app.project.activeSequence' },
                    'davinci-resolve': { lib: 'DaVinciResolveScript', alt: 'pydavinci', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: false, install: 'pip install pydavinci', usage: 'import DaVinciResolveScript as dvr; resolve = dvr.scriptapp("Resolve")' },
                    'after-effects': { lib: 'pywin32', alt: 'comtypes', pm: 'pip', platform: 'windows', tier: '🟡 Bridge/Wrapper', headless: false, install: 'pip install pywin32', usage: 'from win32com.client import Dispatch; ae = Dispatch("AfterEffects.Application")' },
                    'audacity': { lib: 'mod-script-pipe', alt: 'subprocess', pm: 'none', platform: 'all', tier: '🟡 Bridge/Wrapper', headless: false, install: 'Enable mod-script-pipe in Audacity preferences', usage: 'Use named pipes to send commands to Audacity' },
                    'obs': { lib: 'obs-websocket-py', alt: 'websocket', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: false, install: 'pip install obs-websocket-py', usage: 'import obswebsocket; ws = obswebsocket.obsws("localhost", 4455)' },
                    'figma': { lib: 'figmapy', alt: 'requests', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'pip install figmapy requests', usage: 'from figmapy import FigmaPy; figma = FigmaPy(token="...")' },
                    'canva': { lib: 'requests', alt: 'canva-api', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'pip install requests', usage: 'Use Canva Connect REST API' },
                    'handbrake': { lib: 'HandBrakeCLI', alt: 'handbrake-python', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'pip install handbrake-python', usage: 'subprocess.run(["HandBrakeCLI", "-i", "input.mp4", "-o", "output.mp4"])' },
                    'autocad': { lib: 'pyautocad', alt: 'pywin32', pm: 'pip', platform: 'windows', tier: '🟡 Bridge/Wrapper', headless: false, install: 'pip install pyautocad pywin32', usage: 'from pyautocad import Autocad; acad = Autocad()' },
                    'coreldraw': { lib: 'pywin32', alt: 'comtypes', pm: 'pip', platform: 'windows', tier: '🟡 Bridge/Wrapper', headless: false, install: 'pip install pywin32', usage: 'from win32com.client import Dispatch; app = Dispatch("CorelDRAW.Application")' },
                    'affinity-photo': { lib: 'pyautogui', alt: 'pyobjc', pm: 'pip', platform: 'all', tier: '🔴 GUI Automation', headless: false, install: 'pip install pyautogui pillow', usage: 'import pyautogui; pyautogui.click(x, y)' },
                    'affinity-designer': { lib: 'pyautogui', alt: 'pyobjc', pm: 'pip', platform: 'all', tier: '🔴 GUI Automation', headless: false, install: 'pip install pyautogui pillow', usage: 'import pyautogui; pyautogui.click(x, y)' },
                    'firefox': { lib: 'selenium', alt: 'playwright', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'pip install selenium webdriver-manager', usage: 'from selenium import webdriver; driver = webdriver.Firefox()' },
                    'chrome': { lib: 'selenium', alt: 'playwright', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'pip install selenium webdriver-manager', usage: 'from selenium import webdriver; driver = webdriver.Chrome()' },
                    'word': { lib: 'python-docx', alt: 'pywin32', pm: 'pip', platform: 'windows', tier: '🟢 Native/Deep API', headless: false, install: 'pip install python-docx', usage: 'from docx import Document; doc = Document()' },
                    'excel': { lib: 'openpyxl', alt: 'pywin32', pm: 'pip', platform: 'windows', tier: '🟢 Native/Deep API', headless: false, install: 'pip install openpyxl', usage: 'from openpyxl import Workbook; wb = Workbook()' },
                    'vlc': { lib: 'python-vlc', alt: 'subprocess', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: false, install: 'pip install python-vlc', usage: 'import vlc; player = vlc.MediaPlayer("file.mp4")' },
                    'unreal-engine': { lib: 'unreal', alt: 'CLI', pm: 'none', platform: 'windows', tier: '🟢 Native/Deep API', headless: false, install: 'Enable Python Editor Script Plugin in Unreal', usage: 'import unreal; asset_tools = unreal.AssetToolsHelpers.get_asset_tools()' },
                    'unity': { lib: 'unity-cli', alt: 'subprocess', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'Use Unity CLI: unity -batchmode -buildTarget', usage: 'Unity -batchmode -quit -projectPath /path -buildTarget Win64 -executeMethod BuildScript.Build' },
                    'cinema-4d': { lib: 'c4dpy', alt: 'subprocess', pm: 'none', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'Use Cinema 4D built-in Python (c4dpy)', usage: 'c4dpy script.py (headless)' },
                    'sketchup': { lib: 'sketchapi', alt: 'ruby', pm: 'pip', platform: 'all', tier: '🟡 Bridge/Wrapper', headless: false, install: 'pip install sketchapi', usage: 'from sketchup import Sketchup; model = Sketchup.active_model' },
                    'sketch': { lib: 'sketchtool', alt: 'subprocess', pm: 'none', platform: 'macos', tier: '🟠 GUI Automation', headless: true, install: 'Install Sketch and use sketchtool CLI', usage: 'sketchtool export artboards file.sketch' },
                    'final-cut-pro': { lib: 'fcpxml', alt: 'applescript', pm: 'pip', platform: 'macos', tier: '🔴 Limited/Workaround', headless: false, install: 'pip install fcpxml', usage: 'Generate FCPXML and import into FCPX' },
                    'ableton-live': { lib: 'pylive', alt: 'AbletonOSC', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: false, install: 'pip install pylive python-osc + AbletonOSC', usage: 'import live; s = live.Set(); s.tempo = 128' },
                    'lottie': { lib: 'lottie', alt: 'svglib', pm: 'pip', platform: 'all', tier: '🟢 Native/Deep API', headless: true, install: 'pip install lottie', usage: 'import lottie; anim = lottie.parsers.parse("file.json")' },
                    'capcut': { lib: 'pyautogui', alt: 'none', pm: 'pip', platform: 'all', tier: '🔴 GUI Automation', headless: false, install: 'pip install pyautogui', usage: 'pyautogui for basic automation (no API exists)' },
                    'lightroom': { lib: 'requests', alt: 'lightroom-sdk', pm: 'pip', platform: 'all', tier: '🟡 Bridge/Wrapper', headless: false, install: 'pip install requests + Adobe Lightroom REST API', usage: 'Use Lightroom REST API for cloud, Lua SDK for Classic' }
                };
                
                const knownSoftware = Object.keys(knowledgeBase);
                const matched = knownSoftware.find(s => software.includes(s) || s.includes(software));
                
                if (matched) {
                    const info = knowledgeBase[matched];
                    return {
                        success: true,
                        software: matched,
                        recommended_library: info.lib,
                        alternative: info.alt,
                        package_manager: info.pm,
                        platform: info.platform,
                        tier: info.tier,
                        headless: info.headless,
                        install_command: info.install,
                        usage_example: info.usage,
                        recommendation: `For ${matched}, use ${info.lib} (${info.tier}). ${info.headless ? 'Supports headless operation.' : 'Requires GUI to be open.'}`
                    };
                }
                
                const universalFallback = {
                    lib: 'pyautogui',
                    alt: 'pywin32 (Windows) / pyobjc (Mac)',
                    pm: 'pip',
                    platform: 'all',
                    tier: '🔴 GUI Automation',
                    headless: false,
                    install: 'pip install pyautogui pillow',
                    usage: 'import pyautogui; pyautogui.click(x, y)'
                };
                
                return {
                    success: true,
                    software: software,
                    recommended_library: universalFallback.lib,
                    alternative: universalFallback.alt,
                    package_manager: universalFallback.pm,
                    platform: universalFallback.platform,
                    tier: universalFallback.tier,
                    headless: universalFallback.headless,
                    install_command: universalFallback.install,
                    usage_example: universalFallback.usage,
                    recommendation: `No specific API found for ${software}. Using universal GUI automation: ${universalFallback.lib}. Note: This is less reliable than native APIs.`,
                    note: 'Consider searching online for best automation methods for this specific software'
                };
            }
        };

        this.tools['run_script'] = {
            name: 'run_script',
            description: 'Execute a Python or JavaScript script.',
            parameters: {
                type: 'object',
                properties: {
                    script: { type: 'string', description: 'Script code to execute' },
                    language: { type: 'string', enum: ['python', 'javascript'], description: 'Script language' },
                    args: { type: 'array', items: { type: 'string' }, description: 'Command line arguments' },
                    dependencies: { type: 'array', items: { type: 'string' }, description: 'Required libraries to install first' },
                    user_confirmed: { type: 'boolean', description: 'User has confirmed dependency installation' }
                },
                required: ['script', 'language'],
                additionalProperties: false
            },
            execute: async (params) => {
                const tmpDir = os.tmpdir();
                const ext = params.language === 'python' ? '.py' : '.js';
                const tmpFile = path.join(tmpDir, `temp_script_${Date.now()}${ext}`);
                fs.writeFileSync(tmpFile, params.script);
                const cmd = params.language === 'python' ? `python "${tmpFile}"` : `node "${tmpFile}"`;
                return new Promise((resolve) => {
                    exec(cmd, (err, stdout, stderr) => {
                        fs.unlinkSync(tmpFile);
                        if (err) resolve({ success: false, error: err.message, output: stderr });
                        else resolve({ success: true, output: stdout.substring(0, 10000) });
                    });
                });
            }
        };

        this.tools['web_search'] = {
            name: 'web_search',
            description: 'Open system browser and perform a web search.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query' }
                },
                required: ['query'],
                additionalProperties: false
            },
            execute: async (params) => {
                const { shell } = require('electron');
                const url = `https://www.google.com/search?q=${encodeURIComponent(params.query)}`;
                shell.openExternal(url);
                return { success: true, message: `Opened browser for search: ${params.query}` };
            }
        };

        this.tools['browser_open'] = {
            name: 'browser_open',
            description: 'Open the Control Agentic Browser. Optionally navigate to a URL.',
            parameters: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'URL to navigate to (optional)' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    let result;
                    if (params.url) {
                        result = await electronBrowserManager.open(params.url);
                    } else {
                        result = await electronBrowserManager.openBrowser();
                    }
                    return result;
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_execute_js'] = {
            name: 'browser_execute_js',
            description: 'Execute JavaScript in the Agentic Browser context.',
            parameters: {
                type: 'object',
                properties: {
                    script: { type: 'string', description: 'JavaScript code to execute' }
                },
                required: ['script'],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const result = await electronBrowserManager.executeJs(params.script);
                    return { success: true, result: result };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_screenshot'] = {
            name: 'browser_screenshot',
            description: 'Take a screenshot of the Agentic Browser content.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const buffer = await electronBrowserManager.takeScreenshot();
                    return { success: true, screenshot: buffer.toString('base64') };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_close'] = {
            name: 'browser_close',
            description: 'Close the Agentic Browser.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const electronBrowserManager = require('./electron-browser-manager');
                await electronBrowserManager.close();
                return { success: true, message: 'Browser closed' };
            }
        };

        this.tools['browser_scrape_data'] = {
            name: 'browser_scrape_data',
            description: 'Scrape data from web page elements using CSS selector.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector to match elements' }
                },
                required: ['selector'],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const scraped = await electronBrowserManager.scrapePage(params.selector);
                    return { success: true, data: scraped };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_scrape_text'] = {
            name: 'browser_scrape_text',
            description: 'Extract text content from web page elements using CSS selector.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector to match elements' }
                },
                required: ['selector'],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const texts = await electronBrowserManager.scrapeText(params.selector);
                    return { success: true, texts: texts };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_scrape_links'] = {
            name: 'browser_scrape_links',
            description: 'Extract all links from the current web page.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const links = await electronBrowserManager.scrapeLinks();
                    return { success: true, links: links };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_navigate_via_js'] = {
            name: 'browser_navigate_via_js',
            description: 'Navigate the Agentic Browser to a URL using JavaScript injection.',
            parameters: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'URL to navigate to' }
                },
                required: ['url'],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const result = await electronBrowserManager.navigateViaJs(params.url);
                    return { success: true, url: params.url };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_click_element'] = {
            name: 'browser_click_element',
            description: 'Click an element in the Agentic Browser using CSS selector.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector of element to click' }
                },
                required: ['selector'],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const result = await electronBrowserManager.clickElement(params.selector);
                    return result;
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_type_into'] = {
            name: 'browser_type_into',
            description: 'Type text into an input element in the Agentic Browser.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector of input element' },
                    text: { type: 'string', description: 'Text to type' }
                },
                required: ['selector', 'text'],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const result = await electronBrowserManager.typeInto(params.selector, params.text);
                    return result;
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_scroll'] = {
            name: 'browser_scroll',
            description: 'Scroll to an element or position in the Agentic Browser.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector to scroll to' },
                    position: { type: 'integer', description: 'Vertical position to scroll to' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    if (params.selector) {
                        await electronBrowserManager.scrollTo(params.selector);
                    } else if (params.position) {
                        await electronBrowserManager.scrollTo(params.position);
                    }
                    return { success: true };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_get_clickable'] = {
            name: 'browser_get_clickable',
            description: 'Get all clickable elements from the current web page.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const elements = await electronBrowserManager.getClickableElements();
                    return { success: true, elements: elements };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_get_element'] = {
            name: 'browser_get_element',
            description: 'Get element info at a specific position or by CSS selector.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector' },
                    x: { type: 'integer', description: 'X position' },
                    y: { type: 'integer', description: 'Y position' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    if (params.selector) {
                        const element = await electronBrowserManager.querySelector(params.selector);
                        return { success: !!element, element: element };
                    } else if (params.x !== undefined && params.y !== undefined) {
                        const element = await electronBrowserManager.getElementAtPosition(params.x, params.y);
                        return { success: true, element: element };
                    }
                    return { success: false, error: 'Provide selector or x,y coordinates' };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_wait_for_selector'] = {
            name: 'browser_wait_for_selector',
            description: 'Wait for an element to appear in the Agentic Browser.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector to wait for' },
                    timeout: { type: 'integer', default: 10000, description: 'Timeout in milliseconds' }
                },
                required: ['selector'],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const result = await electronBrowserManager.waitForSelector(params.selector, params.timeout || 10000);
                    return { success: result.found, message: result.found ? 'Found' : result.message };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_extract_forms'] = {
            name: 'browser_extract_forms',
            description: 'Extract all form fields from the current web page.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const forms = await electronBrowserManager.extractFormFields();
                    return { success: true, forms: forms };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_scrape_screenshot'] = {
            name: 'browser_scrape_screenshot',
            description: 'Capture screenshot of elements matching a CSS selector.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const buffer = await electronBrowserManager.takeScreenshot();
                    return { success: true, screenshot: buffer.toString('base64') };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_submit'] = {
            name: 'browser_submit',
            description: 'Submit a form in the Agentic Browser.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector of form or submit button' }
                },
                required: ['selector'],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const result = await electronBrowserManager.submitForm(params.selector);
                    return result;
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_get_state'] = {
            name: 'browser_get_state',
            description: 'Get current state of the Agentic Browser.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const state = await electronBrowserManager.getBrowserState();
                    return { success: true, state: state };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_get_element'] = {
            name: 'browser_get_element',
            description: 'Get element information by CSS selector or screen coordinates.',
            parameters: {
                type: 'object',
                properties: {
                    selector: { type: 'string', description: 'CSS selector of element' },
                    x: { type: 'integer', description: 'X position on screen' },
                    y: { type: 'integer', description: 'Y position on screen' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    if (params.selector) {
                        const element = await electronBrowserManager.querySelector(params.selector);
                        return { success: !!element, element: element };
                    } else if (params.x !== undefined && params.y !== undefined) {
                        const element = await electronBrowserManager.getElementAtPosition(params.x, params.y);
                        return { success: true, element: element };
                    }
                    return { success: false, error: 'Provide selector or x,y coordinates' };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_press_enter'] = {
            name: 'browser_press_enter',
            description: 'Press Enter key in the Agentic Browser.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const result = await electronBrowserManager.pressEnter();
                    return result;
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['browser_search'] = {
            name: 'browser_search',
            description: 'Navigate the Agentic Browser to a Google search.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query' }
                },
                required: ['query'],
                additionalProperties: false
            },
            execute: async (params) => {
                const electronBrowserManager = require('./electron-browser-manager');
                try {
                    const url = `https://www.google.com/search?q=${encodeURIComponent(params.query)}`;
                    await electronBrowserManager.navigateViaJs(url);
                    return { success: true, message: `Navigated to search: ${params.query}` };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['file_read'] = {
            name: 'file_read',
            description: 'Read the complete contents of a file.',
            parameters: {
                type: 'object',
                properties: {
                    filepath: { type: 'string', description: 'Path to the file to read' }
                },
                required: ['filepath'],
                additionalProperties: false
            },
            execute: async (params) => {
                try {
                    const content = fs.readFileSync(path.resolve(params.filepath), 'utf-8');
                    return { success: true, content: content, size: content.length };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['file_write'] = {
            name: 'file_write',
            description: 'Create or overwrite a file with specified content.',
            parameters: {
                type: 'object',
                properties: {
                    filepath: { type: 'string', description: 'Path where the file will be created' },
                    content: { type: 'string', description: 'Content to write to the file' }
                },
                required: ['filepath', 'content'],
                additionalProperties: false
            },
            execute: async (params) => {
                try {
                    const dir = path.dirname(path.resolve(params.filepath));
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    fs.writeFileSync(path.resolve(params.filepath), params.content, 'utf-8');
                    return { success: true, message: `Written ${params.content.length} bytes to ${params.filepath}` };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['file_exists'] = {
            name: 'file_exists',
            description: 'Check if a file exists.',
            parameters: {
                type: 'object',
                properties: {
                    filepath: { type: 'string', description: 'Path to check' }
                },
                required: ['filepath'],
                additionalProperties: false
            },
            execute: async (params) => {
                const filepath = path.resolve(params.filepath);
                const exists = fs.existsSync(filepath);
                return {
                    success: true,
                    exists: exists,
                    isFile: exists ? fs.statSync(filepath).isFile() : false,
                    isDirectory: exists ? fs.statSync(filepath).isDirectory() : false
                };
            }
        };

        this.tools['file_delete'] = {
            name: 'file_delete',
            description: 'Delete a file.',
            parameters: {
                type: 'object',
                properties: {
                    filepath: { type: 'string', description: 'Path to the file to delete' }
                },
                required: ['filepath'],
                additionalProperties: false
            },
            execute: async (params) => {
                try {
                    const filepath = path.resolve(params.filepath);
                    if (!fs.existsSync(filepath)) return { success: false, error: 'File does not exist' };
                    fs.unlinkSync(filepath);
                    return { success: true, message: `Deleted ${filepath}` };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['directory_list'] = {
            name: 'directory_list',
            description: 'List files and directories in a folder.',
            parameters: {
                type: 'object',
                properties: {
                    dirpath: { type: 'string', description: 'Path to the directory (defaults to home)' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                try {
                    const dirpath = params.dirpath ? path.resolve(params.dirpath) : os.homedir();
                    const entries = fs.readdirSync(dirpath, { withFileTypes: true });
                    const files = entries.slice(0, 100).map(entry => ({
                        name: entry.name,
                        isFile: entry.isFile(),
                        isDirectory: entry.isDirectory()
                    }));
                    return { success: true, files: files };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['display_code'] = {
            name: 'display_code',
            description: 'Display code in the UI for user to see. Does not execute.',
            parameters: {
                type: 'object',
                properties: {
                    code: { type: 'string', description: 'Code to display' },
                    language: { type: 'string', description: 'Programming language' }
                },
                required: ['code'],
                additionalProperties: false
            },
            execute: async (params) => {
                return { success: true, code: params.code, language: params.language };
            }
        };

        this.tools['read_preferences'] = {
            name: 'read_preferences',
            description: 'Read user preferences from storage.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const storageManager = require('./storage-manager');
                return { success: true, preferences: storageManager.readPreferences() };
            }
        };

        this.tools['write_preferences'] = {
            name: 'write_preferences',
            description: 'Write user preferences to storage.',
            parameters: {
                type: 'object',
                properties: {
                    preferences: { type: 'object', description: 'Preferences object to save' }
                },
                required: ['preferences'],
                additionalProperties: false
            },
            execute: async (params) => {
                const storageManager = require('./storage-manager');
                storageManager.writePreferences(params.preferences);
                return { success: true, message: 'Preferences updated' };
            }
        };

        this.tools['list_applications'] = {
            name: 'list_applications',
            description: 'List all installed desktop applications from Start Menu. CRITICAL: Use this BEFORE opening any application to get the exact name to use with terminal command "start <appname>". Never guess application names - always list first.',
            parameters: {
                type: 'object',
                properties: {
                    filter: { type: 'string', description: 'Filter by keyword (e.g., "code", "terminal", "browser")' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                const startMenuPaths = [
                    path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
                    'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs'
                ];
                
                const apps = [];
                const scanDir = (dir) => {
                    if (!fs.existsSync(dir)) return;
                    try {
                        const items = fs.readdirSync(dir);
                        for (const item of items) {
                            const fullPath = path.join(dir, item);
                            const stat = fs.statSync(fullPath);
                            if (stat.isDirectory()) {
                                scanDir(fullPath);
                            } else if (item.endsWith('.lnk')) {
                                apps.push(item.replace('.lnk', ''));
                            }
                        }
                    } catch (e) {}
                };
                
                for (const p of startMenuPaths) scanDir(p);
                const allApps = [...new Set(apps)].sort();
                
                if (params.filter) {
                    const filter = params.filter.toLowerCase();
                    return { 
                        success: true, 
                        applications: allApps.filter(a => a.toLowerCase().includes(filter)),
                        hint: `Use exact name with: terminal { command: "start \\"<name>\\"" }`
                    };
                }
                
                return { 
                    success: true, 
                    applications: allApps,
                    hint: `Use list_applications with filter to narrow down, then use exact name with: terminal { command: "start \\"<name>\\"" }`
                };
            }
        };

        this.tools['read_libraries'] = {
            name: 'read_libraries',
            description: 'Read installed libraries from storage.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const storageManager = require('./storage-manager');
                return { success: true, libraries: storageManager.readLibraries() };
            }
        };

        this.tools['write_libraries'] = {
            name: 'write_libraries',
            description: 'Add a library to storage.',
            parameters: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: 'Library type (pip/npm)' },
                    name: { type: 'string', description: 'Library name' },
                    version: { type: 'string', description: 'Library version' }
                },
                required: ['type', 'name'],
                additionalProperties: false
            },
            execute: async (params) => {
                const storageManager = require('./storage-manager');
                storageManager.addLibrary(params.type, params.name, params.version);
                return { success: true, message: `Library ${params.name} added` };
            }
        };

        this.tools['read_behaviors'] = {
            name: 'read_behaviors',
            description: 'Read learned behaviors from storage.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            execute: async () => {
                const storageManager = require('./storage-manager');
                return { success: true, behaviors: storageManager.readBehaviors() };
            }
        };

        this.tools['write_behaviors'] = {
            name: 'write_behaviors',
            description: 'Save a learned behavior to storage.',
            parameters: {
                type: 'object',
                properties: {
                    behavior: { type: 'string', description: 'Behavior to learn' }
                },
                required: ['behavior'],
                additionalProperties: false
            },
            execute: async (params) => {
                const storageManager = require('./storage-manager');
                storageManager.addBehavior(params.behavior);
                return { success: true, message: 'Behavior learned and saved' };
            }
        };

        this.tools['wait'] = {
            name: 'wait',
            description: 'Wait for a specified duration.',
            parameters: {
                type: 'object',
                properties: {
                    duration: { type: 'integer', default: 1, description: 'Duration in seconds' }
                },
                required: [],
                additionalProperties: false
            },
            execute: async (params) => {
                await new Promise(r => setTimeout(r, (params.duration || 1) * 1000));
                return { success: true, message: `Waited ${params.duration || 1} seconds` };
            }
        };

        this.tools['file_append'] = {
            name: 'file_append',
            description: 'Append content to a file.',
            parameters: {
                type: 'object',
                properties: {
                    filepath: { type: 'string', description: 'Path to the file' },
                    content: { type: 'string', description: 'Content to append' }
                },
                required: ['filepath', 'content'],
                additionalProperties: false
            },
            execute: async (params) => {
                try {
                    const filepath = path.resolve(params.filepath);
                    fs.appendFileSync(filepath, params.content, 'utf-8');
                    return { success: true, message: `Appended to ${filepath}` };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        };

        this.tools['execute_task'] = {
            name: 'execute_task',
            description: 'Execute a stored workflow by name.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Workflow name to execute' }
                },
                required: ['name'],
                additionalProperties: false
            },
            execute: async (params) => {
                return { success: true, message: `Execute task ${params.name} - requires workflow integration` };
            }
        };

        this.tools['run_script_on_file'] = {
            name: 'run_script_on_file',
            description: 'Run a script on a file.',
            parameters: {
                type: 'object',
                properties: {
                    script: { type: 'string', description: 'Script code to run' },
                    file: { type: 'string', description: 'File path to process' },
                    language: { type: 'string', enum: ['python', 'javascript'], description: 'Script language' },
                    dependencies: { type: 'array', items: { type: 'string' }, description: 'Required libraries' },
                    user_confirmed: { type: 'boolean', description: 'User confirmed dependency install' }
                },
                required: ['script', 'file', 'language'],
                additionalProperties: false
            },
            execute: async (params) => {
                return { success: true, message: `Run script on ${params.file}` };
            }
        };

        this.tools['research_package'] = {
            name: 'research_package',
            description: 'Research a package/library online.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Package name to research' }
                },
                required: ['name'],
                additionalProperties: false
            },
            execute: async (params) => {
                return { success: true, message: `Researched package: ${params.name}` };
            }
        };

        console.log(`[ToolRegistry] Registered ${Object.keys(this.tools).length} tools`);
    }

    getToolSchemas() {
        const schemas = {};
        for (const [name, tool] of Object.entries(this.tools)) {
            schemas[name] = {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            };
        }
        return schemas;
    }

    getToolNames() {
        return Object.keys(this.tools);
    }

    getTool(name) {
        return this.tools[name];
    }

    hasTool(name) {
        return name in this.tools;
    }

    getInstalledApplications() {
        const startMenuPaths = [
            path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
            'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs'
        ];
        
        const apps = [];
        
        const scanDir = (dir) => {
            if (!fs.existsSync(dir)) return;
            try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        scanDir(fullPath);
                    } else if (item.endsWith('.lnk')) {
                        apps.push(item.replace('.lnk', ''));
                    }
                }
            } catch (e) {}
        };
        
        for (const p of startMenuPaths) scanDir(p);
        return [...new Set(apps)].sort();
    }
}

module.exports = new ToolRegistry();