# UI/UX Audit - Control AI

## Section 1 — 101 UI/UX Improvement Items

| # | File / Component | Current Problem | Recommended Fix | Category |
|---|---|---|---|---|
| 1 | `src/renderer/chat-window.html` | Mode switcher dropdown `modeSelect` uses standard OS appearance. | Style a custom dropdown for better visual integration with the app's aesthetic. | Feedback & Affordance |
| 2 | `src/renderer/chat-window.js` | No loading indicator when switching modes via `modeSelect`. | Add a subtle pulse or transition effect when the mode changes. | Loading States |
| 3 | `src/renderer/chat-window.js` | Welcome screen greeting is static until personalized. | Animate the greeting appearance (e.g., fade-in or slide-up). | Microinteractions |
| 4 | `src/renderer/chat-window.js` | Attach popup (`attachPopup`) has no keyboard accessibility for closing. | Ensure the Escape key closes the popup when it's open. | Accessibility |
| 5 | `src/renderer/chat-window.js` | Attachment removal happens without confirmation. | Add a "Undo" toast or a confirmation for large file removals. | Feedback & Affordance |
| 6 | `src/renderer/chat-window.js` | Thinking status (`updateStatus`) disappears after 3 seconds. | Maintain the "Thinking" state until the AI starts responding. | Feedback & Affordance |
| 7 | `src/renderer/chat-window.js` | Markdown rendering of code blocks lacks syntax highlighting. | Integrate a library like Highlight.js or Prism.js for code snippets. | Typography |
| 8 | `src/renderer/chat-window.html` | Message history modal (`sessionsModal`) uses inline styles for layout. | Move to a dedicated CSS class for consistent styling. | Consistency |
| 9 | `src/renderer/chat-window.js` | Voice recording has a hardcoded 500ms delay. | Provide visual feedback (e.g., "Readying Microphone...") during this period. | Feedback & Affordance |
| 10 | `src/renderer/chat-window.js` | Rate limit display is currently commented out or empty. | Implement a visual gauge for used tasks/tokens. | Information Architecture |
| 11 | `src/renderer/settings-modal.html` | Sidebar items have no labels when collapsed, only icons. | Add tooltips or persistent text labels for better clarity. | Information Architecture |
| 12 | `src/renderer/settings-modal.html` | "Delete All Data" button uses primary black background. | Use a red/danger color to distinguish destructive actions. | Feedback & Affordance |
| 13 | `src/renderer/settings-modal.js` | Settings changes are saved immediately but feedback is often absent. | Add a "Saved" toast or checkmark indicator on successful updates. | Feedback & Affordance |
| 14 | `src/renderer/entry-window.html` | Feature list in left section has no interactive elements. | Make features clickable to show short demos or descriptions. | Navigation |
| 15 | `src/renderer/entry-window.html` | PIN entry input is a standard text field. | Use a masked PIN input component with auto-focus on next digit. | Microinteractions |
| 16 | `src/renderer/chat-window.html` | `::-webkit-scrollbar` is very thin (6px). | Increase width slightly for better accessibility on high-res screens. | Accessibility |
| 17 | `src/renderer/chat-window.html` | Chat input area lacks a character count. | Show character count for models with strict token limits. | Feedback & Affordance |
| 18 | `src/renderer/chat-window.js` | `stopCurrentTask` doesn't provide a "Stopping..." state. | Change button icon to a spinner while stop command is processed. | Feedback & Affordance |
| 19 | `src/renderer/chat-window.js` | Slash command suggestions only filter by name. | Include description in the search/filter logic. | Information Architecture |
| 20 | `src/renderer/chat-window.js` | Session titles are derived from the first message and truncated. | Allow users to rename sessions manually. | Information Architecture |
| 21 | `control_web/components/ChatPanel.tsx` | Mode switcher is a simple dropdown button. | Use a tab-like toggle for faster switching between modes. | Navigation |
| 22 | `control_web/components/ChatPanel.tsx` | Attached file icon is a generic `Paperclip`. | Show file type icons (PDF, Image, etc.) in the input preview. | Feedback & Affordance |
| 23 | `control_web/components/ChatPanel.tsx` | File upload has no progress bar. | Add a linear progress indicator for larger file uploads. | Loading States |
| 24 | `control_web/components/ChatPanel.tsx` | AI thought blocks push content off-screen. | Use a max-height with "Show More" for long reasoning traces. | Layout |
| 25 | `control_web/components/ChatPanel.tsx` | No way to re-run a specific agent action if it fails. | Add a "Retry Action" button next to failed trace items. | Error Handling |
| 26 | `control_web/app/(dashboard)/machines/page.tsx` | VM cards show raw "Instance URL". | Hide the URL and provide a "Copy URL" button to reduce clutter. | Information Architecture |
| 27 | `control_web/app/(dashboard)/machines/page.tsx` | No empty state when 0 VMs exist. | Add an illustration and a "Create your first VM" CTA. | Empty States |
| 28 | `control_web/app/(dashboard)/pair/page.tsx` | Pairing code input has no auto-uppercase. | Automatically convert input to uppercase. | Microinteractions |
| 29 | `control_web/app/(dashboard)/pair/page.tsx` | Success toast for pairing is generic. | Include the name of the paired device in the success message. | Feedback & Affordance |
| 30 | `control_web/components/WorkflowDesigner.tsx` | Node deletion happens instantly. | Use a shake animation or brief "Confirm?" state before deleting. | Feedback & Affordance |
| 31 | `control_web/components/WorkflowDesigner.tsx` | Edges between nodes are straight lines. | Use curved Bezier lines for a professional diagram feel. | Microinteractions |
| 32 | `control_web/components/WorkflowDesigner.tsx` | No zoom controls for the workflow canvas. | Add + / - and "Fit to Screen" buttons. | Navigation |
| 33 | `control_web/components/WorkflowDesigner.tsx` | Workflow name updated via standard input. | Allow clicking the title directly in the header to edit. | Microinteractions |
| 34 | `control_web/app/(dashboard)/marketplace/page.tsx` | Skills have no tags/categories. | Add badges for "Web", "System", "Media", etc. | Information Architecture |
| 35 | `control_web/app/(dashboard)/marketplace/page.tsx` | No "Popular" or "New" sorting. | Add sort options to help discovery. | Navigation |
| 36 | `control_web/components/VNCViewer.tsx` | Error overlay is opaque black. | Use a semi-transparent glassmorphism effect to keep context. | Feedback & Affordance |
| 37 | `control_web/components/VNCViewer.tsx` | "Reconnect" button is small. | Make primary action buttons more prominent in error states. | Feedback & Affordance |
| 38 | `control_web/app/(dashboard)/settings/billing/page.tsx` | Credit activity graph has no hover tooltips. | Show exact token counts on data point hover. | Feedback & Affordance |
| 39 | `control_web/app/(dashboard)/settings/billing/page.tsx` | Plan comparison uses simple checkmarks. | Use a more visual feature comparison table. | Typography |
| 40 | `control_web/app/(dashboard)/settings/apikeys/page.tsx` | Keys are visible by default. | Mask keys and show a "View" toggle icon. | Error Handling |
| 41 | `src/renderer/settings-modal.html` | Voice selection list has no search. | Add a search bar for installed TTS voices. | Navigation |
| 42 | `src/renderer/settings-modal.js` | Theme switching is instant and jarring. | Add a CSS transition for color changes. | Microinteractions |
| 43 | `src/renderer/chat-window.html` | Send button disabled if text empty even if audio is playing. | Button should function as "Stop" regardless of text during playback. | Consistency |
| 44 | `src/renderer/chat-window.js` | `isOnline` check is only on load/event. | Add a visual status indicator (green/red dot) in the header. | Feedback & Affordance |
| 45 | `src/renderer/chat-window.js` | Markdown tables are rendered as plain text. | Add CSS styles for `table`, `th`, `td` in `message-content`. | Typography |
| 46 | `src/renderer/chat-window.js` | Truncated AI thought text has no tooltip. | Ensure full text is accessible via hover or expansion. | Information Architecture |
| 47 | `src/renderer/chat-window.js` | `addCodeMessage` doesn't support manual language selection. | Add a language selector if detection fails. | Feedback & Affordance |
| 48 | `control_web/components/ChatPanel.tsx` | Message timestamps are absent. | Show relative time (e.g., "2m ago") on hover. | Information Architecture |
| 49 | `control_web/components/ChatPanel.tsx` | No distinction between user and system errors. | Use different colors/icons for AI rejections vs network errors. | Error Handling |
| 50 | `control_web/components/ChatPanel.tsx` | Input doesn't expand beyond 4 lines visually. | Allow manual resize of the input area. | Layout |
| 51 | `src/renderer/ghost-cursor-overlay.html` | Ghost cursor movement is linear. | Use easing for smoother, human-like movements. | Microinteractions |
| 52 | `src/renderer/ghost-cursor-overlay.html` | Text bubble below cursor is opaque. | Add transparency to avoid blocking UI elements. | Feedback & Affordance |
| 53 | `src/renderer/lite-window.html` | Lite mode controls have no hover tooltips. | Add descriptive tooltips for icons. | Accessibility |
| 54 | `src/renderer/lite-window.html` | Messages toggle icon is small. | Increase target area for easier interaction. | Feedback & Affordance |
| 55 | `src/renderer/main-overlay.html` | Floating button is fixed in one corner. | Allow users to drag and reposition the button. | Microinteractions |
| 56 | `src/main/window-manager.js` | Window resize limits are hardcoded. | Make resize behavior more responsive to aspect ratios. | Layout |
| 57 | `src/main/window-manager.js` | `createChatWindow` transparency issues. | Use a solid background or higher opacity blur for readability. | Typography |
| 58 | `src/main/main.js` | PIN request overlay blocks whole screen. | Use a centered modal that allows background context. | Feedback & Affordance |
| 59 | `control_web/app/(dashboard)/layout.tsx` | Sidebar navigation is icon-only. | Add expand/collapse state with text labels. | Navigation |
| 60 | `control_web/app/(dashboard)/layout.tsx` | Mobile layout has no bottom navigation. | Add mobile tab bar for core features. | Layout |
| 61 | `control_web/components/VMCard.tsx` | No feedback when VM is shutting down. | Change label to "Shutting down..." with a spinner. | Loading States |
| 62 | `control_web/components/VMCard.tsx` | VM specs are hidden in tooltips. | Show key specs directly on the card. | Information Architecture |
| 63 | `control_web/components/RemoteDesktopViewer.tsx` | Sidebar width is fixed. | Allow dragging the separator to resize remote view. | Layout |
| 64 | `control_web/components/RemoteDesktopViewer.tsx` | No "Full Screen" button for remote view. | Add a maximize toggle for the canvas area. | Navigation |
| 65 | `control_web/app/auth/login/page.tsx` | Password field lacks visibility toggle. | Add an eye icon to show/hide password. | Feedback & Affordance |
| 66 | `control_web/app/auth/login/page.tsx` | No "Remember Me" checkbox. | Add persistence option for logins. | Feedback & Affordance |
| 67 | `control_web/app/auth/signup/page.tsx` | No password strength indicator. | Add a real-time strength bar. | Feedback & Affordance |
| 68 | `control_web/app/(dashboard)/vault/page.tsx` | Secrets in a plain list. | Group secrets by category (AI Keys, Infra, etc.). | Information Architecture |
| 69 | `control_web/app/(dashboard)/vault/page.tsx` | No "Copy to Clipboard" for secrets. | Add a one-click copy button for secret values. | Feedback & Affordance |
| 70 | `control_web/app/(dashboard)/settings/appearance/page.tsx` | Accent color picker missing. | Allow users to choose their own brand color. | Microinteractions |
| 71 | `control_web/app/(dashboard)/settings/appearance/page.tsx` | Theme preview is static. | Show live mini-preview of chat UI with selected settings. | Feedback & Affordance |
| 72 | `src/renderer/settings-modal.html` | Hotkey input doesn't capture keys. | Implement listener that detects combinations on focus. | Feedback & Affordance |
| 73 | `src/renderer/settings-modal.html` | "Reset to Defaults" has no confirmation. | Add a modal to prevent accidental resets. | Error Handling |
| 74 | `src/renderer/chat-window.js` | Multi-monitor support isn't explicit. | Add a monitor selector if multiple screens are detected. | Information Architecture |
| 75 | `src/renderer/chat-window.js` | Audio playback has no volume slider. | Add volume control next to the "Speak" button. | Feedback & Affordance |
| 76 | `src/renderer/chat-window.js` | Long session lists have no scroll indicator. | Use a subtle gradient at the bottom of the list. | Feedback & Affordance |
| 77 | `src/renderer/chat-window.js` | Markdown headers (#) are too large. | Scale down header font sizes for message bubbles. | Typography |
| 78 | `src/renderer/chat-window.js` | Hyperlinks have no hover underline. | Add underline on hover for clarity. | Accessibility |
| 79 | `control_web/app/(dashboard)/pricing/page.tsx` | Current plan not highlighted. | Add a "Your Current Plan" badge to active tier. | Feedback & Affordance |
| 80 | `control_web/app/(dashboard)/pricing/page.tsx` | No FAQ section for billing. | Add an accordion for common questions. | Information Architecture |
| 81 | `control_web/app/(dashboard)/onboarding/page.tsx` | Onboarding steps not skippable. | Add a "Skip for now" button. | Navigation |
| 82 | `control_web/app/(dashboard)/onboarding/page.tsx` | Progress dots are too small. | Use numbered steps or a progress bar. | Feedback & Affordance |
| 83 | `control_web/components/ChatPanel.tsx` | AI typing indicator is simple text. | Use a "three dots" typing animation. | Loading States |
| 84 | `control_web/components/ChatPanel.tsx` | File drop zone lacks visual boundary. | Show dashed border when dragging file over area. | Feedback & Affordance |
| 85 | `src/renderer/entry-window.html` | Social login buttons missing. | Add "Sign in with Google/GitHub" options. | Navigation |
| 86 | `src/renderer/entry-window.js` | Login errors appear as generic text. | Highlight the specific field causing the error. | Error Handling |
| 87 | `src/renderer/chat-window.html` | User message bubble uses pure black. | Use slightly lighter gray/blue for better contrast. | Typography |
| 88 | `src/renderer/chat-window.js` | Input doesn't support formatted text. | Allow (Ctrl+B) etc. to apply markdown formatting. | Microinteractions |
| 89 | `src/renderer/chat-window.js` | AI reasoning traces are not searchable. | Include a "Find in Trace" feature. | Navigation |
| 90 | `control_web/app/(dashboard)/files/page.tsx` | Files in a grid only. | Add a toggle to switch between grid and detail list view. | Layout |
| 91 | `control_web/app/(dashboard)/files/page.tsx` | File date is raw ISO. | Format to user-friendly "Jan 12, 2025" style. | Typography |
| 92 | `src/renderer/settings-modal.html` | Model provider icons are small. | Increase size for better touch/click targets. | Accessibility |
| 93 | `src/renderer/settings-modal.html` | Long model names are truncated. | Increase dropdown width or use flexible container. | Layout |
| 94 | `control_web/components/WorkflowDesigner.tsx` | No "Clear All" button. | Add a reset button for the canvas. | Navigation |
| 95 | `control_web/components/WorkflowDesigner.tsx` | Node properties edit side panel overlaps. | Use non-overlapping sidebar or collapsible overlay. | Layout |
| 96 | `src/renderer/chat-window.js` | Wakeword toggle lacks status indicator. | Add mic icon with "Auto-listening" status in chat. | Feedback & Affordance |
| 97 | `src/renderer/chat-window.js` | "New Chat" doesn't clear visual effects. | Explicitly call `hideVisualEffects` on session reset. | Consistency |
| 98 | `control_web/app/legal/terms/page.tsx` | Text is wall-to-wall. | Add max-width to legal content for readability. | Typography |
| 99 | `control_web/app/legal/cookies/page.tsx` | Table of cookies is missing. | Add a structured list of cookies used. | Information Architecture |
| 100 | `src/renderer/chat-window.html` | Theme toggle missing from header. | Add sun/moon icon for quick switching. | Navigation |
| 101 | `src/renderer/chat-window.js` | REDO button appears prematurely. | Hide button until at least one message pair exists. | Consistency |

## Section 2 — What Makes This Feel Like a Dev Tool

1. **System Prompt Editor in Settings**: Normal users should not be exposed to the underlying instruction set of the AI. It creates risk of "breaking" the agent and adds unnecessary complexity.
   - **Replacement**: High-level "Personas" or "Conversation Styles" (e.g., Concise, Creative, Professional) that modify the prompt behind the scenes.
2. **Raw Model Selection (ID Entry)**: Asking users to know specific model IDs (e.g., `gemini-2.0-flash`) is a developer-centric task.
   - **Replacement**: A curated list of "Intelligence Tiers" with descriptions of their capabilities and costs.
3. **API Key Management**: Requiring users to fetch and paste keys from Google/Anthropic Cloud consoles is a massive barrier to entry.
   - **Replacement**: A managed service with a single subscription that abstracts away the infrastructure, or a "Connect Account" OAuth flow.
4. **Coordinate Logs in Traces**: Displaying "Clicking at (450, 233)" reads as a debugging log.
   - **Replacement**: Semantic descriptions like "Opening the Chrome Browser" or "Clicking the 'Send' button," accompanied by a cropped thumbnail of the target element.
5. **Technical Mode Labels (ACT/ASK)**: These are internal architecture terms.
   - **Replacement**: "Automation Mode" and "Chat Mode" (or a unified interface that detects intent).
6. **Raw JSON Error Objects**: Showing a JSON blob when a network request fails is incomprehensible to non-developers.
   - **Replacement**: Human-friendly error messages with clear recovery actions (e.g., "Check your internet connection" instead of `ECONNREFUSED`).

## Section 3 — What Should Be Added

1. **Proactive Error Recovery**: If an action fails (e.g., clicking a button that didn't appear), the agent should automatically pivot to a new strategy (like using a keyboard shortcut) and inform the user: "The button wasn't found, trying the keyboard instead."
2. **Multi-modal Input Preview**: When a user attaches a file or image, the AI should generate a quick "I see..." summary to confirm it has successfully parsed the context before the user even clicks send.
3. **Task Progress Stepper**: For complex automations with multiple steps, a visual progress bar or "breadcrumb" trail should show current status (e.g., `Step 3 of 5: Extracting Data from Spreadsheet`).
4. **Interactive Skill Library**: Instead of a flat list, a "Skill Store" where users can browse, preview (via video/GIF), and one-click install community-created automations.
5. **Session Branching**: The ability to "branch" a conversation. If an automation goes wrong, the user should be able to go back to a previous message and say "Try again from here, but use this file instead."

## Section 4 — What Works

1. **The Ghost Cursor Overlay**: This is the single best trust-building feature in the app. It visualizes the AI's "hand" on the screen, reducing the "black box" anxiety of automation.
2. **Lite Mode Integration**: The ability to collapse the chat into a minimal floating bar recognizes the reality that users need their screen real estate for the actual work being automated.
3. **Rich Input Highlighting**: The purple highlighting for slash commands and blue pills for file paths provide great visual hierarchy and make the input field feel like a powerful command center.
4. **Edge Glow Feedback**: Using the perimeter of the screen to signal AI activity is a brilliant use of peripheral vision, allowing the user to work on other things while knowing the agent is still running.

## Section 5 — What Should Be Cut

1. **Raw JSON in "Action Details"**: Users will not understand `{"action": "click", "x": 100, ...}`.
   - **Replacement**: Remove the JSON and show a natural language summary.
2. **"Model ID" manual text inputs**: Too prone to typos and requires technical knowledge.
   - **Replacement**: Remove text inputs in favor of pre-validated dropdowns.
3. **Blueprint Sidebar (Unused/Incomplete)**: Having a side-tab that is often empty or shows raw logs creates a "broken" feel.
   - **Replacement**: Replace with a simple floating progress pill.
4. **Picovoice Access Key Entry in Primary UI**: This belongs in a "Developer" or "Advanced" sub-menu.
   - **Replacement**: Move to a "Power User" tab in settings.

## Section 6 — Ideal UI/UX Patterns for 2025–2026 AI Agents

1. **Action/Thought Separation**: Use a "Thinking" bubble that is collapsible and distinct from the "Action" cards. Actions should be visual and semantic; thoughts should be narrative and concise.
2. **Progressive Disclosure of Complexity**: Show a simple "Running task..." status. Only if the user clicks "Technical Details" should the raw coordinates, model logs, and API latency be visible.
3. **Streaming Component Rendering**: Don't just stream text; stream UI. If the AI generates a chart, the chart should build in real-time. If it's performing a search, show a "Live Search" card that updates with results as they are found.
4. **Context-Aware Mode Switching**: The interface should be mode-less. If a user says "What is my balance?", it chats. If they say "Pay my utility bill", it shifts into action mode automatically.
5. **Trust Markers**: Use "AI Reasoning Badges" like "Verified via Vision" or "Checked via Terminal" to explain *why* the AI is confident in an action.
6. **Human-in-the-loop (HITL) by Default**: High-risk actions (deleting files, sending emails) should always trigger a visual "Confirm Action" card with a clear "Stop" button.

## Section 7 — HTML/CSS/JS Limitations vs a Reactive Framework

1. **Manual DOM Reconciliation**: In `src/renderer/chat-window.js`, adding a message involves complex template strings and manual `appendChild` calls.
   - **Result**: Highly prone to "Zombie DOM" nodes and synchronization errors between the backend state and the UI.
   - **Reactive Solution**: A framework like React would allow the UI to simply be a function of the `messages` array state, ensuring 100% consistency.
2. **Event Listener Management**: In `src/renderer/settings-modal.js`, listeners are added manually to every input.
   - **Result**: Significant risk of memory leaks when windows are reloaded or components hidden/shown without proper cleanup.
   - **Reactive Solution**: Component lifecycle hooks (`useEffect`, `onUnmount`) handle listener cleanup automatically.
3. **Prop Drilling and Global State**: The app relies heavily on `global.appSettings` and IPC broadcasts to sync state between windows.
   - **Result**: Tracking where a setting change originated (and why a window didn't update) is a nightmare in vanilla JS.
   - **Reactive Solution**: A global store (Zustand/Redux) with reactive subscriptions ensures every part of the UI updates instantly when state changes.
4. **Animation Coordination**: Coordinating the "Ghost Cursor" movement with the "Thinking" state in the chat window requires brittle `setInterval` logic.
   - **Result**: Animations often stutter or get out of sync during heavy CPU load.
   - **Reactive Solution**: Libraries like Framer Motion or React Spring allow for interruptible, state-driven animations that are much smoother and easier to maintain.
