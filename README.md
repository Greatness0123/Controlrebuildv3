<h1>Control by Control AI</h1><div align="center"> <p><strong>A Universal AI Agent for Desktop Automation</strong></p> <p><em>Turn natural language into computer actions</em></p> <p><a href="#platform">Platform</a> • <a href="#features">Features</a> • <a href="#architecture">Architecture</a> • <a href="#installation">Installation</a> • <a href="#usage">Usage</a></p> </div><hr><h2>Overview</h2><p>Control is a revolutionary AI-powered desktop automation platform that enables users to control their entire computer through natural language voice or text commands. Unlike traditional automation tools that require scripting or recording, Control uses computer vision and advanced AI reasoning to "see" and "act" on any desktop application—eliminating the need for application-specific APIs or plugins.</p><h3>What Control Does</h3><p>Control operates as a universal driver for your desktop, translating human intent into precise mouse movements, keyboard inputs, and application workflows. A user can simply say or type commands like:</p><ul> <li><em>"Make this 3D cube look like brushed aluminum and render it"</em> (in Blender)</li> <li><em>"Export this video optimized for TikTok"</em> (in Adobe Premiere)</li> <li><em>"Organize all my downloads into folders by file type"</em></li> <li><em>"Find all emails from clients with urgent keywords and flag them"</em></li> </ul><h3>The Problem Control Solves</h3><p>Modern software has become incredibly powerful but also incredibly complex. Users face the <strong>"Software Mastery Barrier"</strong>—the gap between what software can do and what users can accomplish. This affects:</p><ul> <li><strong>30M+ professional creatives</strong> struggling with complex interfaces</li> <li><strong>1B+ knowledge workers</strong> who could benefit from automation but lack programming skills</li> <li><strong>Countless individuals</strong> whose creativity is "killed" by fighting interfaces instead of expressing ideas</li> </ul><p>Control removes this barrier by acting as a "Natural Language Translator" for any GUI, turning complete beginners into power users instantly.</p><hr><h2>Platform</h2><p>Control consists of two integrated components:</p><h3>1. Desktop Application (Electron)</h3><p>The primary interface for local computer automation featuring:</p><ul> <li><strong>Voice Control</strong>: Wake word detection ("Hey Control") with Picovoice Porcupine</li> <li><strong>Visual AI</strong>: Screenshot-based screen understanding with Google Gemini</li> <li><strong>Automation Engine</strong>: Mouse/keyboard control via @computer-use/nut-js</li> <li><strong>Multi-Provider AI</strong>: Support for Gemini, Claude, OpenAI, DeepSeek, Ollama, and more</li> <li><strong>Cross-Platform</strong>: macOS, Windows, and Linux support</li> </ul><h3>2. Web Platform (Next.js + FastAPI)</h3><p>Cloud infrastructure for virtual machine management:</p><ul> <li><strong>VM Provisioning</strong>: Create and manage virtual machines with AI agents</li> <li><strong>Remote Desktop</strong>: Browser-based VNC/noVNC streaming</li> <li><strong>Session Management</strong>: Track and control automation sessions</li> <li><strong>Team Features</strong>: Share workflows and VM instances across teams</li> </ul><hr><h2>Features</h2><h3>Core Capabilities</h3><h4>Visual AI and Screen Understanding</h4><ul> <li>Real-time screenshot analysis with cursor position marking</li> <li>UI element detection (buttons, sliders, menus, text fields)</li> <li>Normalized coordinate system (1000x1000) for cross-resolution compatibility</li> <li>Multi-monitor support</li> <li>Dynamic interface adaptation</li> </ul><h4>Mouse and Keyboard Automation</h4><ul> <li><strong>Mouse Actions</strong>: click, double_click, right_click, mouse_move, drag, scroll</li> <li><strong>Keyboard Actions</strong>: type with configurable speed, key_press for shortcuts</li> <li><strong>Terminal Execution</strong>: Run shell commands with output capture</li> <li><strong>Clipboard Operations</strong>: Read and write system clipboard</li> <li><strong>Anti-Detection</strong>: Human-like movement curves for automation-sensitive applications</li> </ul><h4>Voice Control System</h4><ul> <li><strong>Wake Word</strong>: "Hey Control" activation using Picovoice Porcupine</li> <li><strong>Speech-to-Text</strong>: Local transcription via Vosk server</li> <li><strong>Text-to-Speech</strong>: Edge TTS with multiple voice options</li> <li><strong>Offline Fallback</strong>: Automatic switching when network unavailable</li> <li><strong>Push-to-Talk</strong>: Alternative keyboard activation</li> </ul><h4>Multi-Provider AI Integration</h4><table class="e-rte-table"> <thead> <tr> <th>Provider</th> <th>Use Case</th> </tr> </thead> <tbody><tr> <td>Google Gemini</td> <td>Primary visual understanding</td> </tr> <tr> <td>Anthropic Claude</td> <td>Complex reasoning tasks</td> </tr> <tr> <td>OpenAI GPT-4</td> <td>Versatile instruction following</td> </tr> <tr> <td>DeepSeek</td> <td>Cost-effective alternative</td> </tr> <tr> <td>Ollama</td> <td>Local model support</td> </tr> <tr> <td>Groq</td> <td>High-speed inference</td> </tr> </tbody></table><h4>Browser Automation</h4><ul> <li>Browser navigation and management</li> <li>JavaScript execution</li> <li>Web scraping with intelligent parsing</li> <li>Form interaction and cross-tab coordination</li> <li>Session persistence</li> </ul><h4>Workflow Automation</h4><ul> <li>Keyword triggers for voice-activated sequences</li> <li>Time-based scheduling</li> <li>Import/export functionality</li> <li>Action Libraries for sharing</li> <li>Conditional logic support</li> </ul><h4>Cloud VM Management</h4><ul> <li>VM provisioning with customizable specs</li> <li>Remote desktop via VNC/noVNC</li> <li>AI agent deployment on VMs</li> <li>Real-time status monitoring</li> <li>Resource management</li> </ul><h3>Security Features</h3><ul> <li>Sensitive action approval system</li> <li>Terminal command permissions</li> <li>Local-first architecture for privacy</li> <li>Supabase authentication</li> <li>Encrypted communications</li> </ul><hr><h2>Architecture</h2><h3>System Architecture Diagram</h3><pre><code>┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Voice Input  │    │ Text Input   │    │ Keyboard Shortcut │   │
│  │ (Wake Word)  │    │ (Chat UI)    │    │ (Hotkey Manager)  │   │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘   │
└─────────┼───────────────────┼─────────────────────┼─────────────┘
          │                   │                     │
          ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DESKTOP APPLICATION                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ComputerUseAgent (Main Controller)          │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│    │
