export default function ProgressBar({ value, label = 'Overall progress' }) {
  return (
    <div className="progress-wrap">
      <div className="progress-label"><span>{label}</span><strong>{value}%</strong></div>
      <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value} aria-label={label}>
        <div className="progress-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
