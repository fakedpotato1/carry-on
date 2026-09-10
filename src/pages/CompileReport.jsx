import { useEffect, useState } from 'react'
import {
  AlertTriangle, Check, CheckCircle2, Download, FileCheck2, FileText, Info, Layers, Sparkles,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { initialTasks } from '../data/mockData'
import { getAllProjects } from '../lib/projectsStore'

const FORMAT_PRESETS = [
  { key: 'apa', label: 'Times New Roman · 12pt · Double-spaced', hint: 'Common APA-style default' },
  { key: 'arial', label: 'Arial · 11pt · 1.5 spacing', hint: 'Common report/business style' },
  { key: 'calibri', label: 'Calibri · 12pt · Single-spaced', hint: 'Compact, common default' },
  { key: 'custom', label: 'Custom…', hint: 'Set your own font, size, and spacing' },
]

const LOADING_STEPS = ['Ordering sections by assignment', 'Applying the required font & spacing', 'Attaching cover and marking rubric']

function UploadSlot({ label, hint, file, onChange, small }) {
  return (
    <div className={`compile-upload-slot ${small ? 'compile-upload-slot-sm' : ''}`}>
      <div className="compile-upload-info">
        <strong>{label}</strong>
        {hint && <span className="compile-upload-hint">{hint}</span>}
        {file && <span className="compile-upload-filename"><FileCheck2 size={14} aria-hidden="true" />{file}</span>}
      </div>
      <label className="btn btn-secondary canvas-upload-btn">
        {file ? 'Replace' : 'Upload'}
        <input type="file" className="visually-hidden" onChange={(event) => onChange(event.target.files?.[0]?.name || null)} />
      </label>
    </div>
  )
}

export default function CompileReport() {
  const { id } = useParams()
  const currentProject = getAllProjects().find((item) => item.id === id)

  const [coverFile, setCoverFile] = useState(null)
  const [rubricFile, setRubricFile] = useState(null)
  const [contentMode, setContentMode] = useState('separate')
  const [sectionFiles, setSectionFiles] = useState({})
  const [mergedFile, setMergedFile] = useState(null)
  const [formatPreset, setFormatPreset] = useState('apa')
  const [customFont, setCustomFont] = useState('Times New Roman')
  const [customSize, setCustomSize] = useState('12')
  const [customSpacing, setCustomSpacing] = useState('Double')
  const [compiling, setCompiling] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [compiled, setCompiled] = useState(false)
  const [alsoPdf, setAlsoPdf] = useState(true)
  const [toast, setToast] = useState(null)
  const [showMissingNotice, setShowMissingNotice] = useState(false)

  const sectionTasks = initialTasks.filter((task) => task.id !== 'final')
  const completedCount = sectionTasks.filter((task) => task.status === 'Completed').length
  const attachedSections = sectionTasks.filter((task) => sectionFiles[task.id])

  const contentReady = contentMode === 'merged' ? !!mergedFile : attachedSections.length > 0
  const canCompile = !!coverFile && !!rubricFile && contentReady

  const missingItems = []
  if (!coverFile) missingItems.push('a report cover')
  if (!rubricFile) missingItems.push('a marking rubric')
  if (!contentReady) missingItems.push(contentMode === 'merged' ? 'the merged document' : 'at least one section')

  const formatSummary = formatPreset === 'custom'
    ? `${customFont || 'Custom font'} · ${customSize || '—'}pt · ${customSpacing || '—'} spacing`
    : FORMAT_PRESETS.find((preset) => preset.key === formatPreset)?.label

  useEffect(() => {
    if (!compiling) return undefined
    const timers = [
      setTimeout(() => setLoadingStep(1), 550),
      setTimeout(() => setLoadingStep(2), 1150),
      setTimeout(() => { setCompiling(false); setCompiled(true) }, 1750),
    ]
    return () => timers.forEach(clearTimeout)
  }, [compiling])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  function startCompile() {
    if (!canCompile) {
      setShowMissingNotice(true)
      return
    }
    setShowMissingNotice(false)
    setLoadingStep(0)
    setCompiling(true)
  }

  function handleDownload() {
    setToast(alsoPdf ? 'Compiled report and PDF copy ready to download' : 'Compiled report ready to download')
  }

  if (!currentProject) {
    return (
      <div className="page"><div className="page-narrow">
        <p className="muted">This project couldn't be found.</p>
        <Button to="/projects" variant="secondary">Back to Projects</Button>
      </div></div>
    )
  }

  if (compiling) {
    return (
      <div className="page"><div className="page-narrow">
        <Card className="loading-panel" aria-live="polite">
          <div>
            <div className="spinner" aria-hidden="true" />
            <h1 className="page-title" style={{ marginTop: 22 }}>Compiling report</h1>
            <p className="page-description">Assembling {currentProject.title} into one submission-ready document.</p>
            <div className="loading-steps">
              {LOADING_STEPS.map((label, index) => (
                <div key={label} className={`loading-step ${loadingStep >= index ? 'done' : ''}`}>
                  {loadingStep >= index ? <Check size={18} /> : <span className="loading-dot" />}
                  {label}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div></div>
    )
  }

  return (
    <div className="page"><div className="page-narrow">
      <PageHeader
        eyebrow="Final assembly"
        title="Compile Report"
        description="Bring the cover, everyone's sections, and the marking rubric together into one submission-ready document."
        actions={<Button to={`/project/${id}/canvas`} variant="secondary">Back to canvas</Button>}
      />

      {compiled ? (
        <>
          <div className="notice" style={{ marginBottom: 20 }}>
            <CheckCircle2 size={21} />
            <div><strong>Compiled report ready</strong><p>Review the order below, then download when you're happy with it.</p></div>
          </div>

          <Card>
            <div className="section-head"><h2 className="section-title">Document outline</h2><Layers size={21} className="muted" /></div>
            <div className="stack-sm">
              <div className="notice"><FileText size={18} /><div><strong>Cover</strong><p>{coverFile}</p></div></div>
              {contentMode === 'merged' ? (
                <div className="notice"><FileText size={18} /><div><strong>Content</strong><p>{mergedFile} (already merged by the team)</p></div></div>
              ) : attachedSections.map((task, index) => (
                <div className="notice" key={task.id}><FileText size={18} /><div><strong>Section {index + 1} · {task.title}</strong><p>{task.owner} · {sectionFiles[task.id]}</p></div></div>
              ))}
              <div className="notice"><FileCheck2 size={18} /><div><strong>Marking rubric</strong><p>{rubricFile} · attached at the end</p></div></div>
            </div>
            <p className="small muted" style={{ marginTop: 16 }}>Formatting applied: {formatSummary}</p>
          </Card>

          <Card style={{ marginTop: 18 }}>
            <label className="check-line"><input type="checkbox" checked={alsoPdf} onChange={(event) => setAlsoPdf(event.target.checked)} /><span>Also export a PDF copy</span></label>
            <div className="button-row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <Button variant="secondary" onClick={() => setCompiled(false)}>Make changes</Button>
              <Button icon={Download} onClick={handleDownload}>Download compiled report</Button>
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <div className="section-head">
              <div><h2 className="section-title">Section status</h2><p className="section-copy">{completedCount} of {sectionTasks.length} sections marked Completed</p></div>
              <Sparkles size={21} className="muted" />
            </div>
            {completedCount < sectionTasks.length && (
              <div className="notice notice-attention" style={{ marginBottom: 14 }}>
                <AlertTriangle size={20} />
                <div><strong>Not every section is marked Completed yet</strong><p>You can still compile, but it's worth checking with the owners below first.</p></div>
              </div>
            )}
            <div className="stack-sm">
              {sectionTasks.map((task) => (
                <div className="notice" key={task.id}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div><strong>{task.title}</strong><p>{task.owner}</p></div>
                    <StatusPill status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ marginTop: 18 }}>
            <h2 className="section-title">Report cover & marking rubric</h2>
            <div className="stack-sm" style={{ marginTop: 14 }}>
              <UploadSlot label="Report cover" hint="Title page to place at the front" file={coverFile} onChange={setCoverFile} />
              <UploadSlot label="Marking rubric" hint="Attached at the end of the document" file={rubricFile} onChange={setRubricFile} />
            </div>
          </Card>

          <Card style={{ marginTop: 18 }}>
            <h2 className="section-title">Content</h2>
            <div className="choice-grid" style={{ marginTop: 14 }}>
              <button type="button" className={`choice-card ${contentMode === 'separate' ? 'selected' : ''}`} onClick={() => setContentMode('separate')}>
                <strong>Compile from each section</strong>
                <span>Everyone uploads their own part; LoadShift orders them by section.</span>
              </button>
              <button type="button" className={`choice-card ${contentMode === 'merged' ? 'selected' : ''}`} onClick={() => setContentMode('merged')}>
                <strong>Already merged into one doc</strong>
                <span>The team combined every section themselves — just attach that file.</span>
              </button>
            </div>

            {contentMode === 'separate' ? (
              <div className="stack-sm" style={{ marginTop: 16 }}>
                {sectionTasks.map((task, index) => (
                  <UploadSlot
                    key={task.id}
                    small
                    label={`Section ${index + 1} · ${task.title}`}
                    hint={task.owner}
                    file={sectionFiles[task.id]}
                    onChange={(name) => setSectionFiles((current) => ({ ...current, [task.id]: name }))}
                  />
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                <UploadSlot label="Merged content" hint="One document containing every section" file={mergedFile} onChange={setMergedFile} />
              </div>
            )}
          </Card>

          <Card style={{ marginTop: 18 }}>
            <h2 className="section-title">Formatting</h2>
            <p className="section-copy" style={{ marginBottom: 14 }}>Applied uniformly across the compiled document.</p>
            <div className="choice-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {FORMAT_PRESETS.map((preset) => (
                <button key={preset.key} type="button" className={`choice-card ${formatPreset === preset.key ? 'selected' : ''}`} onClick={() => setFormatPreset(preset.key)}>
                  <strong>{preset.label}</strong>
                  <span>{preset.hint}</span>
                </button>
              ))}
            </div>
            {formatPreset === 'custom' && (
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div><label className="label" htmlFor="custom-font">Font</label><input id="custom-font" className="field" value={customFont} onChange={(event) => setCustomFont(event.target.value)} /></div>
                <div><label className="label" htmlFor="custom-size">Size (pt)</label><input id="custom-size" className="field" type="number" value={customSize} onChange={(event) => setCustomSize(event.target.value)} /></div>
                <div><label className="label" htmlFor="custom-spacing">Line spacing</label><select id="custom-spacing" className="field" value={customSpacing} onChange={(event) => setCustomSpacing(event.target.value)}><option>Single</option><option>1.5</option><option>Double</option></select></div>
              </div>
            )}
          </Card>

          <div className="notice" style={{ marginTop: 18 }}>
            <Info size={20} />
            <div><strong>This is a prototype</strong><p>Compile assembles the outline and applies your chosen formatting rules — it doesn't rewrite anyone's writing.</p></div>
          </div>

          {showMissingNotice && missingItems.length > 0 && (
            <div className="notice notice-attention" style={{ marginTop: 18 }}>
              <AlertTriangle size={20} />
              <div><strong>A few things are still needed</strong><p>Add {missingItems.join(', ')} before compiling.</p></div>
            </div>
          )}

          <div className="button-row" style={{ justifyContent: 'flex-end', marginTop: 22 }}>
            <Button icon={Layers} onClick={startCompile}>Compile Report</Button>
          </div>
        </>
      )}

      {toast && <div className="toast" role="status"><Check size={18} />{toast}</div>}
    </div></div>
  )
}
