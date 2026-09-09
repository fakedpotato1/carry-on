import { useState } from 'react'
import { Check, Clipboard, FileDown, Info } from 'lucide-react'
import { useParams } from 'react-router-dom'
import AIAdvisory from '../components/AIAdvisory'
import Button from '../components/Button'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'

const draft = `Dear Dr. Farah,

Our ENV2104 group is writing to provide context about the “Urban Heat & Student Wellbeing” assignment due on 18 September.

On 2 September, all four members agreed to the task plan. The discussion and intervention section was assigned to Daniel with a checkpoint on 8 September. The checkpoint passed without a draft or status update. We sent two reminders, offered support, and suggested a smaller first deliverable, but we have not yet received a response.

To protect the final submission timeline, the team agreed on 11 September to split the unfinished section between Clara and Ben. Daniel’s original responsibility and our recovery attempts remain recorded in the attached evidence pack. We recognise that connected document activity may not reflect work completed elsewhere or personal circumstances.

We would appreciate your guidance on whether any further step is appropriate. This draft has been reviewed by the team before sharing.

Kind regards,
Aisha, Ben, Clara, and Daniel`

export default function LecturerEmail() {
  const { id } = useParams()
  const [body, setBody] = useState(draft)
  const [copied, setCopied] = useState(false)
  const copy = async () => { try { await navigator.clipboard.writeText(body) } catch { /* prototype fallback */ } setCopied(true) }
  return (
    <div className="page"><div className="page-narrow">
      <PageHeader eyebrow="Review before sharing" title="Lecturer email draft" description="LoadShift can prepare neutral wording, but it cannot send this message. Your team must edit, review, and copy or export it manually." />
      <div className="notice notice-clay" style={{ marginBottom: 20 }}><Info size={21} /><div><strong>No automatic sending</strong><p>There is deliberately no Send button or email connection in this prototype.</p></div></div>
      <AIAdvisory title="Drafted from the evidence pack" label="AI Suggested"><p>The draft separates observed facts from uncertainty and asks the lecturer for guidance. Review names, dates, and missing context before sharing.</p></AIAdvisory>
      <Card style={{ marginTop: 20 }}><div><label className="label" htmlFor="email-subject">Subject</label><input id="email-subject" className="field" defaultValue="ENV2104 group assignment — request for guidance and evidence summary" /></div><div style={{ marginTop: 18 }}><label className="label" htmlFor="email-body">Editable email body</label><textarea id="email-body" className="field" rows="20" value={body} onChange={(e) => setBody(e.target.value)} /></div><label className="check-line" style={{ marginTop: 16 }}><input type="checkbox" defaultChecked /><span>Reference the reviewed LoadShift evidence pack when sharing this draft.</span></label><div className="button-row" style={{ justifyContent: 'flex-end', marginTop: 20 }}><Button variant="secondary" icon={FileDown} onClick={() => setCopied(true)}>Export draft</Button><Button icon={Clipboard} onClick={copy}>Copy draft</Button></div></Card>
      <div className="button-row" style={{ justifyContent: 'space-between', marginTop: 22 }}><Button to={`/project/${id}/canvas`} variant="secondary">Back to canvas</Button><Button to={`/project/${id}/rubric-evaluation`} variant="tertiary">Continue to final review</Button></div>
      {copied && <div className="toast" role="status"><Check size={18} />Draft ready to share manually</div>}
    </div></div>
  )
}
