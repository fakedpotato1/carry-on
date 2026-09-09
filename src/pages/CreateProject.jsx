import { useEffect, useRef, useState } from 'react'
import { Check, Code2, FileText, Github, Link2, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import { briefText } from '../data/mockData'
import { makeProjectId, saveCustomProject } from '../lib/projectsStore'

function formatDeadline(value) {
  if (!value) return 'No deadline set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No deadline set'
  const datePart = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${datePart}, ${timePart}`
}

function computeDaysLeft(value) {
  if (!value) return 0
  const deadline = new Date(value)
  if (Number.isNaN(deadline.getTime())) return 0
  const diff = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 0)
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CreateProject() {
  const navigate = useNavigate()
  const [type, setType] = useState('Report')
  const [members, setMembers] = useState(['Aisha Rahman', 'Ben Lim', 'Clara Wong', 'Daniel Tan'])
  const [newMember, setNewMember] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const newProjectId = useRef(null)

  useEffect(() => {
    if (!loading) return undefined
    const steps = [
      setTimeout(() => setStep(1), 650),
      setTimeout(() => setStep(2), 1350),
      setTimeout(() => navigate(`/project/${newProjectId.current}/canvas`, { state: { mode: 'draft' } }), 2200),
    ]
    return () => steps.forEach(clearTimeout)
  }, [loading, navigate])

  const addMember = () => {
    if (!newMember.trim()) return
    setMembers((current) => [...current, newMember.trim()])
    setNewMember('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const form = event.target
    const title = form['project-name'].value.trim() || 'Untitled Project'
    const module = form['project-module'].value.trim()
    const brief = form['assignment-content'].value.trim()
    const deadlineValue = form['deadline'].value

    const id = makeProjectId(title)
    saveCustomProject({
      id,
      title,
      module,
      type,
      deadline: formatDeadline(deadlineValue),
      daysLeft: computeDaysLeft(deadlineValue),
      progress: 0,
      atRisk: false,
      description: brief ? brief.split('\n')[0].slice(0, 220) : '',
      startDate: formatToday(),
      tags: [],
      documents: [],
    })

    newProjectId.current = id
    setLoading(true)
  }

  if (loading) return <div className="page"><div className="page-narrow"><Card className="loading-panel" aria-live="polite"><div><div className="spinner" aria-hidden="true" /><h1 className="page-title" style={{ marginTop: 22 }}>Analyzing requirements</h1><p className="page-description">LoadShift is preparing an editable draft. Nothing becomes active without team confirmation.</p><div className="loading-steps">{['Reading the brief and rubric', 'Mapping outcomes and dependencies', 'Balancing suggested responsibilities'].map((label, index) => <div key={label} className={`loading-step ${step >= index ? 'done' : ''}`}>{step >= index ? <Check size={18} /> : <span className="loading-dot" />}{label}</div>)}</div></div></Card></div></div>

  return (
    <div className="page"><div className="page-narrow">
      <PageHeader eyebrow="New project" title="Create a group project" description="Add the assignment, team, and workspace in one place. The next screen is an editable AI-suggested canvas." />
      <Card>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-full"><label className="label" htmlFor="project-name">Project title</label><input className="field" id="project-name" name="project-name" placeholder="e.g. Urban Heat & Student Wellbeing" required /></div>
          <div className="form-full"><label className="label" htmlFor="project-module">Module / course code</label><input className="field" id="project-module" name="project-module" placeholder="e.g. ENV2104 · Research Methods" /></div>
          <div className="form-full"><label className="label" htmlFor="assignment-content">Assignment brief and rubric</label><textarea className="field" id="assignment-content" name="assignment-content" rows="8" defaultValue={`${briefText}\n\nRubric: Evidence 25% · Methodology 20% · Analysis 25% · Discussion 20% · Structure 10%`} required /></div>
          <div><label className="label" htmlFor="deadline">Final deadline</label><input className="field" id="deadline" name="deadline" type="datetime-local" defaultValue="2026-09-18T23:59" required /></div>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="label">Assignment type</legend><div className="choice-grid compact-choices"><button type="button" className={`choice-card ${type === 'Report' ? 'selected' : ''}`} aria-pressed={type === 'Report'} onClick={() => { setType('Report'); setConnected(false) }}><FileText size={21} aria-hidden="true" /><strong>Report</strong></button><button type="button" className={`choice-card ${type === 'Coding' ? 'selected' : ''}`} aria-pressed={type === 'Coding'} onClick={() => { setType('Coding'); setConnected(false) }}><Code2 size={21} aria-hidden="true" /><strong>Coding</strong></button></div></fieldset>

          <div className="form-full"><label className="label" htmlFor="member">Teammates</label><div className="button-row member-entry"><input className="field" id="member" value={newMember} onChange={(event) => setNewMember(event.target.value)} placeholder="Enter a teammate’s name" /><Button variant="secondary" type="button" icon={Plus} onClick={addMember}>Add</Button></div><div className="member-chips">{members.map((member) => <span key={member}>{member}<button type="button" aria-label={`Remove ${member}`} onClick={() => setMembers((current) => current.filter((name) => name !== member))}><Trash2 size={14} /></button></span>)}</div></div>

          <div className="form-full integration-card">
            <div className="integration-icon">{type === 'Coding' ? <Github size={22} aria-hidden="true" /> : <FileText size={22} aria-hidden="true" />}</div>
            <div><strong>Connect {type === 'Coding' ? 'GitHub' : 'Google Docs'}</strong><p>{type === 'Coding' ? 'Use mocked commits and pull requests as task evidence.' : 'Use mocked document edits and comments as task evidence.'} Activity remains a signal, not proof of effort or quality.</p></div>
            <Button type="button" variant={connected ? 'secondary' : 'primary'} icon={connected ? Check : Link2} onClick={() => setConnected(!connected)}>{connected ? 'Connected' : `Connect ${type === 'Coding' ? 'repository' : 'document'}`}</Button>
          </div>
          <div className="form-full button-row" style={{ justifyContent: 'space-between', marginTop: 4 }}><Button variant="secondary" to="/">Cancel</Button><Button type="submit" aria-busy={loading}>Analyze and create draft</Button></div>
        </form>
      </Card>
    </div></div>
  )
}
