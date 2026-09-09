export default function Avatar({ initials, large = false, size, className = '' }) {
  const sizeClass = size ? `avatar-${size}` : large ? 'avatar-lg' : ''
  return <span className={`avatar ${sizeClass} ${className}`.trim()} aria-hidden="true">{initials}</span>
}
