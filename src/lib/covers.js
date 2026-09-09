const COVER_STORAGE_PREFIX = 'loadshift-cover-'

// A user-uploaded cover (saved in this browser) always wins over the project's
// default cover image, so a fresh browser with no upload yet still shows something.
export function getStoredCover(id) {
  try {
    return localStorage.getItem(COVER_STORAGE_PREFIX + id) || null
  } catch {
    return null
  }
}

export function setStoredCover(id, dataUrl) {
  try {
    if (dataUrl) localStorage.setItem(COVER_STORAGE_PREFIX + id, dataUrl)
    else localStorage.removeItem(COVER_STORAGE_PREFIX + id)
  } catch {
    // Storage full or unavailable — the cover just won't persist for this prototype session.
  }
}

// Resolve the cover to show for a project: an uploaded override if one exists
// in this browser, otherwise the project's baked-in default cover image.
export function resolveCover(project) {
  return getStoredCover(project.id) || project.coverImage || null
}
