'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Code2, Download, FlaskConical, ImageUp, Layers3, Plus, RotateCcw, SlidersHorizontal, Trash2, Upload, X } from 'lucide-react'
import { CalculationPanel } from './CalculationPanel'
import { HistogramPlot } from './HistogramPlot'
import { ImageCanvas } from './ImageCanvas'
import { KernelExplorer } from './KernelExplorer'
import { MathFormula } from './MathFormula'
import { NeighborhoodExplorer } from './NeighborhoodExplorer'
import { TechniqueControls } from './TechniqueControls'
import { createDemoImage } from '@/lib/demoImage'
import { buildPixelExplanation } from '@/lib/explain'
import { LESSONS, lessonById } from '@/lib/lessons'
import { DEFAULT_SETTINGS, getPixel, kernelForTechnique, type InspectChannel, type PipelineStep, type PixelBuffer, type ProcessingSettings, type TechniqueId } from '@/lib/imageProcessing'
import { useProcessingWorker } from '@/hooks/useProcessingWorker'

function resizeUpload(image: HTMLImageElement, maximum = 1024): PixelBuffer {
  const scale = Math.min(1, maximum / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(image, 0, 0, width, height)
  return { width, height, data: context.getImageData(0, 0, width, height).data }
}

function StepLabel({ number, children, dark = false }: { number: number; children: React.ReactNode; dark?: boolean }) {
  return <div className="step-label"><span className={dark ? 'dark' : ''}>{number}</span><b>{children}</b></div>
}

export function ImageLab() {
  const [original, setOriginal] = useState<PixelBuffer>(() => createDemoImage())
  const [technique, setTechnique] = useState<TechniqueId>('gaussianBlur')
  const [settings, setSettings] = useState<ProcessingSettings>({ ...DEFAULT_SETTINGS })
  const [point, setPoint] = useState({ x: 382, y: 122 })
  const [inspectChannel, setInspectChannel] = useState<InspectChannel>('r')
  const [steps, setSteps] = useState<PipelineStep[]>([])
  const [lessonDrawer, setLessonDrawer] = useState(false)
  const [toast, setToast] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const lesson = lessonById(technique)
  const { pipelineInput, result, processing } = useProcessingWorker(original, steps, true, technique, settings)
  const kernel = kernelForTechnique(technique, settings)
  const neighborhoodSize = kernel?.length ?? (['median', 'morphology'].includes(technique) ? settings.kernelSize : ['sobel', 'canny'].includes(technique) ? 3 : 1)
  const grayscaleAlgorithm = ['threshold', 'otsu', 'equalize', 'sobel', 'laplacian', 'canny', 'morphology'].includes(technique)
  const effectiveChannel: InspectChannel = grayscaleAlgorithm ? 'y' : inspectChannel
  const explanation = useMemo(() => buildPixelExplanation(technique, settings, pipelineInput, result, point, effectiveChannel), [effectiveChannel, pipelineInput, point, result, settings, technique])
  const sourcePixel = getPixel(pipelineInput, point.x, point.y)
  const outputPoint = technique === 'resize' ? { x: Math.round((point.x + 0.5) * settings.resizeScale - 0.5), y: Math.round((point.y + 0.5) * settings.resizeScale - 0.5) } : point

  const updateSetting = <K extends keyof ProcessingSettings>(key: K, value: ProcessingSettings[K]) => setSettings((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    setPoint((current) => ({ x: Math.max(0, Math.min(pipelineInput.width - 1, current.x)), y: Math.max(0, Math.min(pipelineInput.height - 1, current.y)) }))
  }, [pipelineInput.height, pipelineInput.width])

  const chooseLesson = (id: TechniqueId) => {
    setTechnique(id)
    setLessonDrawer(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addStep = () => {
    setSteps((current) => [...current, { key: crypto.randomUUID(), technique, name: lesson.title, settings: { ...settings }, enabled: true }])
    setTechnique('channels')
    setSettings((current) => ({ ...current, channel: 'rgb' }))
    setToast(`${lesson.title} added. The current preview is now a neutral RGB pass.`)
    window.setTimeout(() => setToast(''), 4200)
  }

  const reset = () => {
    const demo = createDemoImage()
    setOriginal(demo)
    setTechnique('gaussianBlur')
    setSettings({ ...DEFAULT_SETTINGS })
    setPoint({ x: 382, y: 122 })
    setInspectChannel('r')
    setSteps([])
  }

  const upload = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const loaded = resizeUpload(image)
      URL.revokeObjectURL(url)
      setOriginal(loaded)
      setPoint({ x: Math.floor(loaded.width / 2), y: Math.floor(loaded.height / 2) })
      setSteps([])
    }
    image.onerror = () => URL.revokeObjectURL(url)
    image.src = url
  }

  const download = () => {
    const canvas = document.createElement('canvas')
    canvas.width = result.width
    canvas.height = result.height
    canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(result.data), result.width, result.height), 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const anchor = document.createElement('a')
      anchor.href = URL.createObjectURL(blob)
      anchor.download = `image-lab-${technique}.png`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1000)
    }, 'image/png')
  }

  return (
    <div className="lab-shell">
      <aside className="rail" aria-label="Application sections">
        <a className="rail-brand" href="#top"><span>IMAGE</span><b>LAB</b><i /></a>
        <nav>
          <a className="active" href="#lessons"><BookOpen size={19} /><span>Lessons</span></a>
          <a href="#pipeline"><Layers3 size={19} /><span>Pipeline</span></a>
          <a href="#calculation"><FlaskConical size={19} /><span>Math</span></a>
        </nav>
        <button className="rail-reset" onClick={reset}><RotateCcw size={18} /><span>Reset</span></button>
      </aside>

      <main id="top">
        <header className="site-header">
          <div><span>IMAGE PROCESSING FUNDAMENTALS</span><b>Every result should be explainable.</b></div>
          <div className="header-actions">
            <button onClick={() => inputRef.current?.click()}><Upload size={16} /> Upload</button>
            <button onClick={download}><Download size={16} /> Export</button>
            <button className="lesson-menu-button" onClick={() => setLessonDrawer(true)}><BookOpen size={16} /> Lessons</button>
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => { upload(event.target.files?.[0]); event.currentTarget.value = '' }} />
          </div>
        </header>

        <section className="lesson-hero">
          <div className="lesson-copy">
            <span className="eyebrow">LESSON {lesson.number} · {lesson.category.toUpperCase()}</span>
            <h1>{lesson.title}</h1>
            <p>{lesson.description}</p>
          </div>
          <div className="control-deck">
            <div className="control-title"><SlidersHorizontal size={15} /><span>VARIABLES</span></div>
            <TechniqueControls technique={technique} settings={settings} update={updateSetting} />
            <button className="add-pipeline" onClick={addStep}><Plus size={16} /> Commit step</button>
          </div>
        </section>

        <section className="process-flow" aria-label={`${lesson.title} visual walkthrough`}>
          <article className="flow-panel source-panel">
            <StepLabel number={1}>SOURCE</StepLabel>
            <p>Select a pixel. That exact coordinate drives every explanation below.</p>
            <ImageCanvas image={pipelineInput} label="PIPELINE INPUT" point={point} onPointChange={setPoint} processing={processing} />
            <div className="source-values"><code>({point.x}, {point.y})</code><span>R <b>{sourcePixel[0]}</b></span><span>G <b>{sourcePixel[1]}</b></span><span>B <b>{sourcePixel[2]}</b></span></div>
          </article>

          <span className="flow-arrow" aria-hidden="true">→</span>
          <article className="flow-panel neighborhood-panel">
            <StepLabel number={2}>{neighborhoodSize === 1 ? 'PIXEL' : 'NEIGHBORHOOD'}</StepLabel>
            <p>{neighborhoodSize === 1 ? 'This point operation reads only the selected pixel.' : `${neighborhoodSize}×${neighborhoodSize} samples centered on the selection.`}</p>
            <NeighborhoodExplorer image={pipelineInput} point={point} size={neighborhoodSize} channel={effectiveChannel} settings={settings} />
            <div className="inspect-channel"><span>DISPLAY</span>{((grayscaleAlgorithm ? ['y'] : ['r', 'g', 'b', 'y']) as InspectChannel[]).map((channel) => <button className={effectiveChannel === channel ? 'active' : ''} onClick={() => setInspectChannel(channel)} key={channel}>{channel.toUpperCase()}</button>)}</div>
          </article>

          <span className="flow-arrow" aria-hidden="true">→</span>
          <article className="flow-panel kernel-panel">
            <StepLabel number={3}>OPERATOR</StepLabel>
            <p>{lesson.formulaLabel}.{lesson.kind === 'neighborhood' || lesson.kind === 'multistage' ? <> Border: <b>{settings.borderMode}</b>.</> : ''}</p>
            <KernelExplorer technique={technique} settings={settings} />
            <div className="mini-formula"><MathFormula formula={lesson.formula} /></div>
          </article>

          <span className="flow-arrow" aria-hidden="true">→</span>
          <article className="flow-panel result-panel">
            <StepLabel number={4} dark>RESULT</StepLabel>
            <p>The processed image, with the corresponding output location marked.</p>
            <ImageCanvas image={result} label="OUTPUT" point={outputPoint} processing={processing} />
            <div className="result-callout"><span>{explanation.inputValue.toFixed(1)}</span><i>→</i><b>{explanation.outputValue.toFixed(1)}</b><small>{effectiveChannel.toUpperCase()} channel</small></div>
          </article>
        </section>

        <CalculationPanel lesson={lesson} explanation={explanation} channel={effectiveChannel} />
        <HistogramPlot input={pipelineInput} output={result} />

        <section className="pipeline-section" id="pipeline">
          <div className="section-heading"><div><span className="eyebrow">EXPERIMENT PIPELINE</span><h2>Build a reproducible recipe</h2></div><p>Committed steps run from left to right. The active lesson remains an uncommitted preview.</p></div>
          <div className="pipeline-track">
            <div className="pipeline-origin"><ImageUp size={18} /><span><b>Input</b><small>{original.width} × {original.height}</small></span></div>
            {steps.map((step, index) => (
              <div className={`pipeline-card ${step.enabled ? '' : 'disabled'}`} key={step.key}>
                <span>{index + 1}</span><div><b>{step.name}</b><small>{step.settings.kernelSize}×{step.settings.kernelSize} · {step.settings.borderMode}</small></div>
                <button aria-label={`Move ${step.name} earlier`} disabled={index === 0} onClick={() => setSteps((current) => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next })}><ChevronLeft size={13} /></button>
                <button aria-label={`Move ${step.name} later`} disabled={index === steps.length - 1} onClick={() => setSteps((current) => { const next = [...current]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next })}><ChevronRight size={13} /></button>
                <button onClick={() => setSteps((current) => current.map((item) => item.key === step.key ? { ...item, enabled: !item.enabled } : item))}>{step.enabled ? 'ON' : 'OFF'}</button>
                <button aria-label={`Remove ${step.name}`} onClick={() => setSteps((current) => current.filter((item) => item.key !== step.key))}><X size={14} /></button>
              </div>
            ))}
            {steps.length === 0 && <div className="empty-step"><Plus size={18} /><span>Tune a lesson, then commit it.</span></div>}
            {steps.length > 0 && <button className="clear-steps" onClick={() => setSteps([])}><Trash2 size={14} /> Clear</button>}
          </div>
        </section>

        <section className="lesson-index" id="lessons">
          <div className="section-heading"><div><span className="eyebrow">LESSON INDEX</span><h2>From one pixel to complete algorithms</h2></div><span>17 lessons</span></div>
          <div className="lesson-grid">
            {LESSONS.map((item) => <button className={technique === item.id ? 'active' : ''} onClick={() => chooseLesson(item.id)} key={item.id}><span>{item.number}</span><b>{item.shortTitle}</b><small>{item.category}</small></button>)}
          </div>
        </section>

        <footer><span>IMAGE LAB · All processing runs locally in your browser.</span><a href="https://github.com/opencv/opencv" target="_blank" rel="noreferrer"><Code2 size={14} /> Reference ecosystem</a></footer>
      </main>

      {lessonDrawer && <div className="lesson-drawer open">
        <div className="drawer-head"><b>Choose a lesson</b><button aria-label="Close lessons" onClick={() => setLessonDrawer(false)}><X /></button></div>
        {LESSONS.map((item) => <button className={technique === item.id ? 'active' : ''} onClick={() => chooseLesson(item.id)} key={item.id}><span>{item.number}</span><div><b>{item.title}</b><small>{item.category}</small></div><ChevronRight size={15} /></button>)}
      </div>}
      {lessonDrawer && <button className="drawer-backdrop" aria-label="Close lessons" onClick={() => setLessonDrawer(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