│  │  │ WindowManager│ │HotkeyManager│ │   SecurityManager   ││    │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘│    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│    │
│  │  │BackendManager│ │WakewordMgr │ │  RemoteDesktopMgr   ││    │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘│    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│              ┌───────────────┴───────────────┐                   │
│              ▼                               ▼                   │
│  ┌─────────────────────┐        ┌─────────────────────┐         │
│  │    ACT Backend      │        │    ASK Backend       │         │
│  │  (Automation Mode)  │        │ (Conversational Mode)│         │
│  │  - Mouse/Keyboard   │        │  - Screenshot        │         │
│  │  - Screenshot       │        │  - Browser           │         │
│  │  - Browser          │        │  - System Commands   │         │
│  │  - Terminal         │        │  - Behavior Learning │         │
│  └──────────┬──────────┘        └──────────┬──────────┘         │
└─────────────┼──────────────────────────────┼────────────────────┘
              │                              │
              ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AI PROVIDERS                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ Gemini  │ │ Claude  │ │ OpenAI  │ │DeepSeek │ │ Ollama  │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        WEB PLATFORM                              │
│  ┌─────────────────────┐        ┌─────────────────────┐         │
│  │   Next.js Frontend   │        │  FastAPI Backend    │         │
│  │  - Dashboard         │        │  - VM Management    │         │
│  │  - Remote Desktop    │        │  - Authentication   │         │
│  │  - Chat Panel        │        │  - Payment Process  │         │
│  └──────────┬──────────┘        └──────────┬──────────┘         │
│             │                              │                     │
│             └──────────────┬───────────────┘                     │
│                            ▼                                     │
│              ┌─────────────────────────┐                         │
│              │   Virtual Machines      │                         │
│              │  - Docker Containers    │                         │
│              │  - Python AI Agent      │                         │
│              │  - VNC/noVNC Streaming  │                         │
│              └─────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
</code></pre><h3>Technology Stack</h3><h4>Desktop Application</h4><table class="e-rte-table"> <thead> <tr> <th>Component</th> <th>Technology</th> </tr> </thead> <tbody><tr> <td>Framework</td> <td>Electron</td> </tr> <tr> <td>Language</td> <td>JavaScript (ES6+)</td> </tr> <tr> <td>Automation</td> <td>@computer-use/nut-js</td> </tr> <tr> <td>Voice Detection</td> <td>@picovoice/porcupine-node</td> </tr> <tr> <td>Speech-to-Text</td> <td>Vosk Server</td> </tr> <tr> <td>Text-to-Speech</td> <td>edge-tts (Python)</td> </tr> <tr> <td>AI Integration</td> <td>@google/generative-ai, @anthropic-ai/sdk, openai</td> </tr> <tr> <td>Database</td> <td>Supabase (PostgreSQL)</td> </tr> <tr> <td>Build</td> <td>electron-builder</td> </tr> </tbody></table><h4>Web Application</h4><table class="e-rte-table"> <thead> <tr> <th>Component</th> <th>Technology</th> </tr> </thead> <tbody><tr> <td>Frontend</td> <td>Next.js 14 + TypeScript</td> </tr> <tr> <td>Styling</td> <td>Tailwind CSS</td> </tr> <tr> <td>State Management</td> <td>Zustand</td> </tr> <tr> <td>Animations</td> <td>Framer Motion</td> </tr> <tr> <td>Backend</td> <td>FastAPI (Python)</td> </tr> <tr> <td>Authentication</td> <td>Supabase</td> </tr> <tr> <td>Payments</td> <td>Flutterwave</td> </tr> <tr> <td>Remote Desktop</td> <td>noVNC over WebSocket</td> </tr> <tr> <td>VM Infrastructure</td> <td>Docker</td> </tr> </tbody></table><hr><h2>Installation</h2><h3>Prerequisites</h3><ul> <li>Node.js 18+ and npm</li> <li>Python 3.8+ with pip</li> <li>Git</li> </ul><h3>Desktop Application Setup</h3><pre><code class="language-bash"># Clone the repository
git clone https://github.com/greatness0123/controlrebuildv3.git
cd controlrebuildv3

