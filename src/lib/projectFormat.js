// Shared formatting helpers for project deadlines/dates, used by any flow
// that creates a project (the New Project page and the Sign Up flow).
export function formatDeadline(value) {
  if (!value) return 'No deadline set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No deadline set'
  const datePart = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${datePart}, ${timePart}`
}

export function computeDaysLeft(value) {
  if (!value) return 0
  const deadline = new Date(value)
  if (Number.isNaN(deadline.getTime())) return 0
  const diff = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 0)
}

export function formatToday() {
  return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
