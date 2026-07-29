// Helpers for VRT ignoreAreas. VRT applies ignore areas in image pixel space,
// while boundingBox() returns viewport-relative CSS pixels. The two coincide
// only when the page is scrolled to the top and the device scale factor is 1
// (devices['Desktop Chrome'] is dSF 1 and setViewportSize does not change it).
// If a project with dSF !== 1 is ever added, scale the boxes here.

const toArea = (box, padding) => ({
  x: Math.max(0, Math.floor(box.x - padding)),
  y: Math.max(0, Math.floor(box.y - padding)),
  width: Math.ceil(box.width + padding * 2),
  height: Math.ceil(box.height + padding * 2),
})

/**
 * Resolve VRT ignore areas for elements that render volatile content.
 * @param {import('@playwright/test').Page} page - The page under capture.
 * @param {string[]} testIds - data-testid values to mask.
 * @param {{ padding?: number }} [options] - Padding absorbs sub-pixel antialiasing at box edges.
 * @returns {Promise<{x: number, y: number, width: number, height: number}[]>} Ignore areas in image pixels.
 */
export async function ignoreAreasOf(page, testIds, { padding = 2 } = {}) {
  await page.evaluate(() => window.scrollTo(0, 0))
  const boxes = await Promise.all(
    testIds.map(testId => page.getByTestId(testId).first().boundingBox()),
  )
  return boxes.filter(Boolean).map(box => toArea(box, padding))
}