# Install dependencies
npm install

# Install Python dependencies for TTS
pip install edge-tts

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run in development mode
npm start

# Build for production
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
</code></pre><h3>Web Platform Setup</h3><pre><code class="language-bash"># Navigate to web directory
cd control_web

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and API credentials

# Run frontend development server
npm run dev

# Run backend server (in separate terminal)
cd backend
uvicorn main:app --reload
</code></pre><h3>Environment Variables</h3><p>Create a <code>.env</code> file with the following:</p><pre><code class="language-env"># AI Provider API Keys
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# Wake Word Detection
PORCUPINE_ACCESS_KEY=your_porcupine_access_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Ollama for Local Models
OLLAMA_BASE_URL=http://localhost:11434
</code></pre><hr><h2>Usage</h2><h3>Basic Commands</h3><h4>Activation</h4><ul> <li><strong>Voice</strong>: Say "Hey Control" followed by your command</li> <li><strong>Keyboard</strong>: Press your configured hotkey (default: Ctrl+Shift+Space)</li> </ul><h4>Example Commands</h4><p><strong>3D Modeling (Blender):</strong></p><pre><code>"Create a metallic sphere with studio lighting and render it"
"Add a subdivision modifier to the selected object"
"Export this scene as FBX"
</code></pre><p><strong>Video Editing (Adobe Premiere/DaVinci Resolve):</strong></p><pre><code>"Export this timeline for YouTube at 1080p"
"Add a cross-dissolve transition between these clips"
"Apply color correction to make it look cinematic"
</code></pre><p><strong>File Management:</strong></p><pre><code>"Organize my downloads folder by file type"
"Find all PDF files created this week and move them to Documents"
"Compress this folder and name it with today's date"
</code></pre><p><strong>Web Automation:</strong></p><pre><code>"Search for the best laptop deals and save them to a spreadsheet"
"Fill out this form with my saved information"
"Take a screenshot of this page and save it"
</code></pre><h3>Workflow Automation</h3><p>Create automated workflows with triggers:</p><pre><code class="language-javascript">// Example: Daily backup workflow
{
  "name": "Daily Backup",
  "trigger": {
    "type": "time",
    "schedule": "0 18 * * *"  // 6 PM daily
  },
  "actions": [
    { "type": "terminal", "command": "rsync -av ~/Documents ~/Backup" },
    { "type": "notify", "message": "Backup completed successfully" }
  ]
}
</code></pre><h3>Remote VM Usage</h3><ol> <li>Access the web dashboard at your deployed URL</li> <li>Create a new VM with desired specifications</li> <li>Connect via the integrated remote desktop viewer</li> <li>Use voice or text commands to automate tasks on the VM</li> </ol><hr><h2>API Reference</h2><h3>Action Types</h3><table class="e-rte-table"> <thead> <tr> <th>Action</th> <th>Parameters</th> <th>Description</th> </tr> </thead> <tbody><tr> <td><code>click</code></td> <td>x, y (0-1000)</td> <td>Single left-click</td> </tr> <tr> <td><code>double_click</code></td> <td>x, y (0-1000)</td> <td>Double-click</td> </tr> <tr> <td><code>right_click</code></td> <td>x, y (0-1000)</td> <td>Right-click context menu</td> </tr> <tr> <td><code>mouse_move</code></td> <td>x, y (0-1000)</td> <td>Move cursor to position</td> </tr> <tr> <td><code>drag</code></td> <td>start, end</td> <td>Click and drag operation</td> </tr> <tr> <td><code>scroll</code></td> <td>x, y, direction, amount</td> <td>Scroll at position</td> </tr> <tr> <td><code>type</code></td> <td>text, speed?</td> <td>Type text string</td> </tr> <tr> <td><code>key_press</code></td> <td>key</td> <td>Press key combination</td> </tr> <tr> <td><code>terminal</code></td> <td>command</td> <td>Execute shell command</td> </tr> <tr> <td><code>browser_open</code></td> <td>url</td> <td>Open URL in browser</td> </tr> <tr> <td><code>browser_screenshot</code></td> <td>-</td> <td>Capture browser content</td> </tr> <tr> <td><code>browser_execute_js</code></td> <td>code</td> <td>Run JavaScript</td> </tr> <tr> <td><code>wait</code></td> <td>duration</td> <td>Pause execution</td> </tr> <tr> <td><code>screenshot</code></td> <td>region?</td> <td>Capture screen region</td> </tr> </tbody></table><h3>IPC Channels (Electron)</h3><pre><code class="language-javascript">// Toggle features
ipcRenderer.invoke('toggle-wakeword', enabled)
ipcRenderer.invoke('toggle-tts', enabled)

