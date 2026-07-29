// The VRT SDK's vrt.stop() sends PATCH /builds/:id with an empty body, and the API applies the body
// verbatim as the update (ModifyBuildDto { ciBuildId?, isRunning? }), so it never clears isRunning
// and the build shows a permanent progress bar in the UI. Close the build explicitly here.
//
// This is globalTeardown rather than a spec afterAll because every @screenshots spec upserts into
// the same build (one per project + ciBuildId), so the build spans the whole run: a per-file
// afterAll would close a build another file is still reporting into. Teardown also runs when tests
// fail, maxFailures trips, or the run is interrupted, which an afterAll does not always do.

const jsonHeaders = () => ({
  apiKey: process.env.VRT_APIKEY,
  project: process.env.VRT_PROJECT,
  'Content-Type': 'application/json',
})

/**
 * Mark this run's visual regression build as finished.
 *
 * The build is re-resolved by upsert rather than looked up, because POST /builds is api key
 * authenticated while GET /builds requires a user JWT. Both VRT_CIBUILDID and VRT_BRANCHNAME are
 * derived in playwright.config.js so the main process resolves the same build the workers reported
 * into - a missing ciBuildId here would create a second build instead of closing theirs.
 * @returns {Promise<void>} Resolves once the build is closed, or immediately when VRT is disabled.
 */
export default async function finishVisualBuild() {
  const { VRT_APIURL, VRT_APIKEY, VRT_PROJECT, VRT_BRANCHNAME, VRT_CIBUILDID } = process.env

  if (!VRT_APIURL || !VRT_APIKEY || !VRT_PROJECT || !VRT_CIBUILDID) {
    return
  }

  try {
    const created = await fetch(`${VRT_APIURL}/builds`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        project: VRT_PROJECT,
        branchName: VRT_BRANCHNAME,
        ciBuildId: VRT_CIBUILDID,
      }),
    })

    if (!created.ok) {
      throw new Error(`POST /builds responded ${created.status}`)
    }

    const build = await created.json()
    const finished = await fetch(`${VRT_APIURL}/builds/${build.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ isRunning: false }),
    })

    if (!finished.ok) {
      throw new Error(`PATCH /builds/${build.id} responded ${finished.status}`)
    }
  } catch (error) {
    // An unreachable tracker must not fail an otherwise green run - the build is left running and
    // can be closed from the build list menu in the VRT UI.
    console.warn(`Could not finish the visual regression build: ${error.message}`)
  }
}
