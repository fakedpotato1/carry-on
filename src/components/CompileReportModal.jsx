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

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const IMAGE_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'
const EXT_CONTENT_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml', tif: 'image/tiff', tiff: 'image/tiff', emf: 'image/x-emf', wmf: 'image/x-wmf' }

// Where w:spacing and w:rFonts/w:sz/w:szCs are allowed to sit relative to
// their siblings inside <w:pPr>/<w:rPr> — used so anything we insert lands
// in a schema-valid position instead of just being appended at the end.
const PPR_ORDER = ['w:pStyle', 'w:keepNext', 'w:keepLines', 'w:pageBreakBefore', 'w:framePr', 'w:widowControl', 'w:numPr', 'w:suppressLineNumbers', 'w:pBdr', 'w:shd', 'w:tabs', 'w:suppressAutoHyphens', 'w:kinsoku', 'w:wordWrap', 'w:overflowPunct', 'w:topLinePunct', 'w:autoSpaceDE', 'w:autoSpaceDN', 'w:bidi', 'w:adjustRightInd', 'w:snapToGrid', 'w:spacing', 'w:ind', 'w:contextualSpacing', 'w:mirrorIndents', 'w:suppressOverlap', 'w:jc', 'w:textDirection', 'w:textAlignment', 'w:textboxTightWrap', 'w:outlineLvl', 'w:divId', 'w:cnfStyle', 'w:rPr']
const RPR_ORDER = ['w:rStyle', 'w:rFonts', 'w:b', 'w:bCs', 'w:i', 'w:iCs', 'w:caps', 'w:smallCaps', 'w:strike', 'w:dstrike', 'w:outline', 'w:shadow', 'w:emboss', 'w:imprint', 'w:noProof', 'w:snapToGrid', 'w:vanish', 'w:webHidden', 'w:color', 'w:spacing', 'w:w', 'w:kern', 'w:position', 'w:sz', 'w:szCs', 'w:highlight', 'w:u', 'w:effect', 'w:bdr', 'w:shd', 'w:fitText', 'w:vertAlign', 'w:rtl', 'w:cs', 'w:em', 'w:lang', 'w:eastAsianLayout', 'w:specVanish']

// Elements that reference something we don't (yet) carry over when splicing
// documents together — comments, bookmarks, and page/section setup
// (headers/footers) — dropped so nothing in the merged file points at a
// relationship that no longer exists. Images (w:drawing) are kept and
// remapped instead of stripped — see remapImageRefs.
const STRIP_TAGS = ['w:bookmarkStart', 'w:bookmarkEnd', 'w:commentRangeStart', 'w:commentRangeEnd', 'w:commentReference', 'w:sectPr']

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

function cleanBodyNode(node) {
  const clone = node.cloneNode(true)
  STRIP_TAGS.forEach((tag) => {
    Array.from(clone.getElementsByTagName(tag)).forEach((el) => el.parentNode?.removeChild(el))
  })
  // A hyperlink references its target URL via a relationship we don't carry
  // over — keep the visible text, just drop the link wrapper around it.
  Array.from(clone.getElementsByTagName('w:hyperlink')).forEach((link) => {
    while (link.firstChild) link.parentNode.insertBefore(link.firstChild, link)
    link.parentNode.removeChild(link)
  })
  return clone
}

// .docx files are zip archives — unzip with JSZip and read word/document.xml.
// Several things come out of it: plain paragraph text (for the preview
// sidebar and the compiled outline), the raw, still-formatted XML nodes
// (for the download — so the cover and rubric keep their original layout,
// alignment, tables, and images untouched, and only the content gets
// reformatted), the embedded images those nodes reference, and the
// document's own namespace declarations (so drawings copied out of it
// still resolve their prefixes in the merged file). Only works for
// editable, zip-based .docx files, which is exactly why uploads are
// restricted to that format.
async function extractDocxDocument(file) {
  const buffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)
  const entry = zip.file('word/document.xml')
  if (!entry) throw new Error('Not a valid .docx file')
  const xml = await entry.async('text')
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Could not parse document')

  const body = doc.getElementsByTagName('w:body')[0]
  if (!body) throw new Error('Document has no body')

  // Relationship map for this document, so embedded images referenced from
  // the body (r:embed / r:id on a:blip / v:imagedata) can be resolved to
  // their actual image bytes.
  const media = {}
  const relsEntry = zip.file('word/_rels/document.xml.rels')
  if (relsEntry) {
    const relsXml = await relsEntry.async('text')
    const relsDoc = new DOMParser().parseFromString(relsXml, 'application/xml')
    for (const rel of Array.from(relsDoc.getElementsByTagName('Relationship'))) {
      const type = rel.getAttribute('Type') || ''
      if (!/\/image$/.test(type) || rel.getAttribute('TargetMode') === 'External') continue
      const target = rel.getAttribute('Target') || ''
      const partPath = target.startsWith('/') ? target.slice(1) : `word/${target}`
      const part = zip.file(partPath)
      if (!part) continue
      const data = await part.async('uint8array')
      const extension = (partPath.split('.').pop() || 'png').toLowerCase()
      media[rel.getAttribute('Id')] = { data, extension }
    }
  }

  const bodyNodes = Array.from(body.childNodes)
    .filter((node) => node.nodeType === 1 && node.tagName !== 'w:sectPr')
    .map(cleanBodyNode)

  const rootAttrs = {}
  Array.from(doc.documentElement.attributes).forEach((attr) => {
    if (attr.name === 'xmlns' || attr.name.startsWith('xmlns:')) rootAttrs[attr.name] = attr.value
  })

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
  return { paragraphs, bodyNodes, media, rootAttrs }
}

