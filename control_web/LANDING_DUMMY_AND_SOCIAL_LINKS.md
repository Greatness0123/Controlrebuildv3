# Landing page: dummy fields and external links

Use this checklist when you are ready to wire production URLs. Do not commit secrets here.

## Desktop download URLs

Edit `control_web/lib/download-urls.ts`:

| Field     | Purpose                                      |
| --------- | -------------------------------------------- |
| `mac`     | Direct link to macOS `.dmg` (or zip)         |
| `windows` | Direct link to Windows installer             |
| `linux`   | Direct link to AppImage, `.deb`, or tarball |

Until these strings are non-empty, the download page shows **Coming soon** for that platform.

## Try Control Web (primary CTA)

The marketing site sends users to:

- `/auth/login?next=/workspace`

After sign-in, they are redirected to `/workspace`. No dummy URL is required unless you change the post-login destination.

**New accounts:** Sign-up sets `user_metadata.onboarding_completed: false`. The dashboard layout sends those users to `/onboarding?next=<current path>` until they finish or skip. Completing onboarding sets `onboarding_completed: true` and stores optional goals/surface/experience; it also triggers a **one-time workspace tour** and **nav hints** on the home workspace (session flags + `localStorage` keys in `lib/onboarding.ts`).

## Social profiles (marketing footer)

Icons render in the landing footer (`components/landing/LandingMarketing.tsx`). Set full URLs in **`control_web/.env.local`** (or your host’s env):

| Variable                         | Icon (Lucide)    | Typical link        |
| -------------------------------- | ---------------- | ------------------- |
| `NEXT_PUBLIC_SOCIAL_TWITTER`     | Twitter (X)      | `https://x.com/...` |
| `NEXT_PUBLIC_SOCIAL_GITHUB`      | GitHub           | `https://github.com/...` |
| `NEXT_PUBLIC_SOCIAL_LINKEDIN`    | LinkedIn         | `https://www.linkedin.com/...` |
| `NEXT_PUBLIC_SOCIAL_DISCORD`     | MessagesSquare   | Discord invite or community URL |

When a variable is empty, the icon still appears (dashed border, dimmed); hover shows which env key to set. After changing `.env.local`, restart `next dev` / redeploy.

Helper: `lib/social-links.ts` (`getSocialLinks()`).

## Legal copy (Terms, Privacy, Cookies)

- **Source markdown (edit for counsel review):**  
  - `legal/copy/terms.md`  
  - `legal/copy/privacy.md`  
  - `legal/copy/cookies.md`
- **Rendered on the site:**  
  - `/legal/terms`  
  - `/legal/privacy`  
  - `/legal/cookies`

`app/legal/*/page.tsx` loads the matching markdown and renders via `components/LegalMarkdown.tsx`.

Linked from: marketing footer, auth login/signup, download page footer.

## Cookie consent banner

`components/CookieConsent.tsx` is mounted in the root `app/layout.tsx`. It writes **`control_cookie_consent_v1`** to `localStorage` (`accepted` or `essential`). Document actual cookies/storage keys in `legal/copy/cookies.md` to match your deployment (Supabase session, theme, etc.).

## Hero and section images

Hero and use-case images load from **Pexels** via `next/image` (`images.pexels.com` is allowlisted in `next.config.mjs`). Replace `src` URLs in `LandingMarketing.tsx` and `app/download/page.tsx` if you want branded photography.

## Pricing link

`/pricing` lives inside the authenticated dashboard. Unauthenticated visitors who open `/pricing` are sent to `/auth/login?next=/pricing` via the dashboard layout, so after login they return to pricing.
