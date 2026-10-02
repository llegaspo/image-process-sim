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
  await expect(page.locator('.lesson-index')).toHaveCount(0)
  await expect(page.getByText('08 / 17', { exact: true })).toBeVisible()

  const browseLessons = page.getByRole('button', { name: 'Browse all lessons' })
  await browseLessons.click()
  await expect(browseLessons).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.lesson-column-list').getByRole('button')).toHaveCount(17)
  const activeLesson = page.locator('.lesson-column-list').getByRole('button', { name: /Gaussian blur/ })
  await expect(activeLesson).toHaveAttribute('aria-current', 'step')
  await expect(activeLesson).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(browseLessons).toHaveAttribute('aria-expanded', 'false')
  await expect(browseLessons).toBeFocused()

  const railLessons = page.getByRole('button', { name: 'Lessons', exact: true })
  await railLessons.click()
  await expect(page.getByRole('region', { name: 'All image processing lessons' })).toBeVisible()
  await railLessons.click()
  await expect(page.getByRole('region', { name: 'All image processing lessons' })).toBeHidden()

  await page.getByRole('button', { name: 'Commit step' }).click()
  await expect(page.getByText(/Gaussian blur added/)).toBeVisible()
  await expect(page.locator('.pipeline-card')).toHaveCount(1)

  await browseLessons.click()
  await page.locator('.lesson-column-list').getByRole('button', { name: /Binary threshold/ }).click()
  await expect(page.getByRole('heading', { name: 'Binary threshold', exact: true })).toBeVisible()
  await expect(page.getByText('Y channel', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Next lesson: Brightness & contrast' }).click()
  await expect(page.getByRole('heading', { name: 'Brightness & contrast', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('mobile lesson navigation opens and selects a technique', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only behavior')
  await page.goto('/')
  await page.getByRole('button', { name: 'Lessons', exact: true }).click()
  await expect(page.getByText('Choose a lesson')).toBeVisible()
  await page.locator('.lesson-menu-panel').getByRole('button', { name: /Sobel gradients/ }).click()
  await expect(page.getByRole('heading', { name: 'Sobel gradients', exact: true })).toBeVisible()
  await expect(page.getByText('Gx + Gy', { exact: true })).toBeVisible()
  await expect(page.getByText('11 / 17', { exact: true })).toBeVisible()
})
