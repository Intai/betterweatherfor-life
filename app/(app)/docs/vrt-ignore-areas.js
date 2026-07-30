// Helpers for VRT ignoreAreas. VRT applies ignore areas in image pixel space,
// while boundingBox() returns viewport-relative CSS pixels. The two coincide
// only when the page is scrolled to the top and the device scale factor is 1
// (devices['Desktop Chrome'] is dSF 1 and setViewportSize does not change it).
// If a project with dSF !== 1 is ever added, scale the boxes here.

const toArea = (box, paddingX, paddingY) => ({
  x: Math.max(0, Math.floor(box.x - paddingX)),
  y: Math.max(0, Math.floor(box.y - paddingY)),
  width: Math.ceil(box.width + paddingX * 2),
  height: Math.ceil(box.height + paddingY * 2),
})

/**
 * Resolve VRT ignore areas for elements that render volatile content.
 * @param {import('@playwright/test').Page} page - The page under capture.
 * @param {string[]} testIds - data-testid values to mask.
 * @param {{ paddingX?: number, paddingY?: number }} [options] - The axes are separate because they
 *   absorb different things. paddingY covers sub-pixel antialiasing at the box edges, and stays
 *   small so the mask cannot swallow the lines above and below. paddingX has to additionally cover
 *   how much wider the baseline's content could have rendered, which is unbounded by the current
 *   measurement - see the project execute-bdd-scenario skill for the measured values.
 * @returns {Promise<{x: number, y: number, width: number, height: number}[]>} Ignore areas in image pixels.
 */
export async function ignoreAreasOf(page, testIds, { paddingX = 2, paddingY = 2 } = {}) {
  await page.evaluate(() => window.scrollTo(0, 0))
  const boxes = await Promise.all(
    testIds.map(testId => page.getByTestId(testId).first().boundingBox()),
  )
  return boxes.filter(Boolean).map(box => toArea(box, paddingX, paddingY))
}
