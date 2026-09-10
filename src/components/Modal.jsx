import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, title, children, onClose, actions, panelClassName = '' }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    closeRef.current?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const focusable = panelRef.current?.querySelectorAll('button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); previouslyFocused?.focus?.() }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section className={`modal-panel ${panelClassName}`.trim()} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={panelRef}>
        <div className="section-head">
          <h2 id="modal-title">{title}</h2>
          <button ref={closeRef} className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} aria-hidden="true" /></button>
        </div>
        {children}
        {actions && <div className="button-row" style={{ marginTop: 22 }}>{actions}</div>}
      </section>
    </div>
  )
}
