import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  Background, Controls, MarkerType, MiniMap, ReactFlow, addEdge, reconnectEdge,
  useEdgesState, useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  AlertTriangle, ArrowUpRight, Calendar, CalendarClock, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronUp,
  Code2, Download, FileCheck2, FileText, FolderOpen, Github, ImagePlus, Mail, Plus, Sparkles, Table, Trash2, UserPlus, X,
} from 'lucide-react'
import AIAdvisory from '../components/AIAdvisory'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Card from '../components/Card'
import Modal from '../components/Modal'
import StatusPill from '../components/StatusPill'
import TaskNode from '../components/TaskNode'
import TaskPanel from '../components/TaskPanel'
import { currentUser, initialTasks, project, projects, taskDependencies, team } from '../data/mockData'
import { resolveCover, setStoredCover } from '../lib/covers'

const nodeTypes = { task: TaskNode }
const ownerColumns = team.map((member) => member.name)
const ownerX = Object.fromEntries(ownerColumns.map((owner, index) => [owner, index * 340]))

const STATUS_OPTIONS = ['On Track', 'Needs Attention', 'At Risk', 'Completed']
const DOC_META = {
  pdf: { icon: FileText, bg: '#fbdcd6', color: '#c94a37' },
  doc: { icon: FileText, bg: '#dce7fb', color: '#2f5aa8' },
  sheet: { icon: Table, bg: '#dcf0df', color: '#2f8a4e' },
  drive: { icon: FolderOpen, bg: '#fdecc8', color: '#a4513c' },
  code: { icon: Github, bg: '#e5e5e0', color: '#26352e' },
}

function inferDocType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'doc'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet'
  return 'doc'
}

const makeNodes = (mode) => {
  const ownerCounts = {}
  return initialTasks.map((task) => {
    const row = ownerCounts[task.owner] || 0
    ownerCounts[task.owner] = row + 1
    return {
      id: task.id,
      type: 'task',
      position: { x: ownerX[task.owner], y: 76 + row * 245 },
      data: { task: { ...task, suggested: mode === 'draft' }, mode },
    }
  })
}

function edgePresentation(status, mode) {
  if (mode === 'draft') return { style: { stroke: '#688876', strokeWidth: 2, strokeDasharray: '7 7' }, className: '' }
  if (status === 'Completed') return { style: { stroke: '#345B49', strokeWidth: 2.2 }, className: '' }
  if (status === 'In Progress' || status === 'Due Soon' || status === 'Ready for Review') return { style: { stroke: '#688876', strokeWidth: 2.2, strokeDasharray: '8 7' }, className: 'edge-flowing' }
  if (status === 'Blocked' || status === 'Overdue') return { style: { stroke: '#825445', strokeWidth: 2, opacity: .4 }, className: '' }
  if (status === 'Rebalanced') return { style: { stroke: '#3F6554', strokeWidth: 2.2 }, className: '' }
  return { style: { stroke: '#D9E0D7', strokeWidth: 2 }, className: '' }
}

const makeEdges = (nodes, mode) => taskDependencies.map(([source, target], index) => {
  const targetStatus = nodes.find((node) => node.id === target)?.data.task.status
  return {
    id: `dependency-${index}`,
    source,
    target,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: mode === 'draft' ? '#688876' : '#8DA098' },
    ...edgePresentation(targetStatus, mode),
  }
})

