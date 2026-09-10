const USER_STORAGE_KEY = 'loadshift-user'

// The name and username entered during Sign Up are saved in this browser so
// the rest of the app (greeting, profile page) can reflect them. There is no
// real backend in this prototype, so the password is collected in the form
// but never stored anywhere.
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser({ name, username }) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ name, username }))
  } catch {
    // Storage full or unavailable — the profile just won't persist for this prototype session.
  }
}

// Merges a stored name over the app's default mock user, so pages keep
// working even before anyone has signed up.
export function resolveCurrentUser(defaultUser) {
  const stored = getStoredUser()
  if (!stored?.name) return defaultUser
  return { ...defaultUser, name: stored.name }
}
