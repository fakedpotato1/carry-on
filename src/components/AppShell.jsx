import { ChevronDown, ChevronsLeft, ChevronsRight, ChevronUp, FolderKanban, LayoutDashboard, Menu, Plus, Waves, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { projects } from '../data/mockData'

function DashboardLink({ onNavigate }) {
  return <NavLink to="/" end onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={18} aria-hidden="true" /><span>Dashboard</span></NavLink>
}

function PrimaryNav({ collapsed = false, onExpandSidebar, onNavigate }) {
  const [projectsOpen, setProjectsOpen] = useState(false)

  function toggleProjects() {
    if (collapsed) {
      onExpandSidebar?.()
      setProjectsOpen(true)
      return
    }
    setProjectsOpen((open) => !open)
  }

  return (
    <nav aria-label="Primary navigation">
      <div className="nav-group-label">Workspace</div>
      <div className="nav-list">
        <DashboardLink onNavigate={onNavigate} />
        <div className="nav-projects">
          <button type="button" className={`nav-link nav-projects-toggle ${projectsOpen ? 'active' : ''}`} onClick={toggleProjects} aria-expanded={projectsOpen} title="Projects">
            <FolderKanban size={18} aria-hidden="true" />
            <span>Projects</span>
            {!collapsed && (projectsOpen ? <ChevronUp size={16} className="nav-projects-chevron" aria-hidden="true" /> : <ChevronDown size={16} className="nav-projects-chevron" aria-hidden="true" />)}
          </button>
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
      </div>
    </nav>
  )
}

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="side-nav">
        <div className="brand-row">
          <NavLink to="/" className="brand">
            <span className="brand-mark"><Waves size={22} aria-hidden="true" /></span>
            <span className="brand-text"><span className="brand-name">LoadShift</span><span className="brand-subtitle">Group work, made lighter</span></span>
          </NavLink>
          <button type="button" className="sidebar-toggle" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight size={16} aria-hidden="true" /> : <ChevronsLeft size={16} aria-hidden="true" />}
          </button>
        </div>
        <PrimaryNav collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)} />
      </aside>
      <div className="main-area">
        <header className="mobile-bar">
          <NavLink to="/" className="brand" style={{ padding: 0 }}><span className="brand-mark"><Waves size={20} aria-hidden="true" /></span><span className="brand-name">LoadShift</span></NavLink>
          <button className="icon-button" aria-expanded={menuOpen} aria-controls="mobile-primary-menu" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}</button>
        </header>
        {menuOpen && <div id="mobile-primary-menu" className="mobile-menu"><PrimaryNav onNavigate={() => setMenuOpen(false)} /></div>}
        <main><Outlet /></main>
      </div>
    </div>
  )
}
