import { useState } from 'react'
import { Code2, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Stepper, { Step } from '../components/Stepper'
import { setStoredUser } from '../lib/authStore'
import { computeDaysLeft, formatDeadline, formatToday } from '../lib/projectFormat'
import { makeProjectId, saveCustomProject } from '../lib/projectsStore'

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
      deadline: formatDeadline(deadline),
      daysLeft: computeDaysLeft(deadline),
      progress: 0,
      atRisk: false,
      description: projectBrief.trim() ? projectBrief.trim().split('\n')[0].slice(0, 220) : '',
      startDate: formatToday(),
      tags: [],
      documents: [],
    })

    navigate(`/project/${id}/canvas`, { state: { mode: 'draft' } })
  }

  return (
    <div className="page signup-page">
      <div className="page-narrow">
        <div className="signup-head">
          <h1 className="page-title">Create your LoadShift account</h1>
          <p className="page-description">A few quick steps: who you are, your login, and your first project.</p>
        </div>

        <Stepper
          initialStep={1}
          onFinalStepCompleted={handleFinish}
          backButtonText="Back"
          nextButtonText="Next"
          disableStepIndicators
          validateStep={validateStep}
        >
          <Step>
            <h2>What&rsquo;s your name?</h2>
            <p className="step-subcopy">This is how your team will see you across LoadShift.</p>
            <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoFocus />
          </Step>

          <Step>
            <h2>Create your account</h2>
            <p className="step-subcopy">Pick a username and password. This is a prototype — nothing is sent anywhere, and your password is never saved.</p>
            <input className="field" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" style={{ marginBottom: 10 }} />
            <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          </Step>

          <Step>
            <h2>Create your first project</h2>
            <p className="step-subcopy">Set up a group project so there&rsquo;s something waiting for you right away.</p>
            <input className="field" value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="Project title" style={{ marginBottom: 10 }} />
            <input className="field" value={projectModule} onChange={(event) => setProjectModule(event.target.value)} placeholder="Module / course code" style={{ marginBottom: 10 }} />
            <div className="choice-grid compact-choices" style={{ marginBottom: 10 }}>
              <button type="button" className={`choice-card ${projectType === 'Report' ? 'selected' : ''}`} aria-pressed={projectType === 'Report'} onClick={() => setProjectType('Report')}>
                <FileText size={18} aria-hidden="true" /><strong>Report</strong>
              </button>
              <button type="button" className={`choice-card ${projectType === 'Coding' ? 'selected' : ''}`} aria-pressed={projectType === 'Coding'} onClick={() => setProjectType('Coding')}>
                <Code2 size={18} aria-hidden="true" /><strong>Coding</strong>
              </button>
            </div>
            <label className="label" htmlFor="signup-deadline">Deadline</label>
            <input className="field" id="signup-deadline" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} style={{ marginBottom: 10 }} />
            <textarea className="field" rows="3" value={projectBrief} onChange={(event) => setProjectBrief(event.target.value)} placeholder="What's this project about? (optional)" />
          </Step>
        </Stepper>
      </div>
    </div>
  )
}
