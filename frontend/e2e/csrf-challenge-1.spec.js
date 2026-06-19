import { test, expect } from '@playwright/test'

// End-to-end test for CSRF Challenge 1 (GET-based).
// Verifies the full flow: pre-set alias → navigate to challenge → payload → success modal.
// Covers issue 06 / user story 21.

test('CSRF Challenge 1 — GET-based CSRF triggers success modal', async ({ page }) => {
  // 1. Pre-set the alias in localStorage so we skip the name-entry screen.
  //    App.jsx reads localStorage on mount: localStorage.getItem('alias').
  await page.addInitScript(() => {
    localStorage.setItem('alias', 'e2e-tester')
  })

  // 2. Navigate directly to CSRF Challenge 1
  await page.goto('/challenges/csrf/0')

  // 3. Wait for the two-pane layout to render
  await expect(page.locator('iframe')).toHaveCount(2, { timeout: 10000 })
  await expect(page.getByText(/attacker page/i).first()).toBeVisible()
  await expect(page.getByText(/victim session/i).first()).toBeVisible()

  // 4. Wait for Monaco editor to be ready, then set the payload via Monaco's model API.
  //    keyboard.type is unreliable with Monaco's custom input handling in headless Chromium.
  //    monaco.editor.getModels()[0].setValue(...) triggers onChange which updates React state.
  const monacoEditor = page.locator('.monaco-editor').first()
  await monacoEditor.waitFor({ state: 'visible', timeout: 10000 })

  await page.evaluate(() => {
    const models = window.monaco?.editor?.getModels()
    if (models?.length) {
      models[0].setValue('<img src="/change-email?email=attacker@evil.com">')
    }
  })

  // Short wait for React to re-render with the new payload state
  await page.waitForTimeout(300)

  // 5. Click the inject / action button
  await page.getByRole('button', { name: /launch attack/i }).click()

  // 6. The victim pane receives the postMessage and fires csrf-triggered.
  //    Assert the success modal becomes visible.
  await expect(page.getByText(/challenge solved/i)).toBeVisible({ timeout: 10000 })
})
