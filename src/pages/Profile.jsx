import { FolderKanban, ShieldAlert, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import { currentUser, team } from '../data/mockData'
import { resolveCurrentUser } from '../lib/authStore'
import { getAllProjects } from '../lib/projectsStore'

function initialsOf(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Profile() {
  const user = resolveCurrentUser(currentUser)
  const projects = getAllProjects()
  const atRiskCount = projects.filter((item) => item.atRisk).length

  return (
    <div className="page page-narrow">
      <PageHeader eyebrow="Profile" title="Your account" description="Everything LoadShift knows about you and the teams you're working with." />

      <Card className="profile-header-card">
        <div className="profile-header-row">
          <Avatar initials={initialsOf(user.name)} size="xl" />
          <div>
            <h2>{user.name}</h2>
            <p className="muted">{user.role}</p>
          </div>
        </div>
      </Card>

      <div className="stat-grid" style={{ marginTop: 24 }}>
        <Card className="stat-card stat-card-sage">
          <span className="stat-icon"><FolderKanban size={20} aria-hidden="true" /></span>
          <span className="stat-body">
            <span className="stat-label">Active Projects</span>
            <span className="stat-value"><strong>{projects.length}</strong></span>
          </span>
        </Card>
        <Card className="stat-card stat-card-clay">
          <span className="stat-icon"><Users size={20} aria-hidden="true" /></span>
          <span className="stat-body">
            <span className="stat-label">Teammates</span>
            <span className="stat-value"><strong>{team.length}</strong></span>
          </span>
        </Card>
        <Card className={`stat-card ${atRiskCount ? 'stat-card-risk' : 'stat-card-sage'}`}>
          <span className="stat-icon"><ShieldAlert size={20} aria-hidden="true" /></span>
          <span className="stat-body">
            <span className="stat-label">At Risk</span>
            <span className="stat-value"><strong>{atRiskCount}</strong></span>
          </span>
        </Card>
      </div>

      <h2 className="section-heading" style={{ marginTop: 34 }}>Your projects</h2>
      <div className="stack" style={{ marginTop: 16 }}>
        {projects.map((item) => (
          <Link key={item.id} to={`/project/${item.id}/canvas`} className="card card-clickable">
            <div className="profile-project-row">
              <div>
                <strong>{item.title}</strong>
                <p className="muted small" style={{ margin: '4px 0 0' }}>{item.module}</p>
              </div>
              <span className="pill pill-neutral">{item.progress}% complete</span>
            </div>
            <ProgressBar value={item.progress} />
          </Link>
        ))}
      </div>
    </div>
  )
}
