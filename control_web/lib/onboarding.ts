/** Session flag set when user finishes `/onboarding` (not skip) — triggers one-time tour + nav hints. */
export const WORKSPACE_TOUR_SESSION_KEY = 'control_show_workspace_tour';

export const WORKSPACE_HINTS_SESSION_KEY = 'control_show_workspace_hints';

export function workspaceTourDoneKey(userId: string) {
  return `control_workspace_tour_done_v1_${userId}`;
}

export function workspaceHintsDismissedKey(userId: string) {
  return `control_workspace_hints_v1_${userId}`;
}

export function needsProfileOnboarding(metadata: Record<string, unknown> | undefined): boolean {
  return metadata?.onboarding_completed === false;
}
