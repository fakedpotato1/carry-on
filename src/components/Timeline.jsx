import { Check, Circle } from 'lucide-react'

export default function Timeline({ items }) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <div className="timeline-item" key={`${item.date}-${item.title}`}>
          <div className="timeline-date">{item.date}</div>
          <div className="timeline-dot">{item.tone === 'confirmed' ? <Check size={13} aria-hidden="true" /> : <Circle size={10} fill="currentColor" aria-hidden="true" />}</div>
          <div className="timeline-copy"><strong>{item.title}</strong><p>{item.detail}</p>{item.source && <span className="small muted">Source: {item.source}</span>}</div>
        </div>
      ))}
    </div>
  )
}
