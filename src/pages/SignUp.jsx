import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Code2,
  FileText,
  Lock,
  Mail,
  Plus,
  User,
  Waves,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Stepper, { Step } from '../components/Stepper'
import { setStoredUser } from '../lib/authStore'
import { computeDaysLeft, formatDeadline, formatToday } from '../lib/projectFormat'
import { makeProjectId, saveCustomProject } from '../lib/projectsStore'

const PROJECT_COLORS = ['#345b49', '#a9c9ac', '#8fb4dd', '#e69aa0', '#c6b3ea', '#f0c274']
const TEAM_ROLES = ['Project Lead', 'Member']

function emptyMember(role = 'Member') {
  return { name: '', email: '', role }
}

export default function SignUp() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [projectType, setProjectType] = useState('Report')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectModule, setProjectModule] = useState('')
  const [projectBrief, setProjectBrief] = useState('')
  const [deadline, setDeadline] = useState('2026-09-18T23:59')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [teamMembers, setTeamMembers] = useState([emptyMember('Project Lead')])

  function updateMember(index, patch) {
    setTeamMembers((current) => current.map((member, i) => (i === index ? { ...member, ...patch } : member)))
  }

  function addMemberRow() {
    setTeamMembers((current) => [...current, emptyMember()])
  }

  function removeMemberRow(index) {
    setTeamMembers((current) => current.filter((_, i) => i !== index))
  }

  function validateStep(step) {
    if (step === 1) return name.trim().length > 0
    if (step === 2) return username.trim().length > 0 && password.trim().length > 0
    if (step === 3) return projectTitle.trim().length > 0
    return true
  }

  function handleFinish() {
    setStoredUser({ name: name.trim(), username: username.trim() })

    const id = makeProjectId(projectTitle)
    saveCustomProject({
      id,
      title: projectTitle.trim(),
      module: projectModule.trim(),
      type: projectType,
      color,
      deadline: formatDeadline(deadline),
      daysLeft: computeDaysLeft(deadline),
      progress: 0,
      atRisk: false,
      description: projectBrief.trim() ? projectBrief.trim().split('\n')[0].slice(0, 220) : '',
      startDate: formatToday(),
      tags: [],
      documents: [],
      teamInvites: teamMembers.filter((member) => member.name.trim()),
    })

    navigate(`/project/${id}/canvas`, { state: { mode: 'draft' } })
  }

  return (
    <div className="signup-shell">
      <div className="signup-decor" aria-hidden="true">
        <div className="signup-photo">
          <div className="signup-photo-frame" />
          <span className="signup-photo-caption">Smaller steps,<br />brighter tomorrows ♡</span>
        </div>
        <span className="signup-sticky signup-sticky-1">Good<br />projects<br />brighter<br />people ♡</span>
        <span className="signup-sticky signup-sticky-2">Plan<br />Collaborate<br />Create<br />Grow</span>
      </div>

      <header className="signup-topnav">
        <Link to="/" className="signup-brand">
          <span className="signup-brand-mark"><Waves size={22} aria-hidden="true" /></span>
          <span className="signup-brand-text">
            <strong>LoadShift</strong>
            <small>Group work, made lighter</small>
          </span>
        </Link>
        <div className="signup-topnav-actions">
          <span>Already have an account?</span>
          <Link to="/dashboard" className="signup-login-btn">Log in</Link>
        </div>
      </header>

      <div className="signup-card-wrap">
        <Stepper
          initialStep={1}
          onFinalStepCompleted={handleFinish}
          backButtonText="Back"
          nextButtonText="Next"
          completeButtonText="Create Project"
          backIcon={ArrowLeft}
          forwardIcon={ArrowRight}
          disableStepIndicators
          validateStep={validateStep}
          stepCircleContainerClassName="signup-step-card"
        >
          <Step>
            <div className="signup-head-copy">
              <h2>What&rsquo;s your name?</h2>
              <p className="step-subcopy">This is how your team will see you across LoadShift.</p>
            </div>
            <div className="field-group field-icon">
              <User size={17} className="field-icon-glyph" aria-hidden="true" />
              <input className="field field-has-icon" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoFocus />
            </div>
          </Step>

          <Step>
            <div className="signup-head-copy">
              <h2>Create your account</h2>
              <p className="step-subcopy">Pick a username and password. This is a prototype — nothing is sent anywhere, and your password is never saved.</p>
            </div>
            <div className="field-group field-icon">
              <User size={17} className="field-icon-glyph" aria-hidden="true" />
              <input className="field field-has-icon" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
            </div>
            <div className="field-icon">
              <Lock size={17} className="field-icon-glyph" aria-hidden="true" />
              <input className="field field-has-icon" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
            </div>
          </Step>

          <Step>
            <div className="signup-head-copy">
              <h2>Create your first project</h2>
              <p className="step-subcopy">Start a group project so there&rsquo;s something waiting for you right away.</p>
            </div>

            <div className="field-group">
              <label className="label" htmlFor="signup-project-title">Project title</label>
              <div className="field-icon">
                <FileText size={17} className="field-icon-glyph" aria-hidden="true" />
                <input id="signup-project-title" className="field field-has-icon" value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="e.g. Urban Heat & Student Wellbeing" />
              </div>
            </div>

            <div className="field-group signup-row-2">
              <div>
                <label className="label" htmlFor="signup-module">Module / course code</label>
                <div className="field-icon">
                  <BookOpen size={17} className="field-icon-glyph" aria-hidden="true" />
                  <input id="signup-module" className="field field-has-icon" value={projectModule} onChange={(event) => setProjectModule(event.target.value)} placeholder="e.g. ENV2104" />
                </div>
              </div>
              <div>
                <label className="label">Project type</label>
                <div className="signup-type-toggle">
                  <button type="button" className={`type-pill ${projectType === 'Report' ? 'selected' : ''}`} aria-pressed={projectType === 'Report'} onClick={() => setProjectType('Report')}>
                    <FileText size={15} aria-hidden="true" /> Report
                  </button>
                  <button type="button" className={`type-pill ${projectType === 'Coding' ? 'selected' : ''}`} aria-pressed={projectType === 'Coding'} onClick={() => setProjectType('Coding')}>
                    <Code2 size={15} aria-hidden="true" /> Coding
                  </button>
                </div>
              </div>
            </div>

            <div className="field-group signup-row-2">
              <div>
                <label className="label" htmlFor="signup-deadline">Deadline</label>
                <div className="field-icon">
                  <Calendar size={17} className="field-icon-glyph" aria-hidden="true" />
                  <input id="signup-deadline" className="field field-has-icon" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Project colour</label>
                <div className="color-swatch-row">
                  {PROJECT_COLORS.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      className={`color-swatch ${color === swatch ? 'selected' : ''}`}
                      style={{ background: swatch }}
                      aria-pressed={color === swatch}
                      aria-label={`Use this colour for the project`}
                      onClick={() => setColor(swatch)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="field-group">
              <div className="signup-field-head">
                <label className="label" htmlFor="signup-brief">Project description (optional)</label>
                <span className="char-count">{projectBrief.length}/300</span>
              </div>
              <textarea id="signup-brief" className="field" rows="3" maxLength={300} value={projectBrief} onChange={(event) => setProjectBrief(event.target.value)} placeholder="What's this project about?" />
            </div>

            <div className="signup-team-block">
              <label className="label">Add your team members</label>
              <p className="step-subcopy">Invite your teammates now or add them later.</p>
              <div className="team-rows">
                {teamMembers.map((member, index) => (
                  <div className="team-row" key={index}>
                    <div className="field-icon">
                      <User size={15} className="field-icon-glyph" aria-hidden="true" />
                      <input className="field field-has-icon" value={member.name} onChange={(event) => updateMember(index, { name: event.target.value })} placeholder="Name" />
                    </div>
                    <div className="field-icon">
                      <Mail size={15} className="field-icon-glyph" aria-hidden="true" />
                      <input className="field field-has-icon" value={member.email} onChange={(event) => updateMember(index, { email: event.target.value })} placeholder="Email (optional)" type="email" />
                    </div>
                    <select className="field team-role-select" value={member.role} onChange={(event) => updateMember(index, { role: event.target.value })}>
                      {TEAM_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <button type="button" className="team-row-remove" aria-label="Remove teammate" onClick={() => removeMemberRow(index)}>
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="team-add-btn" onClick={addMemberRow}>
                <Plus size={16} aria-hidden="true" /> Add another member
              </button>
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  )
}
