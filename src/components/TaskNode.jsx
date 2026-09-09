import { Handle, Position } from '@xyflow/react'
import { ArrowLeftRight, CheckCircle2, Sparkles } from 'lucide-react'
import StatusPill from './StatusPill'

export default function TaskNode({ data, selected }) {
  const { task, mode } = data
  const suggested = mode === 'draft' && task.suggested
  return (
    <article className={`task-node task-node-${mode} task-state-${task.status.toLowerCase().replaceAll(' ', '-')} ${suggested ? 'task-node-suggested' : ''} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="task-node-kicker">
        {mode === 'draft' ? (
          suggested ? <><Sparkles size={14} aria-hidden="true" />AI Suggested</> : <><CheckCircle2 size={14} aria-hidden="true" />Confirmed by team · just now</>
        ) : <StatusPill status={task.status} />}
      </div>
      <h3>{task.title}</h3>
      <dl>
        <div><dt>Owner</dt><dd>{task.owner}</dd></div>
        <div><dt>Due</dt><dd>{task.deadline}</dd></div>
      </dl>
      <p className="task-outcome">{task.deliverable}</p>
      {mode === 'active' && task.originalOwner && <div className="history-tag"><ArrowLeftRight size={13} aria-hidden="true" />Originally {task.originalOwner}</div>}
      <Handle type="source" position={Position.Bottom} />
    </article>
  )
}
