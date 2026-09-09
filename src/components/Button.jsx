import { Link } from 'react-router-dom'

export default function Button({ children, to, variant = 'primary', icon: Icon, className = '', ...props }) {
  const classes = `btn btn-${variant} ${className}`.trim()
  const content = <>{Icon && <Icon size={18} aria-hidden="true" />}{children}</>
  if (to && props.disabled) return <button className={classes} {...props}>{content}</button>
  return to ? <Link className={classes} to={to} {...props}>{content}</Link> : <button className={classes} {...props}>{content}</button>
}
