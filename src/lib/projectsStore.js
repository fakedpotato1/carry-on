import { projects as baseProjects } from '../data/mockData'

const CUSTOM_PROJECTS_KEY = 'loadshift-custom-projects'

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

export function getAllProjects() {
  return [...baseProjects, ...getCustomProjects()]
}

export function saveCustomProject(project) {
  try {
    const next = [...getCustomProjects(), project]
    localStorage.setItem(CUSTOM_PROJECTS_KEY, JSON.stringify(next))
  } catch {
    // Storage full or unavailable — the project just won't persist for this prototype session.
  }
  return project
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
