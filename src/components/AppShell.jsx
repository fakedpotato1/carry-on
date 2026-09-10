import { CalendarDays, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, FolderKanban, LayoutDashboard, Menu, Plus, Waves, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { currentUser } from '../data/mockData'
import { resolveCurrentUser } from '../lib/authStore'
import { getAllProjects, PROJECTS_CHANGED_EVENT } from '../lib/projectsStore'
import Avatar from './Avatar'

function initialsOf(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function DashboardLink({ onNavigate }) {
  return <NavLink to="/dashboard" end onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={18} aria-hidden="true" /><span>Dashboard</span></NavLink>
}

function CalendarLink({ onNavigate }) {
  return <NavLink to="/calendar" onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><CalendarDays size={18} aria-hidden="true" /><span>Calendar</span></NavLink>
}

function ProfileLink({ onNavigate }) {
  const user = resolveCurrentUser(currentUser)
  return (
    <NavLink to="/profile" onClick={onNavigate} className={({ isActive }) => `profile-link ${isActive ? 'active' : ''}`}>
      <Avatar initials={initialsOf(user.name)} />
      <span className="profile-link-text"><strong>{user.name}</strong><span>{user.role}</span></span>
      <ChevronRight size={16} className="profile-link-chevron" aria-hidden="true" />
    </NavLink>
  )
}

function PrimaryNav({ collapsed = false, onNavigate }) {
  const [projectsOpen, setProjectsOpen] = useState(false)
  // Re-read on every navigation so a project created via "New Project" shows up
  // here immediately (the sidebar itself never unmounts between routes), and
  // also on a same-page create/delete (which doesn't navigate) via this event.
  const location = useLocation()
  const [, setRefreshTick] = useState(0)
  useEffect(() => {
    function refresh() { setRefreshTick((tick) => tick + 1) }
    window.addEventListener(PROJECTS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PROJECTS_CHANGED_EVENT, refresh)
  }, [])
  const projects = getAllProjects()

  function toggleProjects() {
    setProjectsOpen((open) => !open)
  }

  return (
    <nav aria-label="Primary navigation">
      <div className="nav-group-label">Workspace</div>
      <div className="nav-list">
        <DashboardLink onNavigate={onNavigate} />
        <div className="nav-projects">
          <div className="nav-projects-row">
            <NavLink to="/projects" onClick={onNavigate} className={({ isActive }) => `nav-link nav-projects-link ${isActive ? 'active' : ''}`} title="Projects">
              <FolderKanban size={18} aria-hidden="true" />
              <span>Projects</span>
            </NavLink>
            {!collapsed && (
              <button type="button" className="nav-projects-chevron-btn" onClick={toggleProjects} aria-expanded={projectsOpen} aria-label={projectsOpen ? 'Collapse project list' : 'Expand project list'}>
                {projectsOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              </button>
            )}
          </div>
          {!collapsed && projectsOpen && (
            <div className="nav-projects-list">
              {projects.map((item) => (
                <NavLink key={item.id} to={`/project/${item.id}/canvas`} onClick={onNavigate} className="nav-project-item">
                  <span className={`nav-project-dot ${item.atRisk ? 'is-risk' : ''}`} aria-hidden="true" />
                  <span className="nav-project-text"><strong>{item.title}</strong><span>{item.progress}% · {item.daysLeft} days left</span></span>
                </NavLink>
              ))}
              <Link to="/project/new" onClick={onNavigate} className="nav-project-add"><Plus size={15} aria-hidden="true" />New Project</Link>
            </div>
          )}
        </div>
        <CalendarLink onNavigate={onNavigate} />
      </div>
    </nav>
  )
}

export default function AppShell() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMenuOpen(false) }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="side-nav">
        <div className="brand-row">
          <NavLink to="/dashboard" className="brand">
            <span className="brand-mark"><Waves size={22} aria-hidden="true" /></span>
            <span className="brand-text"><span className="brand-name">LoadShift</span><span className="brand-subtitle">Group work, made lighter</span></span>
          </NavLink>
          <button type="button" className="sidebar-toggle" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight size={16} aria-hidden="true" /> : <ChevronsLeft size={16} aria-hidden="true" />}
          </button>
        </div>
        <PrimaryNav collapsed={collapsed} />
        <div className="side-nav-footer">
          <ProfileLink />
        </div>
      </aside>
      <div className="main-area">
        <header className="mobile-bar">
          <NavLink to="/dashboard" className="brand" style={{ padding: 0 }}><span className="brand-mark"><Waves size={20} aria-hidden="true" /></span><span className="brand-name">LoadShift</span></NavLink>
          <button className="icon-button" aria-expanded={menuOpen} aria-controls="mobile-primary-menu" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}</button>
        </header>
        {menuOpen && (
          <div id="mobile-primary-menu" className="mobile-menu" aria-label="Mobile navigation">
            <PrimaryNav onNavigate={() => setMenuOpen(false)} />
            <div className="side-nav-footer">
              <ProfileLink onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}
        <main><Outlet /></main>
      </div>
    </div>
  )
}
