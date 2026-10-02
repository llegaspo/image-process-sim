import { expect, test } from '@playwright/test'

test('traces a neighborhood operation and builds a pipeline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop lesson workflow')
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Gaussian blur', exact: true })).toBeVisible()
  await expect(page.getByText('N₄', { exact: true })).toBeVisible()
  await expect(page.getByText('N₈', { exact: true })).toBeVisible()
  await expect(page.getByText('25 full-precision products', { exact: false })).toBeVisible()
  await expect(page.locator('.katex-error')).toHaveCount(0)
  await expect(page.locator('canvas')).toHaveCount(2)

  await page.getByRole('button', { name: 'Commit step' }).click()
  await expect(page.getByText(/Gaussian blur added/)).toBeVisible()
  await expect(page.locator('.pipeline-card')).toHaveCount(1)

  await page.locator('.lesson-grid').getByRole('button', { name: /Threshold/ }).click()
  await expect(page.getByRole('heading', { name: 'Binary threshold', exact: true })).toBeVisible()
  await expect(page.getByText('Y channel', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('mobile lesson navigation opens and selects a technique', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only behavior')
  await page.goto('/')
  await page.getByRole('button', { name: 'Lessons' }).click()
  await expect(page.getByText('Choose a lesson')).toBeVisible()
  await page.locator('.lesson-drawer').getByRole('button', { name: /Sobel gradients/ }).click()
  await expect(page.getByRole('heading', { name: 'Sobel gradients', exact: true })).toBeVisible()
  await expect(page.getByText('Gx + Gy', { exact: true })).toBeVisible()
})
