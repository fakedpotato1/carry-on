import { ArrowRight, CalendarDays, Code2, FileText, Plus } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import { projects } from '../data/mockData'

export default function Dashboard() {
  return (
    <div className="page">
      <PageHeader eyebrow="Your workspace" title="Projects and assignments" description="Open a project canvas to review the plan, live work, evidence, and recovery actions in one place." actions={<Button to="/project/new" icon={Plus}>New Project</Button>} />
      <div className="project-grid">
        {projects.map((item) => <Card key={item.id} className="project-card">
          <div className="project-card-top"><span className="assignment-icon">{item.type === 'Coding' ? <Code2 size={21} aria-hidden="true" /> : <FileText size={21} aria-hidden="true" />}</span><span className="project-type">{item.type} assignment</span></div>
          <h2>{item.title}</h2><p className="muted">{item.module}</p>
          <div className="project-deadline"><CalendarDays size={17} aria-hidden="true" /><span>{item.deadline}</span></div>
          <ProgressBar value={item.progress} label="Team-updated progress" />
          <p className="small muted">{item.daysLeft} days remaining · activity signals are shown separately</p>
          <Button to={`/project/${item.id}/canvas`} variant="secondary">Open Canvas <ArrowRight size={17} aria-hidden="true" /></Button>
        </Card>)}
      </div>
    </div>
  )
}
