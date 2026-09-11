import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, CalendarDays, CheckCheck, CheckCircle2, Code2, FileText, FolderOpen, FolderPlus, Github, ImagePlus, Plus, LayoutGrid, Table } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Card from '../components/Card'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import ProjectCardMenu from '../components/ProjectCardMenu'
import { team } from '../data/mockData'
import { resolveCover, setStoredCover } from '../lib/covers'
import { deleteProject, getAllProjects, PROJECTS_CHANGED_EVENT } from '../lib/projectsStore'

const FILTERS = [
  { key: 'all', label: 'All Projects', icon: LayoutGrid, match: () => true },
  { key: 'active', label: 'Active', icon: CheckCircle2, match: (item) => !item.atRisk && item.progress < 100 },
  { key: 'at-risk', label: 'At Risk', icon: AlertTriangle, match: (item) => item.atRisk },
  { key: 'completed', label: 'Completed', icon: CheckCheck, match: (item) => item.progress >= 100 },
]

const DOC_META = {
  pdf: { icon: FileText, bg: '#fbdcd6', color: '#c94a37' },
  doc: { icon: FileText, bg: '#dce7fb', color: '#2f5aa8' },
  sheet: { icon: Table, bg: '#dcf0df', color: '#2f8a4e' },
  drive: { icon: FolderOpen, bg: '#fdecc8', color: '#a4513c' },
  code: { icon: Github, bg: '#e5e5e0', color: '#26352e' },
}

function ProjectCard({ item, cover, onCoverChange, onRequestDelete }) {
  const shortDate = item.deadline.split(',')[0]
  return (
    <Card className="all-project-card">
      <label className="all-project-media" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
        {!cover && <span className="project-card-media-placeholder"><ImagePlus size={22} aria-hidden="true" /><span>Upload cover image</span></span>}
        {cover && <span className="all-project-scrim" aria-hidden="true" />}
        {cover && item.tagline && <span className="all-project-tagline">{item.tagline}</span>}
        <input type="file" accept="image/*" className="visually-hidden" onChange={onCoverChange} />
      </label>

      <div className="all-project-body">
        <div className="project-card-top">
          <span className="assignment-icon">{item.type === 'Coding' ? <Code2 size={21} aria-hidden="true" /> : <FileText size={21} aria-hidden="true" />}</span>
          <span className="project-type">{item.type} assignment</span>
          <ProjectCardMenu label={item.title} onDelete={() => onRequestDelete(item)} />
        </div>

        <h2>{item.title}</h2>
        <p className="muted">{item.module}</p>
        {item.description && <p className="all-project-description">{item.description}</p>}

        <div className="all-project-meta-row">
          <span className={`status-pill ${item.atRisk ? 'status-risk' : 'status-ok'}`}>
            {item.atRisk ? <AlertTriangle size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
            {item.atRisk ? 'Needs Attention' : 'On Track'}
          </span>
          <span className="all-project-due">
            <CalendarDays size={15} aria-hidden="true" />
            <span className="all-project-due-text"><strong>Due in {item.daysLeft} days</strong><span>{shortDate}</span></span>
          </span>
          <span className="all-project-progress">
            <span className="mini-progress-track"><span className="mini-progress-fill" style={{ width: `${item.progress}%` }} /></span>
            <strong>{item.progress}%</strong>
          </span>
        </div>

        <div className="all-project-people-row">
          <div>
            <span className="all-project-subhead">Team ({team.length})</span>
            <div className="avatar-stack">
              {team.slice(0, 4).map((member) => <Avatar key={member.id} initials={member.initials} photo={member.photo} size="sm" />)}
              <button type="button" className="avatar avatar-sm avatar-add" aria-label="Add team member"><Plus size={13} aria-hidden="true" /></button>
            </div>
          </div>
          {item.documents && (
            <div>
              <span className="all-project-subhead">Documents ({item.documents.length})</span>
              <div className="doc-chip-row">
                {item.documents.slice(0, 4).map((doc, index) => {
                  const meta = DOC_META[doc.type] || DOC_META.doc
                  const Icon = meta.icon
                  return <span key={index} className="doc-chip" style={{ background: meta.bg, color: meta.color }} title={doc.name}><Icon size={15} aria-hidden="true" /></span>
                })}
                <button type="button" className="doc-chip doc-chip-add" aria-label="Add document"><Plus size={13} aria-hidden="true" /></button>
              </div>
            </div>
          )}
        </div>

        <div className="all-project-footer">
          <Button to={`/project/${item.id}/canvas`} variant="forest">Open Project <ArrowRight size={17} aria-hidden="true" /></Button>
        </div>
      </div>
    </Card>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState(() => getAllProjects())
  const [covers, setCovers] = useState(() =>
    Object.fromEntries(projects.map((item) => [item.id, resolveCover(item)]).filter(([, url]) => url))
  )
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    function refresh() { setProjects(getAllProjects()) }
    window.addEventListener(PROJECTS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PROJECTS_CHANGED_EVENT, refresh)
  }, [])

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

  function confirmDelete() {
    if (!pendingDelete) return
    deleteProject(pendingDelete.id)
    setProjects(getAllProjects())
    setPendingDelete(null)
  }

  const activeFilter = FILTERS.find((item) => item.key === filter) ?? FILTERS[0]
  const filtered = projects.filter(activeFilter.match)

  return (
    <div className="page">
      <PageHeader
        eyebrow="Projects"
        title="All Projects"
        description="Keep track of all your group projects, assignments and progress."
        actions={<Button to="/project/new" icon={Plus}>New Project</Button>}
      />

      <div className="project-filter-tabs">
        {FILTERS.map((item) => {
          const count = projects.filter(item.match).length
          const Icon = item.icon
          return (
            <button key={item.key} type="button" className={`filter-tab ${filter === item.key ? 'active' : ''}`} onClick={() => setFilter(item.key)}>
              <Icon size={15} aria-hidden="true" />{item.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="all-projects-grid">
        {filtered.map((item) => (
          <ProjectCard key={item.id} item={item} cover={covers[item.id]} onCoverChange={(event) => handleCoverChange(item.id, event)} onRequestDelete={setPendingDelete} />
        ))}

        {filter === 'all' && (
          <Link to="/project/new" className="card create-project-card">
            <span className="create-project-icon"><FolderPlus size={26} aria-hidden="true" /></span>
            <strong>Create a New Project</strong>
            <p className="muted small">Start a new group project and keep all your work, tasks, and team in one place.</p>
            <span className="btn btn-secondary" style={{ marginTop: 14 }}><Plus size={16} aria-hidden="true" />New Project</span>
          </Link>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="muted" style={{ marginTop: 8 }}>No projects match this filter yet.</p>
      )}

      <Modal
        open={!!pendingDelete}
        title="Delete this assignment?"
        onClose={() => setPendingDelete(null)}
        actions={<>
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button variant="primary" onClick={confirmDelete}>Delete assignment</Button>
        </>}
      >
        <p className="muted">
          {pendingDelete ? <>“{pendingDelete.title}” and its canvas, tasks, and evidence will be removed from Carry On. This can't be undone.</> : null}
        </p>
      </Modal>
    </div>
  )
}
