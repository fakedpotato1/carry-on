export default function Avatar({ initials, large = false }) {
  return <span className={`avatar ${large ? 'avatar-lg' : ''}`} aria-hidden="true">{initials}</span>
}
