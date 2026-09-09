import { Sparkles } from 'lucide-react'

export default function AIAdvisory({ title, children, label = 'AI Advisory', className = '', ...props }) {
  return (
    <section className={`ai-card ${className}`.trim()} {...props}>
      <div className="ai-label"><Sparkles size={17} aria-hidden="true" />{label}</div>
      {title && <h3>{title}</h3>}
      <div>{children}</div>
    </section>
  )
}
