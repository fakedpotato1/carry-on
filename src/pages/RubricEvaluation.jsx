import { AlertCircle, ArrowRight, CheckCircle2, Lightbulb, Sparkles } from 'lucide-react'
import { useParams } from 'react-router-dom'
import AIAdvisory from '../components/AIAdvisory'
import Button from '../components/Button'
import Card from '../components/Card'
import FlowSteps from '../components/FlowSteps'
import PageHeader from '../components/PageHeader'
import { rubric } from '../data/mockData'

export default function RubricEvaluation() {
  const { id } = useParams()
  return (
    <div className="page">
      <FlowSteps current="Improve" />
      <PageHeader eyebrow="Final review" title="Rubric evaluation" description="Use this estimate to find gaps before submission. It is advisory only and is not an official mark or lecturer judgment." actions={<Button to={`/project/${id}/canvas`} variant="secondary">Return to canvas</Button>} />
      <AIAdvisory title="Estimated overall score: 74 / 100" label="AI Estimate · Advisory only"><p>Calculated from the current mock report against the uploaded rubric. The lecturer may interpret evidence and criteria differently.</p></AIAdvisory>
      <div className="grid-2" style={{ marginTop: 20, alignItems: 'start' }}>
        <Card><div className="section-head"><div><h2 className="section-title">Criterion breakdown</h2><p className="section-copy">Estimated, not final grading</p></div><div className="score-ring"><span className="score">74</span></div></div><div className="stack-sm">{rubric.map((item) => <div className="notice" key={item.criterion}><div style={{ flex: 1 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{item.criterion}</strong><strong>{item.estimate}/100</strong></div><p>{item.note}</p><div className="small muted">Rubric weight: {item.weight}%</div></div></div>)}</div></Card>
        <div className="stack">
          <Card><div className="section-head"><h2 className="section-title">Missing requirements</h2><AlertCircle size={21} className="muted" /></div><div className="stack-sm"><div className="notice notice-attention"><div><strong>Third intervention needs evidence</strong><p>Add a source and explain feasibility for the campus context.</p></div></div><div className="notice"><div><strong>Sampling limitation</strong><p>Explain how exam-week timing may affect wellbeing responses.</p></div></div></div></Card>
          <Card><div className="section-head"><h2 className="section-title">Improvement suggestions</h2><Lightbulb size={21} className="muted" /></div><div className="stack-sm"><div className="check-line"><CheckCircle2 size={19} /><span>Connect the regional study to the campus-zone comparison.</span></div><div className="check-line"><CheckCircle2 size={19} /><span>Add ownership and time horizon to each intervention.</span></div><div className="check-line"><CheckCircle2 size={19} /><span>Verify that every chart is referenced in the findings text.</span></div></div></Card>
          <div className="notice"><Sparkles size={20} /><div><strong>Human review still decides readiness</strong><p>Ask a teammate to review the revised sections before submission.</p></div></div>
        </div>
      </div>
      <div className="button-row" style={{ justifyContent: 'flex-end', marginTop: 22 }}><Button to={`/project/${id}/canvas`}>Return to canvas <ArrowRight size={17} /></Button></div>
    </div>
  )
}
