/**
 * Public social URLs for the marketing footer.
 * Set in `.env.local` (see LANDING_DUMMY_AND_SOCIAL_LINKS.md).
 */
export function getSocialLinks() {
  return {
    twitter: (process.env.NEXT_PUBLIC_SOCIAL_TWITTER ?? '').trim(),
    github: (process.env.NEXT_PUBLIC_SOCIAL_GITHUB ?? '').trim(),
    linkedin: (process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? '').trim(),
    discord: (process.env.NEXT_PUBLIC_SOCIAL_DISCORD ?? '').trim(),
  } as const;
}
