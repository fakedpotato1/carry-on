import { useState } from 'react'
import { Check, Download, FileText, Info } from 'lucide-react'
import { useParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import Timeline from '../components/Timeline'
import { evidenceTimeline } from '../data/mockData'

export default function EvidencePack() {
  const { id } = useParams()
  const [exported, setExported] = useState(false)
  return (
    <div className="page">
      <PageHeader eyebrow="Factual record" title="Evidence pack" description="A scannable history of what the team agreed, what occurred, and how recovery was attempted—without assigning intent or blame." actions={<Button icon={Download} onClick={() => setExported(true)}>Export mock PDF</Button>} />
      <div className="notice" style={{ marginBottom: 20 }}><Info size={21} /><div><strong>Context, not a verdict</strong><p>Connected activity can be incomplete. The team should review this pack and add any missing offline context before sharing it.</p></div></div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Card><div className="section-head"><div><h2 className="section-title">Project summary</h2><p className="section-copy">Urban Heat & Student Wellbeing</p></div><FileText size={21} className="muted" /></div><div className="stack-sm"><div className="notice"><div><strong>Original agreement</strong><p>Discussion and interventions · Daniel · 25% · due 12 Sep</p></div></div><div className="notice"><div><strong>Observed issue</strong><p>One missed checkpoint, two unanswered reminders, and no expected draft activity.</p></div></div><div className="notice"><div><strong>Recovery outcome</strong><p>Work split between Clara and Ben; revised plan confirmed for 13 Sep.</p></div></div></div></Card>
        <Card><h2 className="section-title" style={{ marginBottom: 20 }}>Timeline</h2><Timeline items={evidenceTimeline} /></Card>
      </div>
      <Card style={{ marginTop: 20 }}><h2 className="section-title">Evidence sources</h2><div className="grid-3" style={{ marginTop: 14 }}><div className="metric"><span className="metric-label">Team agreement log</span><strong className="metric-value">4</strong><span className="small muted">member confirmations</span></div><div className="metric"><span className="metric-label">Reminder record</span><strong className="metric-value">2</strong><span className="small muted">recovery attempts</span></div><div className="metric"><span className="metric-label">Workspace signals</span><strong className="metric-value">0</strong><span className="small muted">expected draft events</span></div></div><p className="small muted">Workspace signals do not prove effort, quality, or intent.</p></Card>
      <div className="button-row" style={{ justifyContent: 'space-between', marginTop: 22 }}><Button to={`/project/${id}/canvas`} variant="secondary">Back to canvas</Button><Button to={`/project/${id}/lecturer-email`}>Prepare lecturer draft</Button></div>
      {exported && <div className="toast" role="status"><Check size={18} />Mock export prepared</div>}
    </div>
  )
}
