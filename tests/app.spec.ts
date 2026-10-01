import { expect, test } from '@playwright/test'

test('teaches a pixel transformation and builds a pipeline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop lesson workflow')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'RGB → grayscale', exact: true }).first()).toBeVisible()
  await expect(page.getByText('0.299R + 0.587G + 0.114B', { exact: false }).first()).toBeVisible()
  await expect(page.getByLabel('Interactive before and after image. Click to inspect a pixel.')).toBeVisible()

  await page.getByRole('button', { name: 'Add this step to pipeline' }).click()
  await expect(page.getByText('RGB → grayscale joined the pipeline.')).toBeVisible()
  await expect(page.locator('.pipeline-step')).toHaveCount(1)

  await page.getByRole('button', { name: /Gaussian blur/ }).click()
  await expect(page.getByRole('heading', { name: 'Gaussian blur', exact: true }).first()).toBeVisible()
  await expect(page.getByText('Σ weights = 1.000')).toBeVisible()
})

test('mobile lesson navigation opens and selects a technique', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only behavior')
  await page.goto('/')
  await page.getByRole('button', { name: 'Toggle lessons' }).click()
  await expect(page.getByText('Choose a lesson')).toBeVisible()
  await page.getByRole('button', { name: /Sobel edges/ }).click()
  await expect(page.getByRole('heading', { name: 'Sobel edges', exact: true }).first()).toBeVisible()
})
