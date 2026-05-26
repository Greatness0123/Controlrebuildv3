# UI Design System - Control AI

## Color Tokens (Fluent 2 / Windows 11 Inspired)

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `--bg-base` | `#f3f3f3` | `#202020` | App background |
| `--bg-layer1` | `rgba(255,255,255,0.7)` | `rgba(40,40,40,0.7)` | Layered card background |
| `--bg-layer2` | `rgba(255,255,255,0.5)` | `rgba(50,50,50,0.5)` | Subtle depth layers |
| `--bg-stroke` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | Border and separators |
| `--accent` | `#0078D4` | `#0078D4` | Primary brand color |
| `--accent-light` | `#0091F8` | `#0091F8` | Hover state for accent |
| `--accent-subtle` | `rgba(0,120,212,0.1)` | `rgba(0,120,212,0.15)` | Background for active items |
| `--text-primary` | `rgba(0,0,0,0.89)` | `rgba(255,255,255,0.89)` | Main content text |
| `--text-secondary`| `rgba(0,0,0,0.6)` | `rgba(255,255,255,0.6)` | Descriptions and hints |

## Typography

- **System Font:** `'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif`
- **Monospace:** `'JetBrains Mono', 'Cascadia Code', monospace`
- **Base Size:** `14px`

## Spacing & Radius

- **Small Radius:** `4px` (`--radius-sm`)
- **Medium Radius:** `8px` (`--radius-md`)
- **Large Radius:** `12px` (`--radius-lg`)
- **Extra Large:** `16px` (`--radius-xl`)

## Elevation (Shadows)

- `--shadow-2`: `0 1px 2px rgba(0,0,0,0.12)` (Low elevation)
- `--shadow-8`: `0 4px 8px rgba(0,0,0,0.12)` (Medium elevation)
- `--shadow-16`: `0 8px 16px rgba(0,0,0,0.14)` (High elevation / Modals)

## Iconography

1. **Segoe MDL2 Assets:** Used for window controls and system-level actions (e.g., `&#xE8BB;` for close).
2. **Fluent System Icons:** Used for app-level navigation and actions (integrated via SVGs).
3. **Font Awesome (Legacy):** Preserved for original elements but superseded by Fluent proxies.

## Component Patterns

- **Acrylic Cards:** Use `background: var(--bg-layer1); backdrop-filter: blur(40px);`
- **Fluent Toggles:** 40x20px track with pill thumb and accent transition.
- **Segmented Control:** Used for Mode Switching (ACT/ASK/GUIDE) instead of dropdowns.
- **Floating Input:** Pill-shaped text area with blur background and elevated shadow.
