import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import {
  AlertTriangle, Check, CheckCircle2, Download, FileCheck2, FileText, Info, Layers, Loader2, Sparkles,
} from 'lucide-react'
import Button from './Button'
import Modal from './Modal'
import StatusPill from './StatusPill'

const FORMAT_PRESETS = [
  { key: 'apa', label: 'Times New Roman · 12pt · Double-spaced', hint: 'Common APA-style default', font: 'Times New Roman', size: 12, spacing: 'Double' },
  { key: 'arial', label: 'Arial · 11pt · 1.5 spacing', hint: 'Common report/business style', font: 'Arial', size: 11, spacing: '1.5' },
  { key: 'calibri', label: 'Calibri · 12pt · Single-spaced', hint: 'Compact, common default', font: 'Calibri', size: 12, spacing: 'Single' },
  { key: 'custom', label: 'Custom…', hint: 'Set your own font, size, and spacing' },
]

const LOADING_STEPS = ['Ordering sections by assignment', 'Applying the required font & spacing', 'Attaching cover and marking rubric']

const PDF_REGULAR_FONTS = { 'Times New Roman': StandardFonts.TimesRoman, Arial: StandardFonts.Helvetica, Calibri: StandardFonts.Helvetica }
const PDF_BOLD_FONTS = { 'Times New Roman': StandardFonts.TimesRomanBold, Arial: StandardFonts.HelveticaBold, Calibri: StandardFonts.HelveticaBold }

function slugify(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'report'
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// .docx files are zip archives — unzip with JSZip and read the raw paragraph
// text out of word/document.xml so the preview sidebar and the final
// download show the document's actual content, not just its filename. This
// only works for editable, zip-based .docx files, which is exactly why
// uploads are restricted to that format.
async function extractDocxParagraphs(file) {
  const buffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)
  const entry = zip.file('word/document.xml')
  if (!entry) throw new Error('Not a valid .docx file')
  const xml = await entry.async('text')
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Could not parse document')

  const paragraphs = Array.from(doc.getElementsByTagName('w:p'))
    .map((p) => {
      const styleNode = p.getElementsByTagName('w:pStyle')[0]
      const styleVal = styleNode?.getAttribute('w:val') || ''
      const heading = /Heading|Title/i.test(styleVal)
      const text = Array.from(p.getElementsByTagName('w:t')).map((t) => t.textContent).join('')
      return { text: text.trim(), heading }
    })
    .filter((p) => p.text.length > 0)

  if (paragraphs.length === 0) throw new Error('This document looks empty')
  return paragraphs
}

function DocSnippet({ paragraphs, compact }) {
  if (!paragraphs?.length) return null
  return (
    <div className={`compile-doc-snippet ${compact ? 'compile-doc-snippet-sm' : ''}`}>
      {paragraphs.map((p, index) => (p.heading
        ? <strong key={index}>{p.text}</strong>
        : <p key={index}>{p.text}</p>))}
    </div>
  )
}

