import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'

// The "..." menu on an assignment/project card. Currently offers just one
// action (delete); onDelete is called after the item is chosen and the menu
// closes — the caller is responsible for confirming before actually deleting.
export default function ProjectCardMenu({ label, onDelete }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="project-card-menu-wrap" ref={rootRef}>
      <button
        type="button"
        className="icon-btn project-card-menu"
        aria-label={`More options for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => { event.preventDefault(); setOpen((current) => !current) }}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {open && (
        <div className="project-card-menu-popover" role="menu">
          <button
            type="button"
            role="menuitem"
            className="project-card-menu-item project-card-menu-item-danger"
            onClick={(event) => { event.preventDefault(); setOpen(false); onDelete() }}
          >
            <Trash2 size={15} aria-hidden="true" />
            Delete assignment
          </button>
        </div>
      )}
    </div>
  )
}
