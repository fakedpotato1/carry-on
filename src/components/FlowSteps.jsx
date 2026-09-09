import { ChevronRight } from 'lucide-react'

const steps = ['Prevent', 'Detect', 'Recover', 'Escalate', 'Improve']

export default function FlowSteps({ current = 'Prevent' }) {
  return (
    <nav className="flow-steps" aria-label="LoadShift journey">
      {steps.map((step, index) => (
        <span key={step} style={{ display: 'contents' }}>
          <span className={`flow-step ${step === current ? 'current' : ''}`}><span className="flow-step-dot" />{step}</span>
          {index < steps.length - 1 && <ChevronRight className="flow-arrow" size={14} aria-hidden="true" />}
        </span>
      ))}
    </nav>
  )
}
