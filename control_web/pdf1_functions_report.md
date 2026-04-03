> **CONTROL** **by** **Control** **AI**

**Comprehensive** **Report** **of** **Functions,** **Features,** **and**
**Capabilities**

> Generated: March 18, 2026

**EXECUTIVE** **SUMMARY**

Control is a revolutionary AI-powered desktop automation platform
developed by Control AI. It represents a paradigm shift in
human-computer interaction by enabling users to control their entire
computer through natural language voice or text commands. The system
comprises two integrated components: a desktop application built on
Electron for local automation, and a web platform for cloud-based
virtual machine management with remote desktop capabilities.

The platform's core innovation lies in its ability to 'see' and 'act' on
any desktop application using computer vision and sophisticated AI
reasoning, eliminating the need for application-specific APIs or
plugins. This universal approach allows Control to operate any software
from complex professional tools like AutoCAD and Blender to simple
system utilities.

**SYSTEM** **ARCHITECTURE**

**Desktop** **Application** **(Electron-based)**

The desktop application serves as the primary interface for local
computer automation. Built on the Electron framework, it provides
cross-platform compatibility across macOS, Windows, and Linux. The
architecture follows a modular design pattern with distinct managers
handling specific functionalities:

> • **ComputerUseAgent** **(Main** **Controller)**: The central
> orchestrator that coordinates all subsystems including window
> management, hotkey handling, security protocols, backend
> communication, and wakeword detection.
>
> • **WindowManager**: Manages multiple application windows including
> the main chat interface, settings panel, workflow editor, and entry
> overlay.
>
> • **HotkeyManager**: Handles global keyboard shortcuts for quick
> activation of Control features from anywhere in the operating system.
>
> • **SecurityManager**: Implements security protocols including
> sensitive action approvals, terminal command permissions, and user
> consent mechanisms.
>
> • **BackendManager**: Routes requests between the ASK mode
> (conversational) and ACT mode (automation) backends based on user
> intent.
>
> Page 1
>
> • **WakewordManager**: Enables hands-free activation through the 'Hey
> Control' wake word using Picovoice Porcupine detection engine.
>
> • **EdgeTTSManager**: Provides text-to-speech capabilities with both
> online (Edge TTS) and offline fallback options.
>
> • **VoskServerManager**: Manages local speech-to-text transcription
> for voice commands.
>
> • **WorkflowManager**: Handles automation workflow creation, storage,
> and execution with keyword and time-based triggers.
>
> • **RemoteDesktopManager**: Enables connection to cloud-hosted virtual
> machines through the web platform.

**Web** **Application** **(Next.js** **+** **FastAPI)**

The web platform extends Control's capabilities to cloud infrastructure,
enabling users to provision and manage virtual machines with AI
automation capabilities. The architecture consists of:

> • **Frontend** **(Next.js** **14)**: React-based dashboard with
> TypeScript for type safety, Tailwind CSS for styling, Framer Motion
> for animations, and Zustand for state management.
>
> • **Backend** **(FastAPI)**: Python-based REST API handling VM
> lifecycle management, user authentication via Supabase, payment
> processing through Flutterwave, and device pairing.
>
> • **Remote** **Desktop** **Viewer**: VNC/noVNC integration for
> real-time remote desktop streaming within the browser.
>
> • **AI** **Agent** **(Python)**: WebSocket-based automation agent
> running inside VMs for cloud-based task execution.
>
> Page 2

**CORE** **FUNCTIONS** **AND** **CAPABILITIES**

**1.** **Visual** **AI** **and** **Screen** **Understanding**

Control's visual AI system represents a breakthrough in desktop
automation. Unlike traditional automation tools that rely on brittle
coordinate recording or application-specific APIs, Control uses computer
vision to interpret screen pixels in real-time:

> • **Screenshot** **Analysis**: Captures high-resolution screenshots
> with cursor position marking for precise action targeting.
>
> • **UI** **Element** **Detection**: Identifies buttons, sliders,
> menus, text fields, and other interactive elements through pixel
> analysis.
>
> • **Normalized** **Coordinate** **System**: Maps screen positions to a
> 1000x1000 grid, enabling consistent targeting across different screen
> resolutions.
>
> • **Multi-Monitor** **Support**: Extends visual understanding across
> multiple display configurations.
>
> • **Dynamic** **Interface** **Adaptation**: Responds to UI changes in
> real-time without requiring pre-programmed templates.

**2.** **Mouse** **and** **Keyboard** **Automation**

The automation engine provides comprehensive control over input devices
through @computer-use/nut-js:

> • **Mouse** **Actions**: click, double_click, right_click, mouse_move,
> drag, scroll with pixel-perfect precision.
>
> • **Keyboard** **Actions**: type (with configurable speed), key_press
> for shortcuts and special keys. • **Terminal** **Execution**: Run
> shell commands with output capture and error handling.
>
> • **Clipboard** **Operations**: Read from and write to system
> clipboard for data transfer.
>
> • **Anti-Detection** **Patterns**: Human-like movement curves and
> randomized timing for applications sensitive to automation.

**3.** **Voice** **Control** **System**

Control features a sophisticated voice control pipeline enabling
hands-free operation:

