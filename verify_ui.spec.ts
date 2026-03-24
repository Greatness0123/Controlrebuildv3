import { test, expect } from '@playwright/test';

test('verify workspace and pricing', async ({ page }) => {
  // Try to bypass auth by setting a dummy token in localStorage if applicable
  await page.addInitScript(() => {
    window.localStorage.setItem('supabase.auth.token', JSON.stringify({ currentSession: { access_token: 'dummy', user: { id: 'dummy' } } }));
  });

  await page.goto('http://localhost:3001/pricing');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'pricing_desktop.png' });

  await page.goto('http://localhost:3001/workspace');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'workspace_desktop.png' });
});
