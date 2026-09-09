import { AlertCircle, ArrowLeftRight, Ban, Check, Circle, Clock3, Eye, Flag, Hourglass, Play, Send } from 'lucide-react'

const statusMap = {
  'Not Started': ['neutral', Circle],
  'In Progress': ['progress', Play],
  'Ready for Review': ['progress', Eye],
  Completed: ['complete', Check],
  'Due Soon': ['due', Clock3],
  Overdue: ['overdue', AlertCircle],
  Blocked: ['overdue', Ban],
  'Waiting for Response': ['due', Hourglass],
  'Potential Risk': ['risk', Flag],
  Rebalanced: ['rebalanced', ArrowLeftRight],
  Escalated: ['escalated', Send],
  Confirmed: ['complete', Check],
  Waiting: ['neutral', Hourglass],
}

export default function StatusPill({ status }) {
  const [tone, Icon] = statusMap[status] || statusMap['Not Started']
  return <span className={`pill pill-${tone}`}><Icon size={14} aria-hidden="true" />{status}</span>
}
