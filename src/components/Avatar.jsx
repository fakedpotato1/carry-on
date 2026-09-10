export default function Avatar({ initials, photo, large = false, size, className = '' }) {
  const sizeClass = size ? `avatar-${size}` : large ? 'avatar-lg' : ''
  return (
    <span className={`avatar ${sizeClass} ${className}`.trim()} aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : initials}
    </span>
  )
}