export default function ProjectCanvas() {
  const { id = project.id } = useParams()
  const location = useLocation()
  const currentProject = useMemo(() => projects.find((item) => item.id === id) || project, [id])

  const [mode, setMode] = useState(location.state?.mode === 'draft' ? 'draft' : 'active')
  const firstNodes = useMemo(() => makeNodes(location.state?.mode === 'draft' ? 'draft' : 'active'), [])
  const [nodes, setNodes, onNodesChange] = useNodesState(firstNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges(firstNodes, mode))
  const [selectedId, setSelectedId] = useState(null)
  const [legendOpen, setLegendOpen] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState('')

  const [cover, setCover] = useState(() => resolveCover(currentProject))
  const [tags, setTags] = useState(currentProject.tags || [])
  const [addingTag, setAddingTag] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const [status, setStatus] = useState(currentProject.atRisk ? 'Needs Attention' : currentProject.progress >= 100 ? 'Completed' : 'On Track')
  const [documents, setDocuments] = useState(currentProject.documents || [])
  const [docsExpanded, setDocsExpanded] = useState(false)

  useEffect(() => {
    setCover(resolveCover(currentProject))
    setTags(currentProject.tags || [])
    setStatus(currentProject.atRisk ? 'Needs Attention' : currentProject.progress >= 100 ? 'Completed' : 'On Track')
    setDocuments(currentProject.documents || [])
    setDocsExpanded(false)
  }, [currentProject])

  const selectedNode = nodes.find((node) => node.id === selectedId)
  const selectedTask = selectedNode?.data.task
  const unconfirmed = nodes.filter((node) => node.data.task.suggested).length

  useEffect(() => {
    setEdges((current) => current.map((edge) => {
      const targetStatus = nodes.find((node) => node.id === edge.target)?.data.task.status
      return { ...edge, ...edgePresentation(targetStatus, mode) }
    }))
  }, [mode, nodes, setEdges])

  const onConnect = useCallback((connection) => setEdges((current) => addEdge({ ...connection, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, ...edgePresentation('Not Started', mode) }, current)), [mode, setEdges])
  const onReconnect = useCallback((oldEdge, connection) => setEdges((current) => reconnectEdge(oldEdge, connection, current)), [setEdges])

  const updateTask = useCallback((taskId, key, value) => {
    setNodes((current) => current.map((node) => node.id === taskId ? {
      ...node,
      data: { ...node.data, task: { ...node.data.task, [key]: value, suggested: key === 'suggested' ? value : false } },
    } : node))
  }, [setNodes])

  const addTask = () => {
    const taskId = `task-${Date.now()}`
    setNodes((current) => [...current, {
      id: taskId, type: 'task', position: { x: 0, y: 76 + current.length * 36 },
      data: { mode, task: { id: taskId, title: 'New task', owner: ownerColumns[0], deadline: '15 Sep', deliverable: 'Define the expected outcome', weight: 10, status: 'Not Started', suggested: true } },
    }])
    setSelectedId(taskId)
  }

  const deleteTask = (taskId) => {
    setNodes((current) => current.filter((node) => node.id !== taskId))
    setEdges((current) => current.filter((edge) => edge.source !== taskId && edge.target !== taskId))
    setSelectedId(null)
  }

  const handleDragStop = (_, node) => {
    if (mode !== 'draft') return
    const columnIndex = Math.max(0, Math.min(ownerColumns.length - 1, Math.round(node.position.x / 340)))
    updateTask(node.id, 'owner', ownerColumns[columnIndex])
  }

  const activatePlan = () => {
    setMode('active')
    setNodes((current) => current.map((node) => ({ ...node, data: { ...node.data, mode: 'active', task: { ...node.data.task, suggested: false } } })))
    setConfirmOpen(false)
    setToast('Plan confirmed. The canvas is now active.')
  }

  const rebalance = (newOwner) => {
    if (!selectedTask) return
    setNodes((current) => current.map((node) => node.id === selectedId ? {
      ...node,
      data: { ...node.data, task: { ...node.data.task, originalOwner: node.data.task.originalOwner || node.data.task.owner, owner: newOwner, status: 'Rebalanced' } },
    } : node))
    setToast(`Load Shift confirmed. Original ownership remains in ${selectedTask.title} history.`)
  }

  const dependencies = selectedId ? edges.filter((edge) => edge.target === selectedId).map((edge) => nodes.find((node) => node.id === edge.source)?.data.task.title).filter(Boolean) : []

  function handleCoverChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setCover(dataUrl)
      setStoredCover(currentProject.id, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function handleAddTag(event) {
    event.preventDefault()
    const value = tagDraft.trim()
    if (value) setTags((prev) => [...prev, value])
    setTagDraft('')
    setAddingTag(false)
  }

  function removeTag(tag) {
    setTags((prev) => prev.filter((item) => item !== tag))
  }

  function handleDocUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setDocuments((prev) => [{ type: inferDocType(file.name), name: file.name, author: currentUser.name, date: 'Just now' }, ...prev])
    setDocsExpanded(true)
  }

  function handleExportInfo() {
    const payload = { ...currentProject, tags, status, documents, team }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${currentProject.id}-project-info.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function scrollToMindmap(event) {
    event.preventDefault()
    document.getElementById('project-mindmap')?.scrollIntoView({ behavior: 'smooth' })
  }

  const visibleDocs = docsExpanded ? documents : documents.slice(0, 4)

  return (
    <div className="canvas-page">
      <div className="canvas-overview">
        <nav className="canvas-breadcrumb" aria-label="Breadcrumb">
          <Link to="/projects">Projects</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span>{currentProject.title}</span>
        </nav>

        <div className="canvas-hero">
          <label className="canvas-cover" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
            {!cover && <span className="project-card-media-placeholder"><ImagePlus size={20} aria-hidden="true" /><span>Upload cover image</span></span>}
            {cover && <span className="all-project-scrim" aria-hidden="true" />}
            {currentProject.tagline && <span className="canvas-cover-tagline">{currentProject.tagline}</span>}
            <span className="canvas-cover-change"><ImagePlus size={14} aria-hidden="true" />Change Cover</span>
            <input type="file" accept="image/*" className="visually-hidden" onChange={handleCoverChange} />
          </label>

          <div className="canvas-hero-content">
            <div className="canvas-hero-main">
              <div className="canvas-hero-badges">
                <span className="pill pill-neutral">{currentProject.type === 'Coding' ? <Code2 size={13} aria-hidden="true" /> : <FileText size={13} aria-hidden="true" />}{currentProject.type} assignment</span>
                <span className={`mode-badge mode-${mode}`}>{mode === 'draft' ? <Sparkles size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}{mode === 'draft' ? 'Draft plan' : 'Active project'}</span>
              </div>
              <h1>{currentProject.title}</h1>
              <p className="muted">{currentProject.module}</p>
            </div>

            <div className="canvas-hero-dates">
              <div className="canvas-date-block">
                <span className="canvas-date-icon"><Calendar size={16} aria-hidden="true" /></span>
                <span><span className="canvas-date-label">Start Date</span><strong>{currentProject.startDate}</strong></span>
              </div>
              <div className="canvas-date-block">
                <span className="canvas-date-icon canvas-date-icon-risk"><CalendarClock size={16} aria-hidden="true" /></span>
                <span>
                  <span className="canvas-date-label">Final Deadline</span>
                  <strong className="canvas-date-risk-text">{currentProject.deadline.split(',')[0]}</strong>
                  <span className="canvas-date-sub">({currentProject.daysLeft} days left)</span>
                </span>
              </div>
              <div className="canvas-date-block">
                <span className={`canvas-date-icon ${status === 'On Track' || status === 'Completed' ? 'canvas-date-icon-ok' : 'canvas-date-icon-risk'}`}>
                  {status === 'On Track' || status === 'Completed' ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
                </span>
                <span>
                  <span className="canvas-date-label">Status</span>
                  <select className="canvas-status-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Project status">
                    {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="canvas-tags-row">
          {tags.map((tag) => (
            <span key={tag} className="canvas-tag">{tag}<button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}><X size={12} aria-hidden="true" /></button></span>
          ))}
          {addingTag ? (
            <form onSubmit={handleAddTag}>
              <input autoFocus className="canvas-tag-input" value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onBlur={handleAddTag} placeholder="New tag" />
            </form>
          ) : (
            <button type="button" className="canvas-tag canvas-tag-add" onClick={() => setAddingTag(true)}><Plus size={13} aria-hidden="true" />Add tag</button>
          )}
        </div>

        <div className="canvas-info-grid">
          <Card className="canvas-info-card">
            <div className="section-head">
              <h3>Team Members ({team.length})</h3>
              <button type="button" className="btn btn-secondary" style={{ minHeight: 34, padding: '6px 12px', fontSize: 13 }}><UserPlus size={14} aria-hidden="true" />Invite</button>
            </div>
            <div className="canvas-team-grid">
              {team.map((member) => (
                <div key={member.id} className="canvas-team-member">
                  <Avatar initials={member.initials} photo={member.photo} size="lg" />
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="canvas-info-card">
            <div className="section-head">
              <h3>Documents ({documents.length})</h3>
              {documents.length > 4 && <button type="button" className="upcoming-viewall" onClick={() => setDocsExpanded((value) => !value)}>{docsExpanded ? 'Show less' : 'View all'} <ChevronDown size={14} aria-hidden="true" /></button>}
            </div>
            <div className="canvas-doc-list">
              {visibleDocs.map((doc, index) => {
                const meta = DOC_META[doc.type] || DOC_META.doc
                const Icon = meta.icon
                return (
                  <div key={index} className="canvas-doc-row">
                    <span className="doc-chip" style={{ background: meta.bg, color: meta.color }}><Icon size={18} aria-hidden="true" /></span>
                    <span><strong>{doc.name}</strong>{(doc.author || doc.date) && <span>{[doc.author, doc.date].filter(Boolean).join(' · ')}</span>}</span>
                  </div>
                )
              })}
            </div>
            <label className="btn btn-secondary canvas-upload-btn"><Plus size={16} aria-hidden="true" />Upload Document<input type="file" className="visually-hidden" onChange={handleDocUpload} /></label>
          </Card>

          <Card className="canvas-info-card">
            <h3>Quick Actions</h3>
            <div className="canvas-quick-actions">
              <Link to={`/project/${id}/lecturer-email`} className="canvas-quick-action"><Mail size={20} aria-hidden="true" />Draft Lecturer Email</Link>
              <Link to={`/project/${id}/evidence`} className="canvas-quick-action"><FileText size={20} aria-hidden="true" />Evidence Pack</Link>
              <Link to={`/project/${id}/rubric-evaluation`} className="canvas-quick-action"><FileCheck2 size={20} aria-hidden="true" />Rubric Evaluation</Link>
              <button type="button" className="canvas-quick-action" onClick={handleExportInfo}><Download size={20} aria-hidden="true" />Export Project Info</button>
            </div>
          </Card>
        </div>
      </div>

      {mode === 'draft' && <AIAdvisory className="canvas-advisory" label="AI Suggested" title="Drafted from the assignment brief and rubric"><p>These tasks balance rubric weight and dependencies. People decide: review each suggestion, then explicitly confirm the plan.</p></AIAdvisory>}

      {mode === 'draft' && <div className="canvas-actions">
        <div className="button-row"><Button variant="secondary" icon={Plus} onClick={addTask}>Add task</Button>{mode === 'draft' && selectedId && <Button variant="clay" icon={Trash2} onClick={() => deleteTask(selectedId)}>Delete selected</Button>}</div>
        {mode === 'draft' && <div className="confirm-plan-wrap"><span>{unconfirmed} AI suggestion{unconfirmed === 1 ? '' : 's'} remaining</span><Button onClick={() => setConfirmOpen(true)}>Confirm Plan</Button></div>}
      </div>}

      <div className="canvas-mindmap-head" id="project-mindmap">
        <h2 className="section-heading">Project Mindmap</h2>
        <p className="section-subcopy">{mode === 'draft' ? 'Shape the AI-suggested plan. Drag tasks between owner lanes, edit details, or redraw dependencies.' : 'Map out your tasks, dependencies, and progress. Click on a task to view details or update status.'}</p>
      </div>

      <section className="flow-shell" aria-label={`${mode} project task canvas`}>
        {mode === 'draft' && <div className="owner-lanes" aria-hidden="true">{ownerColumns.map((owner) => <span key={owner}>{owner}</span>)}</div>}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          onNodeDragStop={handleDragStop}
          onPaneClick={() => setSelectedId(null)}
          nodesDraggable={mode === 'draft'}
          nodesConnectable={mode === 'draft'}
          edgesReconnectable={mode === 'draft'}
          edgesFocusable
          deleteKeyCode={mode === 'draft' ? ['Backspace', 'Delete'] : null}
          fitView
          fitViewOptions={{ padding: .18, minZoom: .55 }}
          minZoom={.5}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#CAD4CC" gap={22} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable nodeColor={(node) => node.data.task.status === 'Potential Risk' ? '#F3E8D3' : '#E6EEE8'} />
        </ReactFlow>
        <div className={`canvas-legend ${legendOpen ? 'open' : ''}`}>
          <button type="button" onClick={() => setLegendOpen(!legendOpen)} aria-expanded={legendOpen}>{legendOpen ? <ChevronDown size={17} /> : <ChevronUp size={17} />}Status legend</button>
          {legendOpen && <div>{['Not Started', 'In Progress', 'Ready for Review', 'Completed', 'Due Soon', 'Blocked', 'Potential Risk', 'Rebalanced'].map((statusOption) => <StatusPill key={statusOption} status={statusOption} />)}</div>}
        </div>
      </section>

      {selectedTask && <TaskPanel task={selectedTask} mode={mode} dependencies={dependencies} onClose={() => setSelectedId(null)} onUpdate={(key, value) => updateTask(selectedId, key, value)} onRebalance={rebalance} />}

      <Modal open={confirmOpen} title="Confirm and activate this plan?" onClose={() => setConfirmOpen(false)} actions={<><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Keep editing</Button><Button icon={Check} onClick={activatePlan}>Confirm and activate</Button></>}>
        <p>This locks task editing and turns the same canvas into the live project view. Current owners, outcomes, dependencies, and node positions will remain visible.</p>
        {unconfirmed > 0 && <div className="notice notice-attention"><div><strong>{unconfirmed} AI suggestion{unconfirmed === 1 ? '' : 's'} will be team-confirmed.</strong><p>Confirm only after the team has reviewed these responsibilities.</p></div></div>}
      </Modal>
      {toast && <div className="toast" role="status"><Check size={18} aria-hidden="true" />{toast}</div>}
    </div>
  )
}
