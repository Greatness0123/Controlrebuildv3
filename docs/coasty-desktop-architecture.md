<h1>Coasty AI Desktop Application Architecture</h1><h2>Executive Summary</h2><p>The Coasty AI desktop application is a sophisticated computer use agent built on Electron that enables AI-driven automation of desktop applications, web browsers, and system operations. This document provides a comprehensive technical architecture overview of the desktop application, focusing on the computer use infrastructure that powers autonomous task execution.</p><h2>High-Level Architecture</h2><h3>System Overview</h3><pre><code>┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                            │
│                    (Electron Renderer Process)                    │
│  - Chat Interface                                                 │
│  - Task Visualization                                             │
│  - Approval Dialogs                                               │
│  - Rainbow Border Overlay                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ IPC Communication
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Electron Main Process                          │
│  - WebSocketBridge (Persistent Connection)                       │
│  - LocalExecutor (Command Dispatcher)                            │
│  - DesktopAutomation (Native Platform APIs)                      │
│  - BrowserAutomation (Puppeteer Integration)                     │
│  - ApprovalManager (User Confirmation)                           │
│  - DisplayManager (Multi-Display Support)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ WebSocket (ws://)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Python Backend (Docker Container)                   │
│  - DesktopAgentServer (WebSocket Server)                         │
│  - AI Model Integration (Claude via Bedrock)                     │
│  - Screenshot Processing (MSS/PyAutoGUI)                          │
│  - Browser Automation (Selenium + Stealth)                       │
│  - OCR Engine (pytesseract)                                       │
│  - Element Detection (Computer Vision)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP API
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Web Application                        │
│  - Chat API Routes (SSE Streaming)                               │
│  - Authentication (Supabase)                                      │
│  - Credit System                                                  │
│  - Model Configuration                                            │
└─────────────────────────────────────────────────────────────────┘
</code></pre><h3>Key Design Principles</h3><ol> <li><strong>Separation of Concerns</strong>: Clear boundaries between UI, automation, and AI reasoning</li> <li><strong>Platform Abstraction</strong>: Unified API across Windows, macOS, and Linux</li> <li><strong>Persistent Connections</strong>: WebSocket-based real-time communication</li> <li><strong>User Control</strong>: Approval system for sensitive operations</li> <li><strong>Visual Feedback</strong>: Rainbow border indicates active automation</li> <li><strong>Multi-Display Support</strong>: Coordinate normalization across screens</li> </ol><h2>Component Architecture</h2><h3>1. Electron Main Process (<code>electron/src/main/index.ts</code>)</h3><p>The main process serves as the orchestrator for the entire desktop application.</p><h4>Core Responsibilities</h4><pre><code class="language-typescript">// Main Process Initialization
class CoastyDesktopApp {
  private authManager: AuthManager
  private windowManager: WindowManager
  private securityManager: SecurityManager
  private permissionsManager: PermissionsManager
  private displayManager: DisplayManager
  private wsBridge: WebSocketBridge
  private approvalManager: ApprovalManager
}
</code></pre><h4>Key Features</h4><p><strong>Custom Protocol Handler</strong></p><ul> <li>Handles <code>coasty://</code> protocol for OAuth callbacks</li> <li>Enables seamless authentication flow</li> <li>Processes authorization codes from web redirects</li> </ul><p><strong>Window Management</strong></p><ul> <li>Main chat window</li> <li>Settings window</li> <li>Approval dialog overlay</li> <li>Rainbow border overlay (visual feedback)</li> </ul><p><strong>Security Management</strong></p><ul> <li>Content Security Policy enforcement</li> <li>Node.js integration restrictions</li> <li>Remote code execution prevention</li> <li>Input validation and sanitization</li> </ul><p><strong>Permissions Management</strong></p><ul> <li>macOS Accessibility permission detection</li> <li>Automatic permission request triggering</li> <li>Permission status monitoring</li> <li>User guidance for manual permission granting</li> </ul><p><strong>Display Management</strong></p><ul> <li>Multi-display coordinate mapping</li> <li>Screen dimension tracking</li> <li>Coordinate offset calculation</li> <li>Display change event handling</li> </ul><h3>2. WebSocket Bridge (<code>electron/src/main/ws-bridge.ts</code>)</h3><p>The WebSocketBridge maintains a persistent connection to the Python backend and handles all command execution.</p><h4>Connection Lifecycle</h4><pre><code class="language-typescript">class WebSocketBridge {
  private ws: WebSocket | null = null
  private state: 'disconnected' | 'connecting' | 'connected' | 'error'
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 10
  private reconnectDelay: number = 1000 // Exponential backoff
  private heartbeatInterval: NodeJS.Timeout | null = null
}
</code></pre><h4>Connection States</h4><ol> <li><strong>Disconnected</strong>: No active connection</li> <li><strong>Connecting</strong>: Attempting to establish connection</li> <li><strong>Connected</strong>: Authenticated and ready for commands</li> <li><strong>Error</strong>: Connection failed or lost</li> </ol><h4>Message Protocol</h4><p><strong>Authentication Message</strong></p><pre><code class="language-json">{
  "type": "auth",
  "token": "user_auth_token",
  "system_info": {
    "platform": "darwin",
    "os_version": "14.0",
    "screen_width": 1920,
    "screen_height": 1080,
    "displays": [
      {
        "id": 0,
        "x": 0,
        "y": 0,
        "width": 1920,
        "height": 1080,
        "primary": true
      }
    ]
  }
}
</code></pre><p><strong>Command Message</strong></p><pre><code class="language-json">{
  "type": "command",
  "command": "click",
  "parameters": {
    "x": 500,
    "y": 300
  },
  "task_id": "task_123"
}
</code></pre><p><strong>Result Message</strong></p><pre><code class="language-json">{
  "type": "result",
  "success": true,
  "message": "Clicked at (500, 300)",
  "task_id": "task_123"
}
</code></pre><p><strong>Approval Request Message</strong></p><pre><code class="language-json">{
  "type": "approval_request",
  "command": "file_delete",
  "parameters": {
    "path": "/Users/test/important.txt"
  },
  "task_id": "task_456",
  "requires_approval": true
}
</code></pre><h4>Heartbeat Mechanism</h4><ul> <li>Sends ping every 30 seconds</li> <li>Detects stale connections</li> <li>Triggers automatic reconnection</li> <li>Maintains connection health</li> </ul><h4>Reconnection Logic</h4><pre><code class="language-typescript">private async reconnect(): Promise&lt;void&gt; {
  if (this.reconnectAttempts &gt;= this.maxReconnectAttempts) {
    this.state = 'error'
    return
  }
  
  this.state = 'connecting'
  const delay = Math.min(
    this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
    15000 // Max 15 seconds
  )
  
  await this.sleep(delay)
  this.reconnectAttempts++
  
  // Refresh token and reconnect
  await this.connect()
}
</code></pre><h3>3. Local Executor (<code>electron/src/main/local-executor.ts</code>)</h3><p>The LocalExecutor dispatches commands to appropriate automation modules.</p><h4>Command Categories</h4><p><strong>Desktop Automation Commands</strong></p><ul> <li><code>screenshot</code>: Capture screen</li> <li><code>click</code>, <code>click_with_modifiers</code>, <code>double_click</code>: Mouse actions</li> <li><code>type</code>, <code>key_press</code>, <code>key_combo</code>: Keyboard actions</li> <li><code>scroll</code>, <code>drag</code>: Scroll and drag operations</li> </ul><p><strong>Terminal Commands</strong></p><ul> <li><code>terminal_connect</code>: Initialize terminal session</li> <li><code>terminal_execute</code>: Run shell commands</li> <li><code>terminal_read</code>: Read terminal output</li> <li><code>terminal_type</code>: Type into terminal</li> <li><code>terminal_clear</code>: Clear terminal</li> <li><code>terminal_close</code>: Close terminal session</li> </ul><p><strong>File Operations</strong></p><ul> <li><code>file_read</code>, <code>file_write</code>, <code>file_edit</code>, <code>file_append</code>: File manipulation</li> <li><code>file_delete</code>, <code>file_exists</code>: File management</li> <li><code>directory_list</code>, <code>directory_delete</code>: Directory operations</li> <li><code>file_upload</code>, <code>file_download</code>, <code>file_list_downloads</code>: File transfer</li> </ul><p><strong>Browser Automation</strong></p><ul> <li><code>browser_open</code>, <code>browser_navigate</code>: Browser control</li> <li><code>browser_click</code>, <code>browser_type</code>: Element interaction</li> <li><code>browser_get_dom</code>, <code>browser_get_clickables</code>: DOM access</li> <li><code>browser_state</code>, <code>browser_info</code>: Browser status</li> <li><code>browser_scroll</code>, <code>browser_close</code>, <code>browser_execute</code>: Advanced operations</li> <li><code>browser_screenshot</code>: Browser screenshots</li> <li><code>browser_list_tabs</code>, <code>browser_open_tab</code>, <code>browser_close_tab</code>, <code>browser_switch_tab</code>: Tab management</li> </ul><p><strong>Window Management</strong></p><ul> <li><code>list_windows</code>: List all windows</li> <li><code>switch_to_window</code>: Focus window</li> <li><code>arrange_windows</code>: Organize windows</li> <li><code>move_window</code>, <code>close_window</code>, <code>minimize_window</code>, <code>maximize_window</code>, <code>restore_window</code>: Window control</li> </ul><h4>Command Execution Flow</h4><pre><code class="language-typescript">async executeCommand(command: string, parameters: any): Promise&lt;any&gt; {
  // 1. Normalize parameters
  const normalizedParams = this.normalizeParameters(command, parameters)
  
  // 2. Apply display offset for multi-display
  const adjustedParams = this.applyDisplayOffset(normalizedParams)
  
  // 3. Hide overlay for desktop actions
  if (this.isDesktopAction(command)) {
    await this.hideOverlay()
  }
  
  // 4. Check permissions
  const permissionCheck = await this.checkPermissions(command)
  if (!permissionCheck.granted) {
    return permissionCheck
  }
  
  // 5. Execute command
  const result = await this.dispatchCommand(command, adjustedParams)
  
  // 6. Show overlay after completion
  if (this.isDesktopAction(command)) {
    await this.showOverlay()
  }
  
  return result
}
</code></pre><h3>4. Desktop Automation (<code>electron/src/main/desktop-automation.ts</code>)</h3><p>Provides cross-platform desktop automation using native APIs.</p><h4>Platform-Specific Implementations</h4><p><strong>Windows (PowerShell + Win32 API)</strong></p><pre><code class="language-typescript">// Mouse Click via Win32 API
await runPowershell(`
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
  Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class MouseOps {
    [DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
    public const int MOUSEEVENTF_LEFTDOWN = 0x02;
    public const int MOUSEEVENTF_LEFTUP = 0x04;
  }
"@
  [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
  [MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
`)
</code></pre><p><strong>macOS (Swift + CoreGraphics)</strong></p><pre><code class="language-typescript">// Mouse Click via CoreGraphics
await runSwift(`
  import Cocoa
  let pt = CGPoint(x: ${x}, y: ${y})
  CGEvent(mouseEventSource: nil, mouseType: .leftMouseDown, 
          mouseCursorPosition: pt, mouseButton: .left)?.post(tap: .cghidEventTap)
  usleep(50000)
  CGEvent(mouseEventSource: nil, mouseType: .leftMouseUp, 
          mouseCursorPosition: pt, mouseButton: .left)?.post(tap: .cghidEventTap)
`)
</code></pre><p><strong>Linux (xdotool)</strong></p><pre><code class="language-typescript">// Mouse Click via xdotool
await runBash(`xdotool mousemove ${x} ${y} click 1`)
</code></pre><h4>Security Features</h4><p><strong>Input Validation</strong></p><pre><code class="language-typescript">function validateInt(v: any, name: string): number {
  const n = Number(v)
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid ${name}: expected a number`)
  }
  return Math.round(n)
}
</code></pre><p><strong>Shell Injection Prevention</strong></p><ul> <li>Uses <code>execFile</code> instead of <code>exec</code> (no shell interpretation)</li> <li>Validates all numeric inputs</li> <li>Escapes strings for AppleScript</li> <li>Uses safe key mapping for xdotool</li> <li>Prevents command injection via coordinate parameters</li> </ul><p><strong>macOS Accessibility Permission</strong></p><pre><code class="language-typescript">function requireAccessibility(): { success: false; error: string; permissionDenied: true } | null {
  if (process.platform !== 'darwin') return null
  if (isAccessibilityGranted()) return null
  
  // Trigger system prompt once per session
  if (!_hasPromptedAccessibility) {
    _hasPromptedAccessibility = true
    requestAccessibility()
  }
  
  return {
    success: false,
    error: 'macOS Accessibility permission is required...',
    permissionDenied: true,
    permissionType: 'accessibility'
  }
}
</code></pre><h4>Key Mapping</h4><p><strong>Windows Virtual Key Codes</strong></p><pre><code class="language-typescript">const VK_CODES: Record&lt;string, number&gt; = {
  win: 0x5B, ctrl: 0xA2, alt: 0xA4, shift: 0xA0,
  enter: 0x0D, tab: 0x09, escape: 0x1B,
  backspace: 0x08, delete: 0x2E, space: 0x20,
  // ... full key mapping
}
</code></pre><p><strong>macOS Virtual Key Codes</strong></p><pre><code class="language-typescript">const KEY_MAP_MACOS: Record&lt;string, number&gt; = {
  enter: 36, tab: 48, space: 49,
  backspace: 51, escape: 53,
  up: 126, down: 125, left: 123, right: 124,
  // ... full key mapping
}
</code></pre><p><strong>Platform Normalization</strong></p><pre><code class="language-typescript">const MAC_KEY_NORMALIZATION: Record&lt;string, string&gt; = {
  // Ctrl → Cmd (Ctrl+C on Windows = Cmd+C on macOS)
  ctrl: 'cmd', control: 'cmd',
  // Alt → Option
  alt: 'option', lalt: 'option', ralt: 'option',
  // Windows/Super → Command
  win: 'cmd', super: 'cmd', meta: 'cmd',
  // ... full normalization map
}
</code></pre><h3>5. Browser Automation (<code>electron/src/main/browser-automation.ts</code>)</h3><p>Provides browser automation using Puppeteer with Chrome/Edge/Chromium.</p><h4>Browser Discovery</h4><pre><code class="language-typescript">function findChromePath(): string | null {
  const candidates: string[] = []
  
  if (process.platform === 'win32') {
    candidates.push(
      path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      // ... more paths
    )
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      // ... more paths
    )
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      // ... more paths
    )
  }
  
  // Check each candidate
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  
  return null
}
</code></pre><h4>Browser Launch Configuration</h4><pre><code class="language-typescript">browser = await pptr.launch({
  executablePath: chromePath,
  headless: false,
  defaultViewport: null,
  userDataDir: dataDir, // Isolated profile
  args: [
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],
})
</code></pre><h4>Key Features</h4><p><strong>Isolated User Data Directory</strong></p><ul> <li>Prevents conflicts with existing Chrome sessions</li> <li>Ensures clean browser state</li> <li>Automatic cleanup on close</li> </ul><p><strong>Tab Management</strong></p><ul> <li><code>listBrowserTabs</code>: List all open tabs</li> <li><code>openBrowserTab</code>: Open new tab</li> <li><code>closeBrowserTab</code>: Close specific tab</li> <li><code>switchBrowserTab</code>: Switch to tab</li> </ul><p><strong>Element Interaction</strong></p><ul> <li><code>clickBrowser</code>: Click by selector, coordinates, or text</li> <li><code>typeBrowser</code>: Type into element</li> <li><code>getBrowserDom</code>: Get DOM structure</li> <li><code>getBrowserClickables</code>: List clickable elements</li> </ul><p><strong>Advanced Operations</strong></p><ul> <li><code>executeBrowser</code>: Execute JavaScript</li> <li><code>waitBrowser</code>: Wait for element or text</li> <li><code>scrollBrowser</code>: Scroll page</li> <li><code>screenshotBrowser</code>: Capture browser screenshot</li> </ul><h4>Security Considerations</h4><p><strong>Script Injection Prevention</strong></p><pre><code class="language-typescript">// Pass script as serialized argument, not string concatenation
const result = await page.evaluate(async (code: string) =&gt; {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  return await new AsyncFunction(code)()
}, script)
</code></pre><p><strong>IIFE Breakout Prevention</strong></p><ul> <li>Uses AsyncFunction constructor</li> <li>Serializes code as argument</li> <li>Prevents scope escape</li> </ul><h3>6. Python Backend (<code>docker/ai-desktop/ai_agent_server.py</code>)</h3><p>The Python backend serves as the AI reasoning engine and automation orchestrator.</p><h4>Core Components</h4><p><strong>DesktopAgentServer Class</strong></p><pre><code class="language-python">class DesktopAgentServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8080):
        self.host = host
        self.port = port
        self.clients = set()
        self.authenticated_clients = set()
        self.session_id = None
        self.user_id = None
        self.driver = None  # Selenium WebDriver
        self.terminal_process = None
        self.stealth_browser = None
        self.vnc_password = os.environ.get('VNC_PASSWORD', '')
</code></pre><h4>WebSocket Connection Handling</h4><p><strong>Persistent Connection Management</strong></p><pre><code class="language-python">async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
    client_id = str(uuid.uuid4())[:8]
    
    # Disable automatic ping/pong to prevent timeouts during long operations
    websocket.ping_interval = None
    websocket.ping_timeout = None
    websocket.max_size = 100 * 1024 * 1024  # 100MB for large screenshots
    websocket.close_timeout = 120  # 2 minutes
    
    try:
        async for message in websocket:
            data = json.loads(message)
            result = await self.process_message(data)
            await websocket.send(json.dumps(result))
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"[{client_id}] Connection closed")
</code></pre><h4>Screenshot Processing</h4><p><strong>Multi-Backend Screenshot Capture</strong></p><pre><code class="language-python">def take_screenshot(self, raw: bool = False) -&gt; Any:
    if MSS_AVAILABLE:
        with mss.mss() as sct:
            monitor = sct.monitors[1]  # Primary monitor
            screenshot = sct.grab(monitor)
            img = Image.frombytes('RGB', screenshot.size, screenshot.rgb)
    elif PYAUTOGUI_AVAILABLE:
        screenshot = pyautogui.screenshot()
        img = Image.fromarray(np.array(screenshot))
    else:
        raise Exception("No screenshot backend available")
    
    if raw:
        return img
    return self.image_to_base64(img)
</code></pre><p><strong>Display Recovery</strong></p><pre><code class="language-python">def recover_display(self) -&gt; bool:
    """Attempt to recover display connection in container environment"""
    try:
        # Try to restart Xvfb if needed
        subprocess.run(['pkill', 'Xvfb'], timeout=5)
        time.sleep(1)
        
        # Start Xvfb with proper configuration
        subprocess.run([
            'Xvfb', ':99', '-screen', '0', '1920x1080x24',
            '-ac', '+extension', 'GLX', '+render', '-noreset'
        ], timeout=10)
        
        # Set DISPLAY environment variable
        os.environ['DISPLAY'] = ':99'
        time.sleep(2)
        
        return True
    except Exception as e:
        logger.error(f"Display recovery failed: {e}")
        return False
</code></pre><h4>Element Detection</h4><p><strong>Text Detection with OCR</strong></p><pre><code class="language-python">def detect_text_regions(self, screenshot: Image.Image, parameters: dict = None) -&gt; list:
    """Detect text regions using multi-scale OCR"""
    if not OCR_AVAILABLE:
        return []
    
    # Preprocess for better OCR
    processed = self.preprocess_for_ocr(screenshot)
    
    # Detect text at multiple scales
    text_elements = []
    for scale in [1.0, 1.5, 2.0]:
        scaled = processed.resize((int(processed.width * scale), 
                                   int(processed.height * scale)))
        text = pytesseract.image_to_data(scaled, output_type=pytesseract.Output.DICT)
        
        # Extract text regions
        for i in range(len(text['text'])):
            if text['text'][i].strip():
                text_elements.append({
                    'text': text['text'][i],
                    'bbox': [text['left'][i] // scale, text['top'][i] // scale,
                            (text['left'][i] + text['width'][i]) // scale,
                            (text['top'][i] + text['height'][i]) // scale],
                    'confidence': text['conf'][i]
                })
    
    return self.merge_overlapping_elements(text_elements)
</code></pre><p><strong>UI Element Classification</strong></p><pre><code class="language-python">def classify_ui_element(self, width: int, height: int, aspect_ratio: float) -&gt; str:
    """Classify UI element based on dimensions"""
    if aspect_ratio &gt; 3:
        return 'button'
    elif aspect_ratio &lt; 0.3:
        return 'icon'
    elif width &gt; 200 and height &gt; 100:
        return 'panel'
    elif width &gt; 100 and height &gt; 50:
        return 'card'
    else:
        return 'element'
</code></pre><p><strong>Clickable Area Detection</strong></p><pre><code class="language-python">def detect_clickable_areas(self, image: np.ndarray) -&gt; list:
    """Detect clickable areas using computer vision"""
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    
    # Detect edges
    edges = cv2.Canny(gray, 50, 150)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    clickables = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        
        # Filter by size
        if w &gt; 20 and h &gt; 20 and w &lt; 500 and h &lt; 200:
            clickables.append({
                'bbox': [x, y, x + w, y + h],
                'type': self.classify_ui_element(w, h, w / h)
            })
    
    return clickables
</code></pre><h4>Browser Automation (Selenium)</h4><p><strong>Stealth Browser Integration</strong></p><pre><code class="language-python">async def browser_open_and_connect(self) -&gt; Dict[str, Any]:
    """Open browser with anti-detection measures"""
    if STEALTH_AVAILABLE:
        self.stealth_browser = StealthBrowser()
        self.driver = self.stealth_browser.get_driver()
    else:
        options = ChromeOptions()
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(options=options)
    
    return {'success': True, 'message': 'Browser opened'}
</code></pre><p><strong>DOM Element Extraction</strong></p><pre><code class="language-python">async def get_browser_dom_elements(self) -&gt; Dict[str, Any]:
    """Extract DOM elements with attributes"""
    elements = self.driver.find_elements(By.XPATH, "//*")
    
    dom_data = []
    for elem in elements[:100]:  # Limit to 100 elements
        try:
            dom_data.append({
                'tag': elem.tag_name,
                'id': elem.get_attribute('id'),
                'class': elem.get_attribute('class'),
                'text': elem.text[:100],
                'href': elem.get_attribute('href'),
                'bbox': self.get_element_bbox(elem)
            })
        except:
            continue
    
    return {'success': True, 'elements': dom_data}
</code></pre><p><strong>Browser State Tracking</strong></p><pre><code class="language-python">async def get_browser_state(self) -&gt; Dict[str, Any]:
    """Get comprehensive browser state"""
    state = {
        'url': self.driver.current_url,
        'title': self.driver.title,
        'window_size': self.driver.get_window_size(),
        'window_position': self.driver.get_window_position(),
        'cookies': self.driver.get_cookies(),
        'tabs': await self.browser_list_tabs()
    }
    
    # Detect state changes
    if hasattr(self, 'last_state'):
        changes = self._detect_state_changes(self.last_state, state)
        state['changes'] = changes
    
    self.last_state = state
    return {'success': True, 'state': state}
</code></pre><h4>Terminal Management</h4><p><strong>Persistent Terminal Session</strong></p><pre><code class="language-python">async def terminal_connect(self) -&gt; Dict[str, Any]:
    """Initialize persistent terminal session"""
    if self.terminal_process:
        return {'success': True, 'message': 'Terminal already connected'}
    
    # Start bash with unbuffered output
    self.terminal_process = subprocess.Popen(
        ['bash', '--norc', '--noprofile'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=0
    )
    
    # Set non-blocking
    os.set_blocking(self.terminal_process.stdout.fileno(), False)
    os.set_blocking(self.terminal_process.stderr.fileno(), False)
    
    return {'success': True, 'message': 'Terminal connected'}
</code></pre><p><strong>Command Execution</strong></p><pre><code class="language-python">async def terminal_execute(self, command: str, wait_for_output: bool = True, 
                          timeout: int = 5) -&gt; Dict[str, Any]:
    """Execute command in terminal"""
    if not self.terminal_process:
        await self.terminal_connect()
    
    # Send command
    self.terminal_process.stdin.write(command + '\n')
    self.terminal_process.stdin.flush()
    
    if not wait_for_output:
        return {'success': True, 'message': 'Command sent'}
    
    # Read output with timeout
    output = []
    start_time = time.time()
    
    while time.time() - start_time &lt; timeout:
        try:
            line = self.terminal_process.stdout.readline()
            if line:
                output.append(line)
            else:
                break
        except:
            break
    
    return {
        'success': True,
        'output': ''.join(output),
        'message': 'Command executed'
    }
</code></pre><h4>File Operations</h4><p><strong>File Reading</strong></p><pre><code class="language-python">async def file_read(self, params: Dict[str, Any]) -&gt; Dict[str, Any]:
    """Read file contents"""
    path = params.get('path')
    encoding = params.get('encoding', 'utf-8')
    
    try:
        with open(path, 'r', encoding=encoding) as f:
            content = f.read()
        
        return {
            'success': True,
            'content': content,
            'size': len(content),
            'encoding': encoding
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}
</code></pre><p><strong>File Writing</strong></p><pre><code class="language-python">async def file_write(self, params: Dict[str, Any]) -&gt; Dict[str, Any]:
    """Write content to file"""
    path = params.get('path')
    content = params.get('content', '')
    encoding = params.get('encoding', 'utf-8')
    
    try:
        with open(path, 'w', encoding=encoding) as f:
            f.write(content)
        
        return {
            'success': True,
            'message': f'Written {len(content)} bytes to {path}'
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}
</code></pre><h3>7. Approval Manager</h3><p>The ApprovalManager handles user confirmation for sensitive operations.</p><h4>Approval Flow</h4><pre><code class="language-typescript">class ApprovalManager {
  private pendingApprovals: Map&lt;string, ApprovalRequest&gt; = new Map()
  
  async requestApproval(command: string, parameters: any): Promise&lt;boolean&gt; {
    const requestId = generateRequestId()
    
    // Create approval request
    const request: ApprovalRequest = {
      id: requestId,
      command,
      parameters,
      timestamp: Date.now(),
      status: 'pending'
    }
    
    this.pendingApprovals.set(requestId, request)
    
    // Show approval dialog
    this.showApprovalDialog(request)
    
    // Wait for user response (with timeout)
    const result = await this.waitForApproval(requestId, 30000)
    
    return result.approved
  }
  
  private showApprovalDialog(request: ApprovalRequest): void {
    // Create and show approval dialog window
    const dialog = new BrowserWindow({
      width: 500,
      height: 300,
      modal: true,
      parent: this.mainWindow,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })
    
    dialog.loadFile('approval-dialog.html', { request })
  }
}
</code></pre><h4>Commands Requiring Approval</h4><ul> <li><code>file_delete</code>: Delete files</li> <li><code>file_write</code>: Write to system files</li> <li><code>terminal_execute</code>: Execute shell commands</li> <li><code>browser_navigate</code>: Navigate to external URLs</li> <li><code>install_library</code>: Install dependencies</li> </ul><h3>8. Display Manager</h3><p>Handles multi-display coordinate mapping and normalization.</p><h4>Display Detection</h4><pre><code class="language-typescript">class DisplayManager {
  private displays: DisplayInfo[] = []
  private primaryDisplay: DisplayInfo | null = null
  
  detectDisplays(): void {
    const screens = screen.getAllDisplays()
    
    this.displays = screens.map((display, index) =&gt; ({
      id: index,
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      primary: display.primary
    }))
    
    this.primaryDisplay = this.displays.find(d =&gt; d.primary) || this.displays[0]
  }
}
</code></pre><h4>Coordinate Normalization</h4><pre><code class="language-typescript">normalizeCoordinates(x: number, y: number, targetDisplay?: number): { x: number, y: number } {
  // Find which display contains the coordinates
  const display = targetDisplay !== undefined 
    ? this.displays[targetDisplay]
    : this.findDisplayForCoordinates(x, y)
  
  if (!display) {
    throw new Error('Coordinates outside any display')
  }
  
  // Convert to display-relative coordinates
  const relativeX = x - display.x
  const relativeY = y - display.y
  
  return { x: relativeX, y: relativeY }
}

applyDisplayOffset(x: number, y: number): { x: number, y: number } {
  // Convert from display-relative to absolute coordinates
  const display = this.primaryDisplay
  return {
    x: x + display.x,
    y: y + display.y
  }
}
</code></pre><h2>Data Flow</h2><h3>Computer Use Task Execution Flow</h3><pre><code>1. User Request
   ↓
2. Chat Interface (Renderer)
   ↓
3. IPC to Main Process
   ↓
4. WebSocketBridge.send()
   ↓
5. Python Backend (WebSocket)
   ↓
6. AI Model (Claude via Bedrock)
   ↓
7. Task Planning &amp; Action Generation
   ↓
8. Screenshot Capture (MSS/PyAutoGUI)
   ↓
9. Vision Analysis (OCR + Element Detection)
   ↓
10. Coordinate Calculation
    ↓
11. WebSocketBridge.receive()
    ↓
12. LocalExecutor.executeCommand()
    ↓
13. DesktopAutomation / BrowserAutomation
    ↓
14. Native API Execution (PowerShell/Swift/xdotool/Puppeteer)
    ↓
15. Result Return
    ↓
16. WebSocketBridge.send()
    ↓
17. Python Backend
    ↓
18. AI Model Analysis
    ↓
19. Next Action or Task Complete
    ↓
20. Update Chat Interface
</code></pre><h3>Screenshot Processing Flow</h3><pre><code>1. AI Model Requests Screenshot
   ↓
2. Python Backend: take_screenshot()
   ↓
3. MSS / PyAutoGUI Capture
   ↓
4. Image Processing (Resize, Compress)
   ↓
5. Base64 Encoding
   ↓
6. WebSocket Transmission
   ↓
7. Electron Main Process
   ↓
8. IPC to Renderer
   ↓
9. Display in Chat Interface
   ↓
10. AI Model Analysis
    ↓
11. Element Detection (OCR + CV)
    ↓
12. Coordinate Generation
    ↓
13. Action Planning
</code></pre><h2>Security Architecture</h2><h3>1. Authentication</h3><p><strong>Token-Based Authentication</strong></p><pre><code class="language-typescript">// WebSocket authentication
async authenticateClient(data: Dict[str, Any], websocket: WebSocketServerProtocol) -&gt; Dict[str, Any]:
    token = data.get('token')
    
    # Verify token with Supabase
    user = await supabase.auth.get_user(token)
    
    if not user:
        return {'success': False, 'error': 'Invalid token'}
    
    self.user_id = user.user.id
    self.authenticated_clients.add(websocket)
    
    return {'success': True, 'user_id': user.user.id}
</code></pre><h3>2. Input Validation</h3><p><strong>Parameter Sanitization</strong></p><pre><code class="language-typescript">function sanitizeParameters(command: string, params: any): any {
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Remove dangerous characters
      sanitized[key] = value
        .replace(/[;&amp;|`$()]/g, '')
        .substring(0, 1000) // Limit length
    } else if (typeof value === 'number') {
      // Validate numeric ranges
      sanitized[key] = Math.max(0, Math.min(value, 10000))
    }
  }
  
  return sanitized
}
</code></pre><h3>3. Permission Management</h3><p><strong>macOS Accessibility</strong></p><ul> <li>Automatic permission detection</li> <li>System prompt triggering</li> <li>Permission status monitoring</li> <li>User guidance for manual granting</li> </ul><p><strong>File System Access</strong></p><ul> <li>Path validation</li> <li>Sandbox restrictions</li> <li>User approval for sensitive paths</li> </ul><h3>4. Code Execution Safety</h3><p><strong>Browser Script Execution</strong></p><pre><code class="language-typescript">// Prevent IIFE breakout
const result = await page.evaluate(async (code: string) =&gt; {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  return await new AsyncFunction(code)()
}, script)
</code></pre><p><strong>Terminal Command Execution</strong></p><ul> <li>Command whitelist</li> <li>Timeout enforcement</li> <li>Output size limits</li> <li>Dangerous command detection</li> </ul><h2>Performance Optimizations</h2><h3>1. Screenshot Optimization</h3><p><strong>Compression</strong></p><pre><code class="language-python">def compress_screenshot(image: Image.Image, quality: int = 85) -&gt; bytes:
    """Compress screenshot for faster transmission"""
    buffer = io.BytesIO()
    image.save(buffer, format='JPEG', quality=quality, optimize=True)
    return buffer.getvalue()
