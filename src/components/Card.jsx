export default function Card({ children, className = '', soft = false, ...props }) {
  return <section className={`card ${soft ? 'card-soft' : ''} ${className}`.trim()} {...props}>{children}</section>
}