// Inserts `el` among `parent`'s existing children at the position `order`
// says it belongs, instead of just appending it at the end — keeps
// <w:pPr>/<w:rPr> children in the sequence Word's schema expects.
function insertInOrder(parent, el, order) {
  const index = order.indexOf(el.tagName)
  const ref = Array.from(parent.children).find((child) => {
    const childIndex = order.indexOf(child.tagName)
    return childIndex !== -1 && childIndex > index
  })
  parent.insertBefore(el, ref || null)
}

function setOrderedChild(parent, tag, order, attrs) {
  Array.from(parent.children).filter((el) => el.tagName === tag).forEach((el) => parent.removeChild(el))
  const el = parent.ownerDocument.createElementNS(W_NS, tag)
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
  insertInOrder(parent, el, order)
  return el
}

// Overrides font/size/line-spacing on every run in `bodyNodes`, leaving
// everything else (bold, italics, alignment, tables, images) untouched —
// this is what "only the content changes font and spacing" actually does.
function applyContentFormatting(bodyNodes, { font, size, line }) {
  return bodyNodes.map((node) => {
    const clone = node.cloneNode(true)
    const paragraphs = clone.tagName === 'w:p' ? [clone] : Array.from(clone.getElementsByTagName('w:p'))
    paragraphs.forEach((p) => {
      let pPr = p.getElementsByTagName('w:pPr')[0]
      if (!pPr) {
        pPr = p.ownerDocument.createElementNS(W_NS, 'w:pPr')
        p.insertBefore(pPr, p.firstChild)
      }
      setOrderedChild(pPr, 'w:spacing', PPR_ORDER, { 'w:line': String(line), 'w:lineRule': 'auto' })

      Array.from(p.getElementsByTagName('w:r')).forEach((r) => {
        let rPr = r.getElementsByTagName('w:rPr')[0]
        if (!rPr) {
          rPr = r.ownerDocument.createElementNS(W_NS, 'w:rPr')
          r.insertBefore(rPr, r.firstChild)
        }
        setOrderedChild(rPr, 'w:rFonts', RPR_ORDER, { 'w:ascii': font, 'w:hAnsi': font, 'w:cs': font, 'w:eastAsia': font })
        setOrderedChild(rPr, 'w:sz', RPR_ORDER, { 'w:val': String(size * 2) })
        setOrderedChild(rPr, 'w:szCs', RPR_ORDER, { 'w:val': String(size * 2) })
      })
    })
    return clone
  })
}

// Rewrites each image reference (DrawingML <a:blip r:embed/r:link> and its
// legacy VML fallback <v:imagedata r:id>) in `nodes` to a new relationship
// ID unique across the whole compiled document, and records the image's
// bytes + new relationship entry in `registry` so buildDocxBlob can add
// them to the final zip. `sourceKey` keeps two files' own "rId1"s from
// colliding with each other.
function remapImageRefs(nodes, media, registry, sourceKey) {
  if (!media || !Object.keys(media).length) return nodes
  const remapOn = (clone, tag, attr) => {
    Array.from(clone.getElementsByTagName(tag)).forEach((el) => {
      const oldId = el.getAttribute(attr)
      if (!oldId || !media[oldId]) return
      const key = `${sourceKey}:${oldId}`
      let newId = registry.map.get(key)
      if (!newId) {
        const info = media[oldId]
        const index = registry.relationships.length + 1
        const filename = `img_${sourceKey.replace(/[^a-z0-9]/gi, '')}_${index}.${info.extension}`
        newId = `rIdImg${index}`
        registry.files.push({ filename, data: info.data })
        registry.relationships.push({ id: newId, target: `media/${filename}` })
        registry.map.set(key, newId)
      }
      el.setAttribute(attr, newId)
    })
  }
  return nodes.map((node) => {
    const clone = node.cloneNode(true)
    remapOn(clone, 'a:blip', 'r:embed')
    remapOn(clone, 'a:blip', 'r:link')
    remapOn(clone, 'v:imagedata', 'r:id')
    return clone
  })
}

