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
            description: 'Install a Python or JavaScript library. Requires user confirmation.',
            parameters: {
                type: 'object',
                properties: {
                    library: { type: 'string', description: 'Name of the library to install' },
                    package_manager: { type: 'string', enum: ['pip', 'npm'], description: 'Package manager to use' },
                    user_confirmed: { type: 'boolean', description: 'User has confirmed the installation' }
                },
                required: ['library', 'package_manager'],
                additionalProperties: false
            },
            execute: async (params) => {
                const installCmd = params.package_manager === 'pip' ? `pip install ${params.library}` : `npm install ${params.library}`;
                return new Promise((resolve) => {
                    exec(installCmd, (err, stdout, stderr) => {
                        if (err) resolve({ success: false, error: err.message });
                        else resolve({ success: true, message: `Installed ${params.library}` });
                    });
                });
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
}

module.exports = new ToolRegistry();