</code></pre><p><strong>Selective Capture</strong></p><pre><code class="language-python">def capture_region(bbox: List[int]) -&gt; Image.Image:
    """Capture only specific region"""
    with mss.mss() as sct:
        monitor = {
            'top': bbox[1],
            'left': bbox[0],
            'width': bbox[2] - bbox[0],
            'height': bbox[3] - bbox[1]
        }
        screenshot = sct.grab(monitor)
        return Image.frombytes('RGB', screenshot.size, screenshot.rgb)
</code></pre><h3>2. Connection Pooling</h3><p><strong>WebSocket Reuse</strong></p><ul> <li>Persistent connections</li> <li>Connection pooling</li> <li>Automatic reconnection</li> <li>Heartbeat monitoring</li> </ul><h3>3. Caching</h3><p><strong>Browser State Cache</strong></p><pre><code class="language-python">class BrowserStateCache:
    def __init__(self):
        self.cache = {}
        self.ttl = 5  # 5 seconds
    
    def get(self, key: str) -&gt; Optional[Dict]:
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry['timestamp'] &lt; self.ttl:
                return entry['data']
        return None
    
    def set(self, key: str, data: Dict):
        self.cache[key] = {
            'data': data,
            'timestamp': time.time()
        }
</code></pre><h2>Error Handling</h2><h3>1. Connection Errors</h3><pre><code class="language-typescript">private handleConnectionError(error: Error): void {
  logger.error(`WebSocket connection error: ${error.message}`)
  
  // Update state
  this.state = 'error'
  
  // Trigger reconnection
  this.reconnect()
  
  // Notify user
  this.notifyUser('Connection lost. Reconnecting...')
}
</code></pre><h3>2. Command Execution Errors</h3><pre><code class="language-typescript">async executeCommand(command: string, parameters: any): Promise&lt;any&gt; {
  try {
    // Validate parameters
    this.validateParameters(command, parameters)
    
    // Execute command
    const result = await this.dispatchCommand(command, parameters)
    
    return result
  } catch (error) {
    logger.error(`Command execution failed: ${error.message}`)
    
    return {
      success: false,
      error: error.message,
      command: command,
      parameters: parameters
    }
  }
}
</code></pre><h3>3. Display Recovery</h3><pre><code class="language-python">def recover_display(self) -&gt; bool:
    """Attempt to recover display connection"""
    try:
        # Restart Xvfb
        subprocess.run(['pkill', 'Xvfb'], timeout=5)
        time.sleep(1)
        
        # Start Xvfb with proper configuration
        subprocess.run([
            'Xvfb', ':99', '-screen', '0', '1920x1080x24',
            '-ac', '+extension', 'GLX', '+render', '-noreset'
        ], timeout=10)
        
        os.environ['DISPLAY'] = ':99'
        time.sleep(2)
        
        return True
    except Exception as e:
        logger.error(f"Display recovery failed: {e}")
        return False
