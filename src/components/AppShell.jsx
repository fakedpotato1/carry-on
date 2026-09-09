import { LayoutDashboard, Menu, Waves, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

function DashboardLink({ onNavigate }) {
  return <NavLink to="/" end onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={18} aria-hidden="true" /><span>Dashboard</span></NavLink>
}

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="app-shell">
      <aside className="side-nav">
        <NavLink to="/" className="brand"><span className="brand-mark"><Waves size={22} aria-hidden="true" /></span><span><span className="brand-name">LoadShift</span><span className="brand-subtitle">Group work, made lighter</span></span></NavLink>
        <nav aria-label="Primary navigation"><div className="nav-group-label">Workspace</div><div className="nav-list"><DashboardLink /></div></nav>
      </aside>
      <div className="main-area">
        <header className="mobile-bar">
          <NavLink to="/" className="brand" style={{ padding: 0 }}><span className="brand-mark"><Waves size={20} aria-hidden="true" /></span><span className="brand-name">LoadShift</span></NavLink>
          <button className="icon-button" aria-expanded={menuOpen} aria-controls="mobile-primary-menu" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}</button>
        </header>
        {menuOpen && <nav id="mobile-primary-menu" className="mobile-menu" aria-label="Primary navigation"><DashboardLink onNavigate={() => setMenuOpen(false)} /></nav>}
        <main><Outlet /></main>
      </div>
    </div>
  )
}
