import { projects as baseProjects } from '../data/mockData'

const CUSTOM_PROJECTS_KEY = 'loadshift-custom-projects'
const DELETED_PROJECTS_KEY = 'loadshift-deleted-projects'

// Fired on window whenever the saved project list changes (create or
// delete), so any component showing a project list — sidebar, dashboard,
// all-projects grid — can refresh itself without a full page reload.
export const PROJECTS_CHANGED_EVENT = 'loadshift-projects-changed'

function notifyProjectsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT))
}

// Projects created through the "Create a New Project" flow are saved in this
// browser's localStorage and merged with the built-in example projects, so a
// new project shows up as a real card everywhere the project list is used.
export function getCustomProjects() {
  try {
    const raw = localStorage.getItem(CUSTOM_PROJECTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Built-in example projects that have been deleted are remembered here (by
// id) so they stay hidden across reloads, since they don't live in
// localStorage themselves.
export function getDeletedProjectIds() {
  try {
    const raw = localStorage.getItem(DELETED_PROJECTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getAllProjects() {
  const deleted = new Set(getDeletedProjectIds())
  return [...baseProjects, ...getCustomProjects()].filter((item) => !deleted.has(item.id))
}

export function saveCustomProject(project) {
  try {
    const next = [...getCustomProjects(), project]
    localStorage.setItem(CUSTOM_PROJECTS_KEY, JSON.stringify(next))
  } catch {
    // Storage full or unavailable — the project just won't persist for this prototype session.
  }
  notifyProjectsChanged()
  return project
}

// Deletes a project's assignment card. A custom (locally-created) project is
// removed outright; a built-in example project is instead recorded as
// deleted so it stays hidden without needing to touch the shipped mock data.
export function deleteProject(id) {
  try {
    const customProjects = getCustomProjects()
    if (customProjects.some((item) => item.id === id)) {
      localStorage.setItem(CUSTOM_PROJECTS_KEY, JSON.stringify(customProjects.filter((item) => item.id !== id)))
    } else {
      const deleted = getDeletedProjectIds()
      if (!deleted.includes(id)) localStorage.setItem(DELETED_PROJECTS_KEY, JSON.stringify([...deleted, id]))
    }
  } catch {
    // Storage full or unavailable — the project will reappear next reload for this prototype session.
  }
  notifyProjectsChanged()
}

function slugify(title) {
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '')
  return base || `project-${Date.now()}`
}

export function makeProjectId(title) {
  const existingIds = getAllProjects().map((item) => item.id)
  const base = slugify(title)
  let id = base
  let suffix = 2
  while (existingIds.includes(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  return id
}
