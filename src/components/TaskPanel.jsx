import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeftRight, Check, ChevronDown, FileText, GitCommit, Info, MessageSquareText, Send, Sparkles, X } from 'lucide-react'
import AIAdvisory from './AIAdvisory'
import Button from './Button'
import Modal from './Modal'
import StatusPill from './StatusPill'
import { team } from '../data/mockData'

const USER_TASK_STATUSES = ['Not Started', 'In Progress', 'Ready for Review']

export default function TaskPanel({ task, mode, dependencies, lecturerEmailPath, rebalancePlan, onClose, onUpdate, onStartRebalance, onRejectRebalance, onAcceptRebalance }) {
  const [review, setReview] = useState('')
  const [comment, setComment] = useState('Strong synthesis. Please connect the regional study more clearly to our campus comparison.')
  const [aiResult, setAiResult] = useState(false)
  const [confirmShift, setConfirmShift] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  useEffect(() => {
    setReview('')
    setAiResult(false)
    setConfirmShift(false)
    setStatusMenuOpen(false)
  }, [task.id])

  const editable = mode === 'draft'
  const shiftCandidate = rebalancePlan?.candidates?.[rebalancePlan.candidateIndex]
  const field = (label, key, type = 'text') => (
    <div><label className="label" htmlFor={`panel-${key}`}>{label}</label><input id={`panel-${key}`} className="field" type={type} value={task[key]} readOnly={!editable} onChange={(event) => onUpdate(key, type === 'number' ? Number(event.target.value) : event.target.value)} /></div>
  )

  return (
    <aside className="task-panel" aria-label={`${task.title} task details`}>
      <div className="task-panel-header"><div><span className="eyebrow">Task details</span><h2>{task.title}</h2></div><button className="icon-button" aria-label="Close task details" onClick={onClose}><X size={19} aria-hidden="true" /></button></div>
      <div className="task-panel-scroll">
        <section className="panel-section">
          <div className="section-head">
            <h3>Details</h3>
            {mode === 'active' && (
              <div className="task-status-menu">
                <button type="button" className="task-status-trigger" aria-label={`Change task status. Current status: ${task.status}`} aria-haspopup="menu" aria-expanded={statusMenuOpen} onClick={() => setStatusMenuOpen((open) => !open)}>
                  <StatusPill status={task.status} />
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
                {statusMenuOpen && (
                  <div className="task-status-options" role="menu" aria-label="Task status choices">
                    {!USER_TASK_STATUSES.includes(task.status) && <p className="task-status-menu-note">{task.status} came from a supporting workflow. Choosing below returns the task to an ordinary progress stage.</p>}
                    {USER_TASK_STATUSES.map((status) => (
                      <button key={status} type="button" role="menuitemradio" className="task-status-option" aria-checked={task.status === status} onClick={() => { onUpdate('status', status); setStatusMenuOpen(false) }}>
                        <StatusPill status={status} />
                        {task.status === status && <Check size={16} aria-label="Selected" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="panel-form">
            <div><label className="label" htmlFor="panel-owner">Owner</label><select id="panel-owner" className="field" value={task.owner} disabled={!editable} onChange={(event) => onUpdate('owner', event.target.value)}>{team.map((member) => <option key={member.id}>{member.name}</option>)}</select></div>
            {field('Deadline', 'deadline')}
            {field('Expected outcome', 'deliverable')}
            {field('Weight %', 'weight', 'number')}
            <div><span className="label">Dependencies</span><p className="panel-value">{dependencies.length ? dependencies.join(', ') : 'None'}</p></div>
          </div>
          {task.rebalanceHistory && <div className="history-box"><strong>Responsibility history</strong><p>Originally assigned to {task.rebalanceHistory.originallyAssignedTo}</p><p>Reassigned to {task.rebalanceHistory.reassignedTo}</p><p>Accepted by {task.rebalanceHistory.confirmedBy} · {task.rebalanceHistory.confirmedAt}</p></div>}
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
          {!rebalancePlan && <Button onClick={() => onStartRebalance(task.id)} icon={Sparkles}>Ask AI to plan a task swap</Button>}
        </section>}

        {rebalancePlan?.status === 'pending' && shiftCandidate && <section className="panel-section load-shift-inline" aria-label="AI-selected task swap">
          <div className="section-head"><div><span className="ai-label"><Sparkles size={15} aria-hidden="true" />AI Suggested</span><h3>AI-selected task swap</h3></div><StatusPill status="Waiting for Response" /></div>
          <p className="muted">Carry On compared dependency impact, task weight, and current workload. The proposed recipient decides; no owner changes before acceptance.</p>
          <div className="ai-swap-reason">
            <strong>Why this task comes first</strong>
            <p>{rebalancePlan.criticalTaskTitle} currently holds up {rebalancePlan.blockedTaskIds.length} downstream task{rebalancePlan.blockedTaskIds.length === 1 ? '' : 's'}{rebalancePlan.blockedTaskTitles.length ? `: ${rebalancePlan.blockedTaskTitles.join(' and ')}` : ''}.</p>
            <p><strong>{shiftCandidate.recipient}</strong> is next because their {shiftCandidate.recipientRole.toLowerCase()} role, {shiftCandidate.skillMatches.length ? `${shiftCandidate.skillMatches.join(' and ')} experience,` : 'available capacity,'} and post-swap workload provide the strongest safe fit.</p>
          </div>
          <div className="ai-swap-pair" aria-label="Proposed two-way task swap">
            <article><span>Unblock the project</span><strong>{rebalancePlan.criticalTaskTitle}</strong><p>{rebalancePlan.riskOwner} <ArrowLeftRight size={14} aria-hidden="true" /> {shiftCandidate.recipient}</p><small>{rebalancePlan.criticalTaskWeight}% task weight</small></article>
            <article><span>Smaller standalone contribution</span><strong>{shiftCandidate.reliefTaskTitle}</strong><p>{shiftCandidate.recipient} <ArrowLeftRight size={14} aria-hidden="true" /> {rebalancePlan.riskOwner}</p><small>{shiftCandidate.reliefTaskWeight}% task weight · no dependencies</small></article>
          </div>
          <div className="ai-workload-grid" aria-label="Workload comparison after the proposed swap">
            <div><span>{shiftCandidate.recipient}</span><strong>{shiftCandidate.recipientWorkloadBefore}% → {shiftCandidate.recipientWorkloadAfter}%</strong></div>
            <div><span>{rebalancePlan.riskOwner}</span><strong>{shiftCandidate.riskOwnerWorkloadBefore}% → {shiftCandidate.riskOwnerWorkloadAfter}%</strong></div>
          </div>
          {rebalancePlan.rejectedBy.length > 0 && <p className="proposal-history"><strong>Earlier proposal declined:</strong> {rebalancePlan.rejectedBy.join(', ')}. No ownership changed.</p>}
          <div className="recipient-decision">
            <p><strong>{shiftCandidate.recipient}'s decision</strong><span>Only the proposed recipient can accept or reject this swap.</span></p>
            <div className="button-row"><Button variant="secondary" onClick={onRejectRebalance}>Reject</Button><Button icon={Check} onClick={() => setConfirmShift(true)}>Accept task swap</Button></div>
          </div>
        </section>}

        {rebalancePlan?.status === 'exhausted' && <section className="panel-section load-shift-inline load-shift-exhausted">
          <div className="section-head"><div><span className="ai-label"><Sparkles size={15} aria-hidden="true" />AI Advisory</span><h3>Lecturer review needed</h3></div></div>
          <p>No safe recipient accepted the task swap. Carry On has not changed any owner or forced extra work onto the team.</p>
          {rebalancePlan.rejectedBy.length > 0 && <p className="proposal-history"><strong>Declined by:</strong> {rebalancePlan.rejectedBy.join(', ')}</p>}
          <Button to={lecturerEmailPath} icon={Send}>Draft Lecturer Email</Button>
        </section>}

        {rebalancePlan?.status === 'accepted' && <section className="panel-section load-shift-confirmed">
          <div className="section-head"><div><span className="confirmed-label"><Check size={15} aria-hidden="true" />Confirmed by recipient</span><h3>Task swap accepted</h3></div><StatusPill status="Rebalanced" /></div>
          <p><strong>{rebalancePlan.acceptedBy}</strong> accepted the AI-selected swap. Both tasks changed together, and both original owners remain in their task histories.</p>
          <p className="muted">Confirmed {rebalancePlan.confirmedAt}. Lecturer review remains available if the contribution concern is unresolved.</p>
          <Button to={lecturerEmailPath} variant="secondary" icon={Send}>Prepare lecturer review</Button>
        </section>}
      </div>
      <Modal open={confirmShift} title="Accept this AI-selected task swap?" onClose={() => setConfirmShift(false)} actions={<><Button variant="secondary" onClick={() => setConfirmShift(false)}>Cancel</Button><Button icon={Check} onClick={() => { onAcceptRebalance(); setConfirmShift(false) }}>Confirm and rebalance</Button></>}>
        {shiftCandidate && <><p>This assigns <strong>{rebalancePlan.criticalTaskTitle}</strong> to {shiftCandidate.recipient} and assigns <strong>{shiftCandidate.reliefTaskTitle}</strong> to {rebalancePlan.riskOwner}.</p><p>Both changes happen together. Original ownership, the accepting member, and the confirmation time remain visible in history.</p></>}
      </Modal>
    </aside>
  )
}
