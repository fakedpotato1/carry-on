import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeftRight, Check, FileText, GitCommit, Info, MessageSquareText, Sparkles, X } from 'lucide-react'
import AIAdvisory from './AIAdvisory'
import Button from './Button'
import Modal from './Modal'
import StatusPill from './StatusPill'
import { team } from '../data/mockData'

export default function TaskPanel({ task, mode, dependencies, onClose, onUpdate, onRebalance }) {
  const [review, setReview] = useState('')
  const [comment, setComment] = useState('Strong synthesis. Please connect the regional study more clearly to our campus comparison.')
  const [aiResult, setAiResult] = useState(false)
  const [showShift, setShowShift] = useState(false)
  const [newOwner, setNewOwner] = useState('Clara Wong')
  const [confirmShift, setConfirmShift] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    setReview('')
    setAiResult(false)
    setShowShift(false)
    setConfirmShift(false)
    setAcknowledged(false)
  }, [task.id])

  const editable = mode === 'draft'
  const field = (label, key, type = 'text') => (
    <div><label className="label" htmlFor={`panel-${key}`}>{label}</label><input id={`panel-${key}`} className="field" type={type} value={task[key]} readOnly={!editable} onChange={(event) => onUpdate(key, type === 'number' ? Number(event.target.value) : event.target.value)} /></div>
  )

  return (
    <aside className="task-panel" aria-label={`${task.title} task details`}>
      <div className="task-panel-header"><div><span className="eyebrow">Task details</span><h2>{task.title}</h2></div><button className="icon-button" aria-label="Close task details" onClick={onClose}><X size={19} aria-hidden="true" /></button></div>
      <div className="task-panel-scroll">
        <section className="panel-section">
          <div className="section-head"><h3>Details</h3>{mode === 'active' && <StatusPill status={task.status} />}</div>
          <div className="panel-form">
            <div><label className="label" htmlFor="panel-owner">Owner</label><select id="panel-owner" className="field" value={task.owner} disabled={!editable} onChange={(event) => onUpdate('owner', event.target.value)}>{team.map((member) => <option key={member.id}>{member.name}</option>)}</select></div>
            {field('Deadline', 'deadline')}
            {field('Expected outcome', 'deliverable')}
            {field('Weight %', 'weight', 'number')}
            <div><span className="label">Dependencies</span><p className="panel-value">{dependencies.length ? dependencies.join(', ') : 'None'}</p></div>
          </div>
          {editable && task.suggested && <Button variant="secondary" icon={Check} onClick={() => onUpdate('suggested', false)}>Confirm this suggestion</Button>}
        </section>

        <section className="panel-section">
          <div className="section-head"><h3>Evidence</h3><FileText size={19} className="muted" aria-hidden="true" /></div>
          <div className="evidence-entry"><FileText size={17} aria-hidden="true" /><div><strong>Google Docs · Today, 10:42 AM</strong><p>Clara added two comments and linked a campus-zone chart relevant to this outcome.</p></div></div>
          <div className="evidence-entry"><GitCommit size={17} aria-hidden="true" /><div><strong>Connected activity signal</strong><p>Workspace events are factual signals, not proof of effort, quality, or intent.</p></div></div>
        </section>

        {task.status === 'Ready for Review' && <section className="panel-section">
          <div className="section-head"><h3>Cross-check</h3><MessageSquareText size={19} className="muted" aria-hidden="true" /></div>
          <fieldset className="review-controls"><legend className="label">Team review</legend><button type="button" className={review === 'Meets' ? 'selected' : ''} onClick={() => setReview('Meets')}>Meets</button><button type="button" className={review === 'Needs Revision' ? 'selected' : ''} onClick={() => setReview('Needs Revision')}>Needs revision</button></fieldset>
          <label className="label" htmlFor="review-comment">Reviewer comment</label><textarea id="review-comment" className="field" rows="3" value={comment} onChange={(event) => setComment(event.target.value)} />
          <div className="button-row panel-actions"><Button variant="secondary" icon={Sparkles} onClick={() => setAiResult(true)}>Ask AI to cross-check</Button><Button disabled={!review}>Save review</Button></div>
          {aiResult && <AIAdvisory title="Possible evidence gap"><p>Only one source directly addresses Southeast Asian campus conditions. Clara’s team review remains the decision.</p></AIAdvisory>}
        </section>}

        {task.status === 'Potential Risk' && <section className="panel-section risk-panel-section">
          <div className="section-head"><h3>Potential Contribution Risk</h3><AlertTriangle size={19} aria-hidden="true" /></div>
          <div className="notice notice-risk"><Info size={18} aria-hidden="true" /><div><strong>This is not a final judgment.</strong><p>Offline work or personal circumstances may not be visible.</p></div></div>
          <ul className="fact-list"><li>Outline checkpoint missed on 8 Sep.</li><li>Two supportive reminders received no response across 48 hours.</li><li>No expected document activity is visible.</li><li>The team offered help and a smaller first deliverable.</li></ul>
          {!showShift && <Button onClick={() => setShowShift(true)} icon={ArrowLeftRight}>Try Load Shift</Button>}
        </section>}

        {showShift && <section className="panel-section load-shift-inline">
          <div className="section-head"><div><span className="ai-label"><Sparkles size={15} />AI Suggested</span><h3>Redistribute urgent work</h3></div></div>
          <p><strong>Urgent task:</strong> {task.title}</p><p className="muted">The plan changes the active owner while keeping {task.owner} visible as the original owner.</p>
          <label className="label" htmlFor="new-owner">Proposed new owner</label><select id="new-owner" className="field" value={newOwner} onChange={(event) => setNewOwner(event.target.value)}>{team.filter((member) => member.name !== task.owner).map((member) => <option key={member.id}>{member.name}</option>)}</select>
          <div className="workload-compare"><div><span>Before</span><strong>{newOwner.split(' ')[0]} · 64%</strong></div><ArrowLeftRight size={18} aria-hidden="true" /><div><span>After</span><strong>{newOwner.split(' ')[0]} · 76%</strong></div></div>
          <Button onClick={() => setConfirmShift(true)}>Review and confirm</Button>
        </section>}
      </div>
      <Modal open={confirmShift} title="Confirm this Load Shift?" onClose={() => setConfirmShift(false)} actions={<><Button variant="secondary" onClick={() => setConfirmShift(false)}>Keep editing</Button><Button disabled={!acknowledged} icon={Check} onClick={() => { onRebalance(newOwner); setConfirmShift(false); setShowShift(false) }}>Confirm redistribution</Button></>}>
        <p>This makes {newOwner} the active owner. {task.owner} remains visible as the original owner, and the confirmation is added to the task history.</p>
        <label className="check-line"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>I reviewed the before/after workload and confirm this revised responsibility.</span></label>
      </Modal>
    </aside>
  )
}