function unionRootAttrs(...sources) {
  const merged = { 'xmlns:w': W_NS, 'xmlns:r': R_NS }
  sources.forEach((attrs) => Object.assign(merged, attrs || {}))
  return merged
}

// Splices the cover, content blocks, and rubric's raw XML nodes into one
// document.xml, with plain page breaks between them and a bold heading
// ahead of each content block and the rubric.
function buildMergedDocumentXml({ coverNodes, contentBlocks, rubricNodes, headingFormat, rootAttrs }) {
  const attrsStr = Object.entries(rootAttrs).map(([key, value]) => `${key}="${value.replace(/"/g, '&quot;')}"`).join(' ')
  const shell = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${attrsStr}><w:body></w:body></w:document>`
  const finalDoc = new DOMParser().parseFromString(shell, 'application/xml')
  const body = finalDoc.getElementsByTagName('w:body')[0]

  const appendNodes = (nodes) => nodes.forEach((node) => body.appendChild(finalDoc.importNode(node, true)))

  function appendPageBreak() {
    const p = finalDoc.createElementNS(W_NS, 'w:p')
    const r = finalDoc.createElementNS(W_NS, 'w:r')
    const br = finalDoc.createElementNS(W_NS, 'w:br')
    br.setAttribute('w:type', 'page')
    r.appendChild(br)
    p.appendChild(r)
    body.appendChild(p)
  }

  function appendHeading(text) {
    const p = finalDoc.createElementNS(W_NS, 'w:p')
    const r = finalDoc.createElementNS(W_NS, 'w:r')
    const rPr = finalDoc.createElementNS(W_NS, 'w:rPr')
    const b = finalDoc.createElementNS(W_NS, 'w:b')
    const fonts = finalDoc.createElementNS(W_NS, 'w:rFonts')
    fonts.setAttribute('w:ascii', headingFormat.font); fonts.setAttribute('w:hAnsi', headingFormat.font)
    fonts.setAttribute('w:cs', headingFormat.font); fonts.setAttribute('w:eastAsia', headingFormat.font)
    const sz = finalDoc.createElementNS(W_NS, 'w:sz')
    sz.setAttribute('w:val', String(headingFormat.size * 2 + 4))
    const szCs = finalDoc.createElementNS(W_NS, 'w:szCs')
    szCs.setAttribute('w:val', String(headingFormat.size * 2 + 4))
    rPr.appendChild(fonts); rPr.appendChild(b); rPr.appendChild(sz); rPr.appendChild(szCs)
    r.appendChild(rPr)
    const t = finalDoc.createElementNS(W_NS, 'w:t')
    t.textContent = text
    r.appendChild(t)
    p.appendChild(r)
    body.appendChild(p)
  }

  appendNodes(coverNodes)
  contentBlocks.forEach((block) => {
    appendPageBreak()
    if (block.heading) appendHeading(block.heading)
    appendNodes(block.nodes)
  })
  appendPageBreak()
  appendHeading('Marking Rubric')
  appendNodes(rubricNodes)

  const sectPr = finalDoc.createElementNS(W_NS, 'w:sectPr')
  const pgSz = finalDoc.createElementNS(W_NS, 'w:pgSz')
  pgSz.setAttribute('w:w', '12240')
  pgSz.setAttribute('w:h', '15840')
  const pgMar = finalDoc.createElementNS(W_NS, 'w:pgMar')
  pgMar.setAttribute('w:top', '1440'); pgMar.setAttribute('w:right', '1440')
  pgMar.setAttribute('w:bottom', '1440'); pgMar.setAttribute('w:left', '1440')
  pgMar.setAttribute('w:header', '720'); pgMar.setAttribute('w:footer', '720'); pgMar.setAttribute('w:gutter', '0')
  sectPr.appendChild(pgSz)
  sectPr.appendChild(pgMar)
  body.appendChild(sectPr)

  return new XMLSerializer().serializeToString(finalDoc)
}

// Building a valid .docx from scratch means getting every supporting part
// right (styles, settings, font table, content types, relationships) — so
// instead we let the docx library generate a throwaway minimal document
// (which comes with all of that correctly in place) and then swap out just
// its word/document.xml for the one we spliced together ourselves.
async function buildDocxSkeletonZip() {
  const placeholder = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun('')] })] }] })
  const blob = await Packer.toBlob(placeholder)
  return JSZip.loadAsync(await blob.arrayBuffer())
}

// Adds every image the merge collected into the zip: the binary itself
// under word/media/, a relationship entry so document.xml's remapped
// r:embed/r:id values resolve, and a Content-Types default for any image
// extension the skeleton doesn't already declare (png/jpeg/gif/bmp/svg are
// covered out of the box).
async function addMediaToZip(zip, registry) {
  if (!registry.relationships.length) return
  registry.files.forEach(({ filename, data }) => zip.file(`word/media/${filename}`, data))

  const relsPath = 'word/_rels/document.xml.rels'
  const relsXml = await zip.file(relsPath).async('text')
  const insertion = registry.relationships
    .map(({ id, target }) => `<Relationship Id="${id}" Type="${IMAGE_REL_TYPE}" Target="${target}"/>`)
    .join('')
  zip.file(relsPath, relsXml.replace('</Relationships>', `${insertion}</Relationships>`))

  const ctPath = '[Content_Types].xml'
  let ctXml = await zip.file(ctPath).async('text')
  const neededExtensions = new Set(registry.files.map((f) => f.filename.split('.').pop().toLowerCase()))
  neededExtensions.forEach((ext) => {
    if (!new RegExp(`Extension="${ext}"`).test(ctXml)) {
      const contentType = EXT_CONTENT_TYPES[ext] || 'application/octet-stream'
      ctXml = ctXml.replace('</Types>', `<Default Extension="${ext}" ContentType="${contentType}"/></Types>`)
    }
  })
  zip.file(ctPath, ctXml)
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
      const { paragraphs, bodyNodes, media, rootAttrs } = await extractDocxDocument(picked)
      onChange({ name: picked.name, paragraphs, bodyNodes, media, rootAttrs })
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
    const headingFormat = { font, size }
    const registry = { relationships: [], files: [], map: new Map() }

    const coverNodes = remapImageRefs(coverFile.bodyNodes, coverFile.media, registry, 'cover')
    const rubricNodes = remapImageRefs(rubricFile.bodyNodes, rubricFile.media, registry, 'rubric')

    const contentBlocks = contentMode === 'merged'
      ? [{ nodes: remapImageRefs(applyContentFormatting(mergedFile.bodyNodes, { font, size, line }), mergedFile.media, registry, 'merged') }]
      : attachedSections.map((task, index) => ({
        heading: `Section ${index + 1}: ${task.title} — ${task.owner}`,
        nodes: remapImageRefs(applyContentFormatting(sectionFiles[task.id].bodyNodes, { font, size, line }), sectionFiles[task.id].media, registry, `section${index}`),
      }))

    const rootAttrs = unionRootAttrs(
      coverFile.rootAttrs,
      rubricFile.rootAttrs,
      contentMode === 'merged' ? mergedFile.rootAttrs : undefined,
      ...(contentMode === 'separate' ? attachedSections.map((task) => sectionFiles[task.id].rootAttrs) : []),
    )

    const xml = buildMergedDocumentXml({ coverNodes, contentBlocks, rubricNodes, headingFormat, rootAttrs })

    const zip = await buildDocxSkeletonZip()
    zip.file('word/document.xml', xml)
    await addMediaToZip(zip, registry)
    return zip.generateAsync({ type: 'blob' })
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
            <p className="small muted" style={{ marginTop: 16 }}>Content formatting: {formatSummary}. Cover and rubric keep their original formatting.</p>
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
                <p className="section-copy">Editable .docx files only. These carry into the compiled document exactly as uploaded — layout, alignment, formatting, and images untouched.</p>
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
                    <span>Everyone uploads their own part; Carry On orders them by section.</span>
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
                <p className="section-copy" style={{ marginBottom: 12 }}>Applied to the content only — the cover and rubric are left exactly as uploaded.</p>
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
                <div><strong>This is a prototype</strong><p>The .docx keeps your cover and rubric exactly as uploaded, images included — only the content's font and spacing change. Hyperlinks are simplified to plain text, and the PDF copy is a simplified plain-text version.</p></div>
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