function UploadSlot({ label, hint, file, onChange, small }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(event) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return

    if (!picked.name.toLowerCase().endsWith('.docx')) {
      setError('Please upload an editable .docx file — PDFs and other formats can’t be edited or compiled.')
      return
    }

    setError(null)
    setBusy(true)
    try {
      const paragraphs = await extractDocxParagraphs(picked)
      onChange({ name: picked.name, paragraphs })
    } catch (err) {
      setError('Couldn’t read this file — make sure it’s a valid, unprotected .docx document.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`compile-upload-slot ${small ? 'compile-upload-slot-sm' : ''}`}>
      <div className="compile-upload-row">
        <div className="compile-upload-info">
          <strong>{label}</strong>
          {hint && <span className="compile-upload-hint">{hint}</span>}
          {file && <span className="compile-upload-filename"><FileCheck2 size={14} aria-hidden="true" />{file.name}</span>}
          {busy && <span className="compile-upload-status"><Loader2 size={13} aria-hidden="true" className="spin-icon" />Reading document…</span>}
          {error && <span className="compile-upload-error"><AlertTriangle size={13} aria-hidden="true" />{error}</span>}
        </div>
        <label className="btn btn-secondary canvas-upload-btn">
          {file ? 'Replace' : 'Upload'}
          <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="visually-hidden" onChange={handleFile} />
        </label>
      </div>
      {file && <DocSnippet paragraphs={file.paragraphs} compact={small} />}
    </div>
  )
}

export default function CompileReportModal({ open, onClose, project, tasks }) {
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
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showMissingNotice, setShowMissingNotice] = useState(false)

  const sectionTasks = tasks.filter((task) => task.id !== 'final')
  const completedCount = sectionTasks.filter((task) => task.status === 'Completed').length
  const attachedSections = sectionTasks.filter((task) => sectionFiles[task.id])

  const contentReady = contentMode === 'merged' ? !!mergedFile : attachedSections.length > 0
  const canCompile = !!coverFile && !!rubricFile && contentReady

  const missingItems = []
  if (!coverFile) missingItems.push('a report cover')
  if (!rubricFile) missingItems.push('a marking rubric')
  if (!contentReady) missingItems.push(contentMode === 'merged' ? 'the merged document' : 'at least one section')

  const activePreset = FORMAT_PRESETS.find((preset) => preset.key === formatPreset)
  const resolvedFormat = formatPreset === 'custom'
    ? { font: customFont || 'Times New Roman', size: Number(customSize) || 12, spacing: customSpacing || 'Single' }
    : { font: activePreset.font, size: activePreset.size, spacing: activePreset.spacing }

  const formatSummary = formatPreset === 'custom'
    ? `${customFont || 'Custom font'} · ${customSize || '—'}pt · ${customSpacing || '—'} spacing`
    : activePreset?.label

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

  async function buildDocxBlob() {
    const { font, size, spacing } = resolvedFormat
    const line = spacing === 'Double' ? 480 : spacing === '1.5' ? 360 : 240
    const children = []
    const pushParagraphs = (paragraphs) => {
      paragraphs.forEach((p) => children.push(new Paragraph({
        spacing: { line, lineRule: 'auto' },
        children: [new TextRun({ text: p.text, bold: !!p.heading, font, size: size * 2 })],
      })))
    }
    const pushHeading = (text) => children.push(new Paragraph({
      pageBreakBefore: children.length > 0,
      spacing: { line, lineRule: 'auto' },
      children: [new TextRun({ text, bold: true, font, size: size * 2 + 2 })],
    }))

    pushParagraphs(coverFile.paragraphs)
    if (contentMode === 'merged') {
      pushParagraphs(mergedFile.paragraphs)
    } else {
      attachedSections.forEach((task, index) => {
        pushHeading(`Section ${index + 1}: ${task.title} — ${task.owner}`)
        pushParagraphs(sectionFiles[task.id].paragraphs)
      })
    }
    pushHeading('Marking Rubric')
    pushParagraphs(rubricFile.paragraphs)

    const doc = new Document({ sections: [{ children }] })
    return Packer.toBlob(doc)
  }

  async function buildPdfBlob() {
    const { font: fontName, size, spacing } = resolvedFormat
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(PDF_REGULAR_FONTS[fontName] || StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(PDF_BOLD_FONTS[fontName] || StandardFonts.HelveticaBold)

    const pageWidth = 612
    const pageHeight = 792
    const margin = 72
    const maxWidth = pageWidth - margin * 2
    const lineHeight = size * (spacing === 'Double' ? 2 : spacing === '1.5' ? 1.5 : 1.2)

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - margin

    function wrapLines(text, useFont) {
      const words = text.split(/\s+/)
      const lines = []
      let current = ''
      words.forEach((word) => {
        const attempt = current ? `${current} ${word}` : word
        if (current && useFont.widthOfTextAtSize(attempt, size) > maxWidth) {
          lines.push(current)
          current = word
        } else {
          current = attempt
        }
      })
      if (current) lines.push(current)
      return lines
    }

    function drawParagraph(text, { bold = false, pageBreakBefore = false } = {}) {
      if (pageBreakBefore) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin
      }
      const useFont = bold ? boldFont : regularFont
      wrapLines(text, useFont).forEach((line) => {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          y = pageHeight - margin
        }
        page.drawText(line, { x: margin, y, size, font: useFont })
        y -= lineHeight
      })
      y -= lineHeight * 0.3
    }

    const drawParagraphs = (paragraphs) => paragraphs.forEach((p) => drawParagraph(p.text, { bold: !!p.heading }))

    drawParagraphs(coverFile.paragraphs)
    if (contentMode === 'merged') {
      drawParagraph('Content', { bold: true, pageBreakBefore: true })
      drawParagraphs(mergedFile.paragraphs)
    } else {
      attachedSections.forEach((task, index) => {
        drawParagraph(`Section ${index + 1}: ${task.title} — ${task.owner}`, { bold: true, pageBreakBefore: true })
        drawParagraphs(sectionFiles[task.id].paragraphs)
      })
    }
    drawParagraph('Marking Rubric', { bold: true, pageBreakBefore: true })
    drawParagraphs(rubricFile.paragraphs)

    const bytes = await pdfDoc.save()
    return new Blob([bytes], { type: 'application/pdf' })
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const baseName = `${slugify(project.title)}-compiled-report`
      const docxBlob = await buildDocxBlob()
      downloadBlob(docxBlob, `${baseName}.docx`)
      if (alsoPdf) {
        const pdfBlob = await buildPdfBlob()
        downloadBlob(pdfBlob, `${baseName}.pdf`)
      }
      setToast(alsoPdf ? 'Compiled report and PDF copy downloaded' : 'Compiled report downloaded')
    } catch (err) {
      setToast('Something went wrong compiling the download — please try again')
    } finally {
      setDownloading(false)
    }
  }

  const modalTitle = compiling ? 'Compiling report' : compiled ? 'Compiled report ready' : 'Compile Report'

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} panelClassName="compile-modal-panel">
      <div className="compile-modal-scroll">
        {compiling ? (
          <div className="loading-panel" style={{ minHeight: 280 }} aria-live="polite">
            <div>
              <div className="spinner" aria-hidden="true" />
              <h1 className="page-title" style={{ marginTop: 22 }}>Compiling report</h1>
              <p className="page-description">Assembling {project.title} into one submission-ready document.</p>
              <div className="loading-steps">
                {LOADING_STEPS.map((label, index) => (
                  <div key={label} className={`loading-step ${loadingStep >= index ? 'done' : ''}`}>
                    {loadingStep >= index ? <Check size={18} /> : <span className="loading-dot" />}
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : compiled ? (
          <>
            <div className="notice" style={{ marginBottom: 18 }}>
              <CheckCircle2 size={21} />
              <div><strong>Compiled report ready</strong><p>Review the order below, then download when you're happy with it.</p></div>
            </div>
            <div className="section-head"><h2 className="section-title">Document outline</h2><Layers size={21} className="muted" /></div>
            <div className="stack-sm">
              <div className="notice">
                <FileText size={18} />
                <div><strong>Cover</strong><p>{coverFile.name}</p><DocSnippet paragraphs={coverFile.paragraphs} /></div>
              </div>
              {contentMode === 'merged' ? (
                <div className="notice">
                  <FileText size={18} />
                  <div><strong>Content</strong><p>{mergedFile.name} (already merged by the team)</p><DocSnippet paragraphs={mergedFile.paragraphs} /></div>
                </div>
              ) : attachedSections.map((task, index) => (
                <div className="notice" key={task.id}>
                  <FileText size={18} />
                  <div><strong>Section {index + 1} · {task.title}</strong><p>{task.owner} · {sectionFiles[task.id].name}</p><DocSnippet paragraphs={sectionFiles[task.id].paragraphs} /></div>
                </div>
              ))}
              <div className="notice">
                <FileCheck2 size={18} />
                <div><strong>Marking rubric</strong><p>{rubricFile.name} · attached at the end</p><DocSnippet paragraphs={rubricFile.paragraphs} /></div>
              </div>
            </div>
            <p className="small muted" style={{ marginTop: 16 }}>Formatting applied: {formatSummary}</p>
          </>
        ) : (
          <div className="compile-modal-grid">
            <div className="compile-modal-main">
              <div>
                <div className="section-head">
                  <div><h2 className="section-title">Section status</h2><p className="section-copy">{completedCount} of {sectionTasks.length} sections marked Completed</p></div>
                  <Sparkles size={20} className="muted" />
                </div>
                {completedCount < sectionTasks.length && (
                  <div className="notice notice-attention" style={{ marginBottom: 12 }}>
                    <AlertTriangle size={18} />
                    <div><strong>Not every section is Completed yet</strong><p>You can still compile, but it's worth checking with the owners first.</p></div>
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
              </div>

              <div>
                <h2 className="section-title">Report cover & marking rubric</h2>
                <p className="section-copy">Editable .docx files only — PDFs can't be compiled into the final document.</p>
                <div className="stack-sm" style={{ marginTop: 12 }}>
                  <UploadSlot label="Report cover" hint="Title page to place at the front" file={coverFile} onChange={setCoverFile} />
                  <UploadSlot label="Marking rubric" hint="Attached at the end of the document" file={rubricFile} onChange={setRubricFile} />
                </div>
              </div>

              <div>
                <h2 className="section-title">Content</h2>
                <div className="choice-grid" style={{ marginTop: 12 }}>
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
                  <div className="stack-sm" style={{ marginTop: 14 }}>
                    {sectionTasks.map((task, index) => (
                      <UploadSlot
                        key={task.id}
                        small
                        label={`Section ${index + 1} · ${task.title}`}
                        hint={task.owner}
                        file={sectionFiles[task.id]}
                        onChange={(value) => setSectionFiles((current) => ({ ...current, [task.id]: value }))}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 14 }}>
                    <UploadSlot label="Merged content" hint="One document containing every section" file={mergedFile} onChange={setMergedFile} />
                  </div>
                )}
              </div>

              <div>
                <h2 className="section-title">Formatting</h2>
                <p className="section-copy" style={{ marginBottom: 12 }}>Applied uniformly across the compiled document.</p>
                <div className="choice-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  {FORMAT_PRESETS.map((preset) => (
                    <button key={preset.key} type="button" className={`choice-card ${formatPreset === preset.key ? 'selected' : ''}`} onClick={() => setFormatPreset(preset.key)}>
                      <strong>{preset.label}</strong>
                      <span>{preset.hint}</span>
                    </button>
                  ))}
                </div>
                {formatPreset === 'custom' && (
                  <div className="form-grid" style={{ marginTop: 14 }}>
                    <div><label className="label" htmlFor="custom-font">Font</label><input id="custom-font" className="field" value={customFont} onChange={(event) => setCustomFont(event.target.value)} /></div>
                    <div><label className="label" htmlFor="custom-size">Size (pt)</label><input id="custom-size" className="field" type="number" value={customSize} onChange={(event) => setCustomSize(event.target.value)} /></div>
                    <div><label className="label" htmlFor="custom-spacing">Line spacing</label><select id="custom-spacing" className="field" value={customSpacing} onChange={(event) => setCustomSpacing(event.target.value)}><option>Single</option><option>1.5</option><option>Double</option></select></div>
                  </div>
                )}
                {formatPreset === 'custom' && !PDF_REGULAR_FONTS[customFont] && (
                  <p className="small muted" style={{ marginTop: 8 }}>The PDF copy will substitute a close standard font for “{customFont || 'your custom font'}” — the .docx copy uses it exactly.</p>
                )}
              </div>

              <div className="notice">
                <Info size={18} />
                <div><strong>This is a prototype</strong><p>Compile assembles the outline and applies your chosen formatting rules — it doesn't rewrite anyone's writing.</p></div>
              </div>
            </div>

            <aside className="compile-preview">
              <h3>Preview</h3>
              <p className="small muted">Updates as you attach files.</p>
              <div className="compile-preview-list">
                <div className={`compile-preview-item ${!coverFile ? 'missing' : ''}`}>
                  <FileText size={14} aria-hidden="true" />
                  <div>
                    <strong>Cover</strong>
                    <span>{coverFile ? coverFile.name : 'Not added yet'}</span>
                    {coverFile && <DocSnippet paragraphs={coverFile.paragraphs} compact />}
                  </div>
                </div>

                {contentMode === 'merged' ? (
                  <div className={`compile-preview-item ${!mergedFile ? 'missing' : ''}`}>
                    <FileText size={14} aria-hidden="true" />
                    <div>
                      <strong>Content</strong>
                      <span>{mergedFile ? mergedFile.name : 'Not added yet'}</span>
                      {mergedFile && <DocSnippet paragraphs={mergedFile.paragraphs} compact />}
                    </div>
                  </div>
                ) : sectionTasks.map((task, index) => (
                  <div className={`compile-preview-item ${!sectionFiles[task.id] ? 'missing' : ''}`} key={task.id}>
                    <FileText size={14} aria-hidden="true" />
                    <div>
                      <strong>Section {index + 1} · {task.owner}</strong>
                      <span>{sectionFiles[task.id] ? sectionFiles[task.id].name : 'Not attached yet'}</span>
                      {sectionFiles[task.id] && <DocSnippet paragraphs={sectionFiles[task.id].paragraphs} compact />}
                    </div>
                  </div>
                ))}

                <div className={`compile-preview-item ${!rubricFile ? 'missing' : ''}`}>
                  <FileCheck2 size={14} aria-hidden="true" />
                  <div>
                    <strong>Marking rubric</strong>
                    <span>{rubricFile ? rubricFile.name : 'Not added yet'}</span>
                    {rubricFile && <DocSnippet paragraphs={rubricFile.paragraphs} compact />}
                  </div>
                </div>
              </div>
              <div className="compile-preview-format">
                <strong>Formatting</strong>
                <span>{formatSummary}</span>
              </div>
            </aside>
          </div>
        )}
      </div>

      {!compiling && (
        <div className="compile-modal-footer">
          {compiled ? (
            <>
              <label className="check-line" style={{ marginBottom: 14 }}><input type="checkbox" checked={alsoPdf} onChange={(event) => setAlsoPdf(event.target.checked)} /><span>Also export a PDF copy</span></label>
              <div className="button-row" style={{ justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setCompiled(false)} disabled={downloading}>Make changes</Button>
                <Button icon={downloading ? Loader2 : Download} onClick={handleDownload} disabled={downloading}>{downloading ? 'Preparing download…' : 'Download compiled report'}</Button>
              </div>
            </>
          ) : (
            <>
              {showMissingNotice && missingItems.length > 0 && (
                <div className="notice notice-attention" style={{ marginBottom: 14 }}>
                  <AlertTriangle size={18} />
                  <div><strong>A few things are still needed</strong><p>Add {missingItems.join(', ')} before compiling.</p></div>
                </div>
              )}
              <div className="button-row" style={{ justifyContent: 'space-between' }}>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button icon={Layers} onClick={startCompile}>Compile Now</Button>
              </div>
            </>
          )}
        </div>
      )}

      {toast && <div className="toast" role="status"><Check size={18} />{toast}</div>}
    </Modal>
  )
}