> • **Wake** **Word** **Detection**: 'Hey Control' activation using
> Picovoice Porcupine engine with high accuracy and low false-positive
> rate.
>
> • **Speech-to-Text**: Vosk server integration for local,
> privacy-preserving transcription.
>
> • **Text-to-Speech**: Edge TTS with multiple voice options (Jenny,
> Aria, Guy, etc.) and configurable rate/volume.
>
> • **Offline** **Fallback**: Automatic switching to offline TTS when
> network connectivity is unavailable.
>
> • **Push-to-Talk**: Alternative activation method via configurable
> keyboard shortcut.
>
> Page 3

**4.** **Multi-Provider** **AI** **Integration**

Control supports multiple AI providers for maximum flexibility and
redundancy:

> • **Google** **Gemini** (Primary): High-performance multimodal model
> with excellent visual understanding.
>
> • **Anthropic** **Claude**: Advanced reasoning capabilities for
> complex task planning. • **OpenAI** **GPT-4**: Versatile language
> model with strong instruction following.
>
> • **DeepSeek**: Cost-effective alternative for routine tasks.
>
> • **Ollama**: Local model support for privacy-sensitive environments.
> • **OpenRouter**: Unified API access to multiple models.
>
> • **Groq**: High-speed inference for real-time applications.
>
> Page 4

**5.** **Browser** **Automation**

Built-in browser automation capabilities extend Control's reach to web
applications:

> • **Browser** **Navigation**: Open, navigate, and manage browser
> sessions.
>
> • **JavaScript** **Execution**: Run custom JavaScript for advanced web
> automation. • **Web** **Scraping**: Extract data from web pages with
> intelligent parsing.
>
> • **Form** **Interaction**: Fill forms, click buttons, and navigate
> complex web workflows. • **Session** **Persistence**: Maintain login
> states and cookies across sessions.

**6.** **Workflow** **Automation**

The workflow system enables users to create and save automated
sequences:

> • **Keyword** **Triggers**: Execute workflows when specific phrases
> are detected. • **Time-Based** **Triggers**: Schedule workflows at
> specific times or intervals.
>
> • **Import/Export**: Share workflows with team members or across
> devices. • **Action** **Libraries**: Pre-built workflow templates for
> common tasks.
>
> • **Conditional** **Logic**: Branch workflows based on conditions and
> results.

**7.** **Cloud** **VM** **Management**

The web platform provides enterprise-grade virtual machine management:

> • **VM** **Provisioning**: Create virtual machines with customizable
> specifications. • **Remote** **Desktop**: VNC/noVNC streaming for
> browser-based remote access.
>
> • **AI** **Agent** **Deployment**: Install automation agents on VMs
> for cloud-based execution. • **Session** **Management**: Track and
> manage active automation sessions.
>
> • **Resource** **Monitoring**: Real-time status and health indicators
> for VMs.

**8.** **Security** **and** **Privacy**

Control implements robust security measures to protect user data and
system integrity:

> • **Sensitive** **Action** **Approval**: User confirmation required
> for potentially destructive operations. • **Terminal** **Permission**
> **System**: Explicit approval for shell command execution.
>
> • **Local-First** **Architecture**: Minimizes data transmission to
> cloud services.
>
> • **Supabase** **Authentication**: Enterprise-grade user
> authentication and session management. • **Encrypted**
> **Communications**: All API calls and data transfers use encryption.
>
> Page 5

**TECHNICAL** **SPECIFICATIONS**

**Desktop** **Application** **Stack**

> • Framework: Electron (Cross-platform desktop) • Language: JavaScript
> (ES6+)
>
> • UI: HTML/CSS with custom theming • Automation: @computer-use/nut-js
>
> • AI Integration: @google/generative-ai, @anthropic-ai/sdk, openai
>
> • Voice Detection: @picovoice/porcupine-node,
> @picovoice/pvrecorder-node • TTS: edge-tts (Python), say (fallback)
>
> • STT: Vosk server integration
>
> • Database: Supabase (PostgreSQL)
>
> • Build: electron-builder for macOS, Windows, Linux

**Web** **Application** **Stack**

> • Frontend: Next.js 14 with TypeScript • Styling: Tailwind CSS
>
> • State Management: Zustand • Animations: Framer Motion • Backend:
> FastAPI (Python)
>
> • Database: Supabase (PostgreSQL) • Payments: Flutterwave integration
>
> • Remote Desktop: noVNC over WebSocket • VM: Docker containerization

**ACTION** **TYPES** **REFERENCE**

Control supports a comprehensive set of action types for automation:

||
||
||
||
||
||
||
||
||

> Page 6

||
||
||
||
||
||
||
||
||
||

**CONCLUSION**

Control represents a significant advancement in desktop automation
technology. By combining computer vision, advanced AI reasoning, and
comprehensive input control, it enables users to automate virtually any
desktop task through natural language commands. The dual-component
architecture provides both local automation capabilities and cloud-based
VM management, addressing a wide range of use cases from personal
productivity to enterprise automation.

The platform's commitment to a local-first approach, multi-provider AI
support, and robust security measures positions it as a compelling
solution for users seeking powerful automation without compromising
privacy or flexibility.

> Page 7
