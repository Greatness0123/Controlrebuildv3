# Settings Page Functional Specification

This document outlines the intended functionality for each tab in the Control Web Dashboard settings.

## 1. Account (`/settings/account`)
- **Display Name:** Edit user's first/last name stored in `user_metadata`.
- **Email:** View primary email address (read-only for now).
- **Profile Picture:** Simple initial-based avatar or upload option.
- **Actions:** Sign out, link to desktop profile sync.

## 2. Billing & Credits (`/settings/billing`)
- **Plan Display:** Show current tier (Free, Pro, Master).
- **Usage Stats:** Visualize ACT/ASK token usage vs limits.
- **Actions:** Link to pricing page, view past transaction logs (simulated).

## 3. Privacy & Security (`/settings/privacy`)
- **Password Reset:** Trigger password reset email via Supabase.
- **Session Management:** List active sessions (simulated).
- **Two-Factor:** Simple toggle (future implementation).

## 4. Appearance (`/settings/appearance`)
- **Theme Toggle:** Switch between Light and Dark mode.
- **Interface Density:** Toggle between "Classic" and "Compact" modes.
- **Primary Color:** Choose accent color (Black, Blue, Purple).

## 5. API Keys (`/settings/apikeys`)
- **Supabase Keys:** View public keys required for manual desktop linking.
- **Control API Keys:** Generate/Revoke custom API keys for third-party integrations.
- **Status:** Show last used date for each key.

## 6. AI Provider (`/settings/provider`)
- **Selection:** Choose between Gemini (default), OpenAI, or Claude.
- **API Key Storage:** Save provider-specific keys to `app_config` or `user_metadata`.
- **Model Selection:** Dropdown for selecting specific models (e.g., Gemini 1.5 Pro).

## 7. Terminal (`/settings/terminal`)
- **Permissions:** Global toggle for "Allow AI to run terminal commands."
- **Whitelist:** Manage a list of "safe" commands that don't require confirmation.

## 8. Data & Export (`/settings/data`)
- **Chat History:** Export all chat messages to JSON/CSV.
- **Account Deletion:** Permanent deletion of user data and profile.

## 9. Feedback (`/settings/feedback`)
- **Form:** Simple text area for bug reports or feature requests.
- **Rating:** 1-5 star rating for the experience.

## 10. About (`/settings/about`)
- **Version:** Display current app version.
- **Links:** Documentation, GitHub, Terms of Service.