</code></pre><h2>Monitoring and Logging</h2><h3>1. Performance Metrics</h3><pre><code class="language-typescript">class PerformanceMonitor {
  private metrics: Map&lt;string, number[]&gt; = new Map()
  
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 100 values
    if (values.length &gt; 100) {
      values.shift()
    }
  }
  
  getAverage(name: string): number {
    const values = this.metrics.get(name) || []
    if (values.length === 0) return 0
    
    return values.reduce((a, b) =&gt; a + b, 0) / values.length
  }
}
</code></pre><h3>2. Logging</h3><pre><code class="language-python">import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Log command execution
logger.info(f"Executing command: {command}")
logger.debug(f"Parameters: {parameters}")

# Log errors
logger.error(f"Command failed: {error}", exc_info=True)
</code></pre><h2>Conclusion</h2><p>The Coasty AI desktop application architecture demonstrates a sophisticated approach to computer use automation, combining:</p><ol> <li><strong>Cross-Platform Native Integration</strong>: Seamless automation across Windows, macOS, and Linux</li> <li><strong>Robust Communication</strong>: Persistent WebSocket connections with automatic reconnection</li> <li><strong>Advanced Computer Vision</strong>: OCR and element detection for intelligent UI understanding</li> <li><strong>User Control</strong>: Approval system for sensitive operations</li> <li><strong>Security First</strong>: Input validation, permission management, and code execution safety</li> <li><strong>Performance Optimized</strong>: Screenshot compression, connection pooling, and caching</li> <li><strong>Error Resilient</strong>: Comprehensive error handling and recovery mechanisms</li> </ol><p>This architecture enables reliable, efficient, and secure AI-driven computer use automation while maintaining user control and system stability.</p>