// Automation
ipcRenderer.invoke('act', userInput)
ipcRenderer.invoke('ask', userInput, screenshot)

// Settings
ipcRenderer.invoke('get-settings')
ipcRenderer.invoke('update-settings', settings)

// Workflows
ipcRenderer.invoke('get-workflows')
ipcRenderer.invoke('create-workflow', workflow)
ipcRenderer.invoke('trigger-workflow', workflowId)
</code></pre><hr><h2>Project Structure</h2><pre><code>controlrebuildv3/
├── src/
│   ├── main/                    # Main Electron process
│   │   ├── main.js              # Entry point, ComputerUseAgent class
│   │   ├── backends/            # AI backend modules
│   │   │   ├── act-backend.js   # Automation mode backend
│   │   │   ├── ask-backend.js   # Conversational mode backend
│   │   │   └── wakeword-helper.js
│   │   ├── prompts/             # AI system prompts
│   │   │   └── act-system-prompt.md
│   │   ├── window-manager.js    # Window lifecycle management
│   │   ├── hotkey-manager.js    # Global shortcuts
│   │   ├── security-manager.js  # Permission handling
│   │   ├── backend-manager.js   # AI provider routing
│   │   ├── wakeword-manager.js  # Wake word detection
│   │   ├── edge-tts.js          # Text-to-speech
│   │   ├── vosk-server-manager.js # Speech-to-text
│   │   ├── workflow-manager.js  # Automation workflows
│   │   ├── remote-desktop-manager.js
│   │   └── supabase-service.js  # Database integration
│   ├── renderer/                # UI components
│   │   ├── chat-window.js       # Main chat interface
│   │   ├── settings-modal.js    # Settings panel
│   │   └── entry-window.js      # Overlay entry
│   └── preload/                 # Electron preload scripts
├── control_web/                 # Web platform
│   ├── app/                     # Next.js pages
│   │   ├── page.tsx             # Landing page
│   │   └── dashboard/           # VM management
│   ├── components/              # React components
│   │   ├── RemoteDesktop.tsx    # VNC viewer
│   │   └── ChatPanel.tsx        # AI chat interface
│   ├── backend/                 # FastAPI backend
│   │   ├── main.py              # API entry point
│   │   └── app/
│   │       ├── routes/          # API routes
│   │       └── services/        # Business logic
│   └── vm/                      # VM agent
│       └── ai_agent.py          # Python automation agent
├── scripts/                     # Utility scripts
├── website/                     # Marketing website
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
</code></pre><hr><h2>Contributing</h2><p>We welcome contributions! Please follow these steps:</p><ol> <li>Fork the repository</li> <li>Create a feature branch (<code>git checkout -b feature/amazing-feature</code>)</li> <li>Commit your changes (<code>git commit -m 'Add amazing feature'</code>)</li> <li>Push to the branch (<code>git push origin feature/amazing-feature</code>)</li> <li>Open a Pull Request</li> </ol><h3>Development Guidelines</h3><ul> <li>Follow the existing code style</li> <li>Add tests for new features</li> <li>Update documentation as needed</li> <li>Ensure all tests pass before submitting PR</li> </ul><hr><h2>Roadmap</h2><h3>Phase 1 (Current)</h3><ul> <li><input checked="" disabled="" type="checkbox"> Core automation engine</li> <li><input checked="" disabled="" type="checkbox"> Voice control with wake word</li> <li><input checked="" disabled="" type="checkbox"> Multi-provider AI support</li> <li><input checked="" disabled="" type="checkbox"> Web platform foundation</li> <li><input disabled="" type="checkbox"> Public beta release</li> </ul><h3>Phase 2 (Q2 2026)</h3><ul> <li><input disabled="" type="checkbox"> Visual workflow editor</li> <li><input disabled="" type="checkbox"> Mobile companion app</li> <li><input disabled="" type="checkbox"> API and SDK release</li> <li><input disabled="" type="checkbox"> Enhanced OCR integration</li> </ul><h3>Phase 3 (Q4 2026)</h3><ul> <li><input disabled="" type="checkbox"> Enterprise features</li> <li><input disabled="" type="checkbox"> Industry-specific modules</li> <li><input disabled="" type="checkbox"> Workflow marketplace</li> <li><input disabled="" type="checkbox"> International expansion</li> </ul><hr><h2>License</h2><p>This project is proprietary software. All rights reserved by Control AI.</p><hr><h2>Contact</h2><p><strong>Control AI</strong></p><ul> <li>Founder &amp; CEO/CTO: Okorie Greatness</li> <li>GitHub: <a href="https://github.com/greatness0123">@greatness0123</a></li> <li>Project Link: <a href="https://github.com/greatness0123/controlrebuildv3">https://github.com/greatness0123/controlrebuildv3</a></li> </ul><hr><div align="center"> <p><strong>Built with ❤️ by Control AI</strong></p> <p><em>Turning every computer user into a power user</em></p> </div>