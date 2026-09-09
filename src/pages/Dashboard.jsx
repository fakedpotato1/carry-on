import { useState } from 'react'
import { AlertTriangle, ArrowRight, CalendarClock, CalendarDays, ChevronRight, Code2, FileText, FolderKanban, ImagePlus, Link2, MoreHorizontal, Plus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import { currentUser, dashboardOverview, team, upcoming } from '../data/mockData'
import { resolveCover, setStoredCover } from '../lib/covers'
import { getAllProjects } from '../lib/projectsStore'

const VISIBLE_MEMBERS = 4

function buildGreeting() {
  const now = new Date()
  const hour = now.getHours()
  const timeOfDay = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  return { timeOfDay, dateLabel: `${weekday}, ${now.getDate()} ${month} ${now.getFullYear()}` }
}

export default function Dashboard() {
  const projects = getAllProjects()
  const [covers, setCovers] = useState(() =>
    Object.fromEntries(projects.map((item) => [item.id, resolveCover(item)]).filter(([, url]) => url))
  )
  const [copiedId, setCopiedId] = useState(null)
  const { timeOfDay, dateLabel } = buildGreeting()

  const atRiskCount = projects.filter((item) => item.atRisk).length
  const projectsById = Object.fromEntries(projects.map((item) => [item.id, item]))

  const stats = [
    { key: 'active', label: 'Active Projects', value: projects.length, suffix: `/${dashboardOverview.totalProjectSlots}`, icon: FolderKanban, tone: 'sage' },
    { key: 'due', label: 'Due This Week', value: dashboardOverview.dueThisWeek, suffix: dashboardOverview.dueThisWeek === 1 ? 'project' : 'projects', icon: CalendarClock, tone: 'clay' },
    { key: 'risk', label: 'At Risk', value: atRiskCount, suffix: atRiskCount === 1 ? 'project' : 'projects', icon: AlertTriangle, tone: 'risk', chevron: true },
  ]

  function handleCoverChange(id, event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setCovers((prev) => ({ ...prev, [id]: dataUrl }))
      setStoredCover(id, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function handleCopyLink(id) {
    const link = `${window.location.origin}/project/${id}/canvas`
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).catch(() => {})
    setCopiedId(id)
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600)
  }

  return (
    <div className="page">
      <PageHeader eyebrow={dateLabel} title={`Good ${timeOfDay}, ${currentUser.name}`} actions={<Button to="/project/new" icon={Plus}>New Project</Button>} />

      <div className="stat-grid">
        {stats.map(({ key, label, value, suffix, icon: Icon, tone, chevron }) => (
          <Card key={key} className={`stat-card stat-card-${tone}`}>
            <span className="stat-icon"><Icon size={20} aria-hidden="true" /></span>
            <span className="stat-body">
              <span className="stat-label">{label}</span>
              <span className="stat-value"><strong>{value}</strong><span className="stat-suffix">{suffix}</span></span>
            </span>
            {chevron && <ChevronRight size={18} className="stat-chevron" aria-hidden="true" />}
          </Card>
        ))}
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <div>
            <h2 className="section-heading">Projects and assignments</h2>
            <p className="section-subcopy">Open a project canvas to review the plan, live work, evidence, and recovery actions in one place.</p>
          </div>

          <div className="project-list" style={{ marginTop: 22 }}>
            {projects.map((item) => {
              const visibleMembers = team.slice(0, VISIBLE_MEMBERS)
              const extraMembers = team.length - visibleMembers.length
              const cover = covers[item.id]
              return (
                <Card key={item.id} className="project-card">
                  <div className="project-card-content">
                    <div className="project-card-top">
                      <span className="assignment-icon">{item.type === 'Coding' ? <Code2 size={21} aria-hidden="true" /> : <FileText size={21} aria-hidden="true" />}</span>
                      <span className="project-type">{item.type} assignment</span>
                      <button type="button" className="icon-btn project-card-menu" aria-label={`More options for ${item.title}`}><MoreHorizontal size={18} aria-hidden="true" /></button>
                    </div>
                    <h2>{item.title}</h2>
                    <p className="muted">{item.module}</p>
                    <div className="project-meta-row">
                      <span className="meta-chip"><CalendarDays size={16} aria-hidden="true" />Due in {item.daysLeft} days</span>
                      <span className="meta-chip meta-chip-members">
                        <Users size={16} aria-hidden="true" />{team.length} members
                        <span className="avatar-stack">
                          {visibleMembers.map((member) => <Avatar key={member.id} initials={member.initials} photo={member.photo} size="sm" />)}
                          {extraMembers > 0 && <span className="avatar avatar-sm avatar-more">+{extraMembers}</span>}
                        </span>
                      </span>
                    </div>
                    <ProgressBar value={item.progress} label="Team progress" />
                    <p className="small muted">{item.daysLeft} days remaining · Activity signals are shown separately</p>
                    <div className="divider" />
                    <div className="project-card-actions">
                      <Button to={`/project/${item.id}/canvas`} variant="forest">Open Canvas <ArrowRight size={17} aria-hidden="true" /></Button>
                      <button type="button" className="icon-btn" aria-label={`Copy link to ${item.title}`} title={copiedId === item.id ? 'Link copied' : 'Copy link'} onClick={() => handleCopyLink(item.id)}><Link2 size={17} aria-hidden="true" /></button>
                    </div>
                  </div>
                  <label className="project-card-media" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
                    {!cover && <span className="project-card-media-placeholder"><ImagePlus size={22} aria-hidden="true" /><span>Upload cover image</span></span>}
                    <input type="file" accept="image/*" className="visually-hidden" onChange={(event) => handleCoverChange(item.id, event)} />
                  </label>
                </Card>
              )
            })}
          </div>
        </div>

        <aside className="upcoming-panel">
          <Card>
            <div className="upcoming-head">
              <h3 className="upcoming-title">Upcoming</h3>
              <Link to="/calendar" className="upcoming-viewall">View all <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
            <div className="upcoming-list">
              {upcoming.map((item) => (
                <Link key={`${item.projectId}-${item.title}`} to={`/project/${item.projectId}/canvas`} className="upcoming-item">
                  <span className="upcoming-icon"><CalendarDays size={16} aria-hidden="true" /></span>
                  <span>
                    <span className="upcoming-date">{item.date}</span>
                    <span className="upcoming-item-title">{item.title}</span>
                    <span className="upcoming-subtitle">{projectsById[item.projectId]?.title}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
