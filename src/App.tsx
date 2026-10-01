import { useMemo, useRef, useState } from 'react'
import {
  Aperture,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Blend,
  CircleDot,
  Contrast,
  Download,
  Eye,
  EyeOff,
  FlaskConical,
  Grid3X3,
  ImagePlus,
  Layers3,
  Menu,
  Minus,
  Plus,
  RotateCcw,
  ScanLine,
  Sparkles,
  SunMedium,
  Trash2,
  Upload,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react'
import { FormulaPanel, type TechniqueInfo } from './components/FormulaPanel'
import { HistogramChart } from './components/HistogramChart'
import { ImageStage } from './components/ImageStage'
import { PixelGrid } from './components/PixelGrid'
import { createDemoImage } from './lib/demoImage'
import {
  DEFAULT_SETTINGS,
  processImage,
  type PixelBuffer,
  type ProcessingSettings,
  type TechniqueId,
} from './lib/imageProcessing'

interface Technique extends TechniqueInfo {
  category: 'Foundations' | 'Point operations' | 'Neighborhoods' | 'Analysis'
  icon: LucideIcon
}

const TECHNIQUES: Technique[] = [
  {
    id: 'channels', name: 'RGB channels', eyebrow: '01 · COLOR', category: 'Foundations', icon: Aperture,
    summary: 'A color pixel stores separate red, green, and blue intensities. Isolating a channel reveals how much of that primary color contributes at every location.',
    formula: 'P(x, y) = [R, G, B], each in [0, 255]',
    note: 'Screens create color additively. Zero means none of a channel; 255 means its maximum encoded intensity.',
    sourceLabel: 'MDN ImageData pixel layout', sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/ImageData/data',
  },
  {
    id: 'grayscale', name: 'RGB → grayscale', eyebrow: '02 · COLOR', category: 'Foundations', icon: Blend,
    summary: 'Grayscale stores one intensity. Weighted conversion gives green the largest influence because equal numeric RGB values do not contribute equally to encoded luma.',
    formula: 'Y = 0.299R + 0.587G + 0.114B',
    note: 'This is the conventional BT.601/OpenCV 8-bit luma transform. Gray becomes RGB again by copying Y into R, G, and B.',
    sourceLabel: 'OpenCV color conversions', sourceUrl: 'https://docs.opencv.org/4.x/de/d25/imgproc_color_conversions.html',
  },
  {
    id: 'threshold', name: 'Black & white', eyebrow: '03 · SEGMENT', category: 'Foundations', icon: CircleDot,
    summary: 'Thresholding makes a truly binary image: every pixel becomes either black or white according to its grayscale intensity.',
    formula: 'B(x,y) = Y > T ? 255 : 0',
    note: 'Moving T changes the decision boundary. Unlike grayscale, the result has only two possible intensity values.',
    sourceLabel: 'OpenCV thresholding', sourceUrl: 'https://docs.opencv.org/4.x/d7/d4d/tutorial_py_thresholding.html',
  },
  {
    id: 'tone', name: 'Brightness & contrast', eyebrow: '04 · TONE', category: 'Point operations', icon: SunMedium,
    summary: 'Brightness adds a bias to every channel. Contrast applies a gain, expanding or compressing the encoded values.',
    formula: "C' = clamp(aC + b)",
    note: 'The clamp is essential: an 8-bit channel cannot represent a result below 0 or above 255.',
    sourceLabel: 'OpenCV linear transforms', sourceUrl: 'https://docs.opencv.org/4.x/d3/dc1/tutorial_basic_linear_transform.html',
  },
  {
    id: 'invert', name: 'Invert', eyebrow: '05 · TONE', category: 'Point operations', icon: Contrast,
    summary: 'Inversion reflects each channel around the center of its 8-bit range, producing the encoded color complement.',
    formula: "C' = 255 − C",
    note: 'This operation is its own inverse: applying it twice returns the original channel values.',
    sourceLabel: 'OpenCV pixelwise operations', sourceUrl: 'https://docs.opencv.org/4.x/d2/de8/group__core__array.html',
  },
  {
    id: 'boxBlur', name: 'Box blur', eyebrow: '06 · FILTER', category: 'Neighborhoods', icon: Grid3X3,
    summary: 'A box blur replaces every pixel with the equally weighted average of a square neighborhood.',
    formula: "I'(x,y) = Σ K(i,j)I(x+i,y+j), K = 1/n²",
    note: 'Larger kernels average more neighbors, removing detail but producing a characteristically flat blur.',
    sourceLabel: 'OpenCV smoothing filters', sourceUrl: 'https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html',
  },
  {
    id: 'gaussianBlur', name: 'Gaussian blur', eyebrow: '07 · FILTER', category: 'Neighborhoods', icon: Waves,
    summary: 'Gaussian blur is a weighted neighborhood average. Nearby pixels matter more than distant pixels, producing a smoother result than a box average.',
    formula: 'G(x,y) = exp(−(x²+y²)/(2σ²)) / ΣG',
    note: 'Normalizing the sampled weights to sum to 1 preserves constant brightness. Sigma controls the spread of the bell-shaped weights.',
    sourceLabel: 'OpenCV Gaussian smoothing', sourceUrl: 'https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html',
  },
  {
    id: 'median', name: 'Median filter', eyebrow: '08 · FILTER', category: 'Neighborhoods', icon: Layers3,
    summary: 'The median filter sorts neighboring values and chooses the middle one instead of averaging them.',
    formula: "I'(x,y) = median{I(x+i,y+j)}",
    note: 'Because the output is an observed neighborhood value, median filtering is effective against isolated salt-and-pepper noise while preserving edges.',
    sourceLabel: 'OpenCV median smoothing', sourceUrl: 'https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html',
  },
  {
    id: 'sharpen', name: 'Sharpen', eyebrow: '09 · FILTER', category: 'Neighborhoods', icon: Sparkles,
    summary: 'Sharpening boosts local differences by subtracting the four direct neighbors from an amplified center pixel.',
    formula: "I' = I + s(4I − Iₙ − Iₛ − Iₑ − I𝓌)",
    note: 'The kernel weights still sum to 1, so uniform areas are unchanged while rapid intensity changes become stronger.',
    sourceLabel: 'OpenCV mask operations', sourceUrl: 'https://docs.opencv.org/5.0/tutorials/core/mat-mask-operations/mat_mask_operations.html',
  },
  {
    id: 'sobel', name: 'Sobel edges', eyebrow: '10 · EDGES', category: 'Analysis', icon: ScanLine,
    summary: 'Sobel estimates horizontal and vertical intensity derivatives with two 3×3 kernels, then combines them into edge strength.',
    formula: 'G = √(Gx² + Gy²)',
    note: 'Large gradients indicate rapid intensity changes. The output is clipped to the visible 8-bit range after calculating the derivatives.',
    sourceLabel: 'OpenCV Sobel derivatives', sourceUrl: 'https://docs.opencv.org/4.x/d2/d2c/tutorial_sobel_derivatives.html',
  },
  {
    id: 'equalize', name: 'Histogram equalization', eyebrow: '11 · CONTRAST', category: 'Analysis', icon: BarChart3,
    summary: 'Equalization remaps grayscale intensities using their cumulative distribution so the available tonal range is used more fully.',
    formula: "Y' = round((CDF(Y) − CDFmin)/(N − CDFmin) × 255)",
    note: 'This global mapping can reveal low-contrast detail, though it may also exaggerate noise and does not guarantee a perfectly flat histogram.',
    sourceLabel: 'OpenCV histogram equalization', sourceUrl: 'https://docs.opencv.org/4.x/d4/d1b/tutorial_histogram_equalization.html',
  },
]

interface PipelineStep {
  key: string
  technique: TechniqueId
  name: string
  settings: ProcessingSettings
  enabled: boolean
}

const groupedTechniques = Object.entries(
  TECHNIQUES.reduce<Record<string, Technique[]>>((groups, technique) => {
    ;(groups[technique.category] ??= []).push(technique)
    return groups
  }, {}),
)

function Segmented<T extends string>({ value, values, onChange }: { value: T; values: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="segmented">
      {values.map((item) => (
        <button className={value === item.value ? 'active' : ''} onClick={() => onChange(item.value)} key={item.value}>{item.label}</button>
      ))}
    </div>
  )
}

function RangeControl({ label, value, min, max, step = 1, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  const progress = ((value - min) / (max - min)) * 100
  return (
    <label className="range-control">
      <span><b>{label}</b><code>{Number.isInteger(step) ? value : value.toFixed(2)}{suffix}</code></span>
      <input type="range" min={min} max={max} step={step} value={value} style={{ '--range-progress': `${progress}%` } as React.CSSProperties} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="range-bounds"><i>{min}</i><i>{max}</i></span>
    </label>
  )
}

function TechniqueControls({ id, settings, update }: { id: TechniqueId; settings: ProcessingSettings; update: <K extends keyof ProcessingSettings>(key: K, value: ProcessingSettings[K]) => void }) {
  switch (id) {
    case 'channels':
      return <Segmented value={settings.channel} onChange={(value) => update('channel', value)} values={[{ value: 'rgb', label: 'RGB' }, { value: 'red', label: 'Red' }, { value: 'green', label: 'Green' }, { value: 'blue', label: 'Blue' }]} />
    case 'grayscale':
      return <Segmented value={settings.grayMethod} onChange={(value) => update('grayMethod', value)} values={[{ value: 'weighted', label: 'Weighted' }, { value: 'average', label: 'Simple average' }]} />
    case 'threshold':
      return <RangeControl label="Threshold T" value={settings.threshold} min={0} max={255} onChange={(value) => update('threshold', value)} />
    case 'tone':
      return <><RangeControl label="Brightness b" value={settings.brightness} min={-100} max={100} onChange={(value) => update('brightness', value)} /><RangeControl label="Contrast a" value={settings.contrast} min={0} max={2.5} step={0.05} onChange={(value) => update('contrast', value)} /></>
    case 'boxBlur':
    case 'median':
      return <Segmented value={String(settings.kernelSize)} onChange={(value) => update('kernelSize', Number(value))} values={[3, 5, 7].map((value) => ({ value: String(value), label: `${value}×${value}` }))} />
    case 'gaussianBlur':
      return <><Segmented value={String(settings.kernelSize)} onChange={(value) => update('kernelSize', Number(value))} values={[3, 5, 7].map((value) => ({ value: String(value), label: `${value}×${value}` }))} /><RangeControl label="Spread σ" value={settings.sigma} min={0.4} max={3.5} step={0.05} onChange={(value) => update('sigma', value)} /></>
    case 'sharpen':
      return <RangeControl label="Strength s" value={settings.sharpenStrength} min={0} max={2} step={0.1} onChange={(value) => update('sharpenStrength', value)} />
    case 'sobel':
      return <Segmented value={settings.sobelDirection} onChange={(value) => update('sobelDirection', value)} values={[{ value: 'magnitude', label: 'Magnitude' }, { value: 'x', label: 'Gx' }, { value: 'y', label: 'Gy' }]} />
    default:
      return <div className="no-controls">This operation has no parameters. Inspect different pixels to explore it.</div>
  }
}

function resizeLoadedImage(image: HTMLImageElement, maxDimension = 900): PixelBuffer {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(image, 0, 0, width, height)
  const data = context.getImageData(0, 0, width, height).data
  return { width, height, data }
}

export default function App() {
  const [original, setOriginal] = useState<PixelBuffer>(() => createDemoImage())
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueId>('grayscale')
  const [settings, setSettings] = useState<ProcessingSettings>({ ...DEFAULT_SETTINGS })
  const [steps, setSteps] = useState<PipelineStep[]>([])
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const [selectedPixel, setSelectedPixel] = useState({ x: 282, y: 226 })
  const [split, setSplit] = useState(50)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const selectedInfo = TECHNIQUES.find((technique) => technique.id === selectedTechnique)!

  const pipelineImage = useMemo(
    () => steps.reduce((image, step) => step.enabled ? processImage(image, step.technique, step.settings) : image, original),
    [original, steps],
  )
  const result = useMemo(
    () => previewEnabled ? processImage(pipelineImage, selectedTechnique, settings) : pipelineImage,
    [pipelineImage, previewEnabled, selectedTechnique, settings],
  )
  const comparisonInput = previewEnabled ? pipelineImage : original

  const updateSetting = <K extends keyof ProcessingSettings>(key: K, value: ProcessingSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setPreviewEnabled(true)
  }

  const chooseTechnique = (id: TechniqueId) => {
    setSelectedTechnique(id)
    setPreviewEnabled(true)
    setMobileNavOpen(false)
  }

  const addStep = () => {
    setSteps((current) => [...current, { key: crypto.randomUUID(), technique: selectedTechnique, name: selectedInfo.name, settings: { ...settings }, enabled: true }])
    setPreviewEnabled(false)
  }

  const editStep = (key: string, action: 'toggle' | 'up' | 'down' | 'remove') => {
    setSteps((current) => {
      const index = current.findIndex((step) => step.key === key)
      if (index < 0) return current
      if (action === 'remove') return current.filter((step) => step.key !== key)
      if (action === 'toggle') return current.map((step) => step.key === key ? { ...step, enabled: !step.enabled } : step)
      const target = action === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setPreviewEnabled(false)
  }

  const resetAll = () => {
    setOriginal(createDemoImage())
    setSettings({ ...DEFAULT_SETTINGS })
    setSelectedTechnique('grayscale')
    setSteps([])
    setPreviewEnabled(true)
    setSelectedPixel({ x: 282, y: 226 })
    setSplit(50)
  }

  const uploadImage = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const loaded = resizeLoadedImage(image)
      URL.revokeObjectURL(url)
      setOriginal(loaded)
      setSteps([])
      setPreviewEnabled(true)
      setSelectedPixel({ x: Math.floor(loaded.width / 2), y: Math.floor(loaded.height / 2) })
    }
    image.src = url
  }

  const downloadResult = () => {
    const canvas = document.createElement('canvas')
    canvas.width = result.width
    canvas.height = result.height
    canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(result.data), result.width, result.height), 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'pixel-forge-result.png'
      link.click()
      setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    }, 'image/png')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Pixel Forge home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span><b>PIXEL</b> FORGE</span>
        </a>
        <div className="topbar-center"><FlaskConical size={15} /><span>Interactive Image Processing Lab</span></div>
        <div className="topbar-actions">
          <button className="ghost-button desktop-only" onClick={resetAll}><RotateCcw size={16} /> Reset</button>
          <button className="dark-button" onClick={() => fileInput.current?.click()}><Upload size={16} /> <span>Upload image</span></button>
          <button className="icon-button mobile-menu-button" onClick={() => setMobileNavOpen((open) => !open)} aria-label="Toggle lessons"><Menu size={20} /></button>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => uploadImage(event.target.files?.[0])} />
        </div>
      </header>

      <aside className={`lesson-nav ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="nav-mobile-heading"><b>Choose a lesson</b><button onClick={() => setMobileNavOpen(false)} aria-label="Close lessons"><X size={20} /></button></div>
        <div className="course-progress">
          <div><span>IMAGE PROCESSING</span><b>11 interactive lessons</b></div>
          <span className="progress-ring">{String(TECHNIQUES.findIndex((item) => item.id === selectedTechnique) + 1).padStart(2, '0')}</span>
        </div>
        <nav aria-label="Image processing lessons">
          {groupedTechniques.map(([category, techniques]) => (
            <div className="nav-group" key={category}>
              <span className="nav-group-label">{category}</span>
              {techniques.map((technique) => {
                const Icon = technique.icon
                return (
                  <button className={selectedTechnique === technique.id ? 'active' : ''} onClick={() => chooseTechnique(technique.id)} key={technique.id}>
                    <Icon size={17} /><span>{technique.name}</span><i>{String(TECHNIQUES.indexOf(technique) + 1).padStart(2, '0')}</i>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="privacy-note"><ImagePlus size={18} /><span><b>Your images stay local.</b><br />All processing happens in this browser.</span></div>
      </aside>

      <main id="top" className="workspace">
        <section className="lesson-intro">
          <div>
            <span className="lesson-eyebrow">{selectedInfo.eyebrow}</span>
            <h1>{selectedInfo.name}</h1>
            <p>{selectedInfo.summary}</p>
          </div>
          <div className="lesson-actions">
            <button className="ghost-button" onClick={() => setSplit(50)}><Minus size={15} /> Compare</button>
            <button className="ghost-button" onClick={downloadResult}><Download size={15} /> Export PNG</button>
          </div>
        </section>

        <ImageStage before={comparisonInput} after={result} split={split} onSplitChange={setSplit} selectedPixel={selectedPixel} onSelectPixel={setSelectedPixel} />

        <section className="lab-grid">
          <div className="pixel-inspector">
            <div className="section-title-row"><div><span className="section-kicker">UNDER THE MICROSCOPE</span><h2>A 5×5 neighborhood</h2></div><span>Center pixel marked ×</span></div>
            <div className="pixel-grid-pair">
              <PixelGrid image={comparisonInput} selected={selectedPixel} label="INPUT" />
              <div className="pixel-arrow">→</div>
              <PixelGrid image={result} selected={selectedPixel} label="RESULT" />
            </div>
          </div>
          <HistogramChart before={comparisonInput} after={result} />
        </section>

        <section className="pipeline-section">
          <div className="section-title-row">
            <div><span className="section-kicker">PROCESSING RECIPE</span><h2>Your pipeline</h2></div>
            <span>Steps run from left to right</span>
          </div>
          {steps.length === 0 ? (
            <div className="empty-pipeline"><Layers3 size={22} /><span><b>No committed steps yet.</b> Tune a lesson, then add it from the controls panel.</span></div>
          ) : (
            <div className="pipeline-list">
              {steps.map((step, index) => (
                <div className={`pipeline-step ${step.enabled ? '' : 'disabled'}`} key={step.key}>
                  <span className="step-index">{index + 1}</span>
                  <span className="step-name">{step.name}</span>
                  <div className="step-actions">
                    <button onClick={() => editStep(step.key, 'toggle')} title={step.enabled ? 'Disable step' : 'Enable step'}>{step.enabled ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                    <button onClick={() => editStep(step.key, 'up')} disabled={index === 0} title="Move earlier"><ArrowUp size={15} /></button>
                    <button onClick={() => editStep(step.key, 'down')} disabled={index === steps.length - 1} title="Move later"><ArrowDown size={15} /></button>
                    <button onClick={() => editStep(step.key, 'remove')} title="Remove step"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              <button className="clear-pipeline" onClick={() => { setSteps([]); setPreviewEnabled(true) }}><Trash2 size={14} /> Clear all</button>
            </div>
          )}
        </section>
      </main>

      <aside className="controls-rail">
        <section className="controls-card">
          <div className="controls-card-heading">
            <div><span className="section-kicker">CONTROLS</span><h2>Change the variables</h2></div>
            {!previewEnabled && <span className="committed-badge">COMMITTED</span>}
          </div>
          <TechniqueControls id={selectedTechnique} settings={settings} update={updateSetting} />
          {previewEnabled ? (
            <button className="add-step-button" onClick={addStep}><Plus size={17} /> Add this step to pipeline</button>
          ) : (
            <button className="add-step-button secondary" onClick={() => setPreviewEnabled(true)}><Eye size={17} /> Preview this lesson again</button>
          )}
          <p className="controls-help">Preview uses the pipeline’s current result as its input. Committing captures these exact settings.</p>
        </section>
        {previewEnabled ? (
          <FormulaPanel info={selectedInfo} settings={settings} before={comparisonInput} after={result} selected={selectedPixel} />
        ) : (
          <section className="committed-panel">
            <span className="committed-check">✓</span>
            <span className="section-kicker">STEP SAVED</span>
            <h2>{selectedInfo.name} joined the pipeline.</h2>
            <p>The canvas now shows the full recipe against the original. Preview this lesson again or choose another technique to keep experimenting.</p>
          </section>
        )}
        <section className="data-contract">
          <span>8-BIT IMAGE MODEL</span>
          <div><i className="red-dot" />R <code>0—255</code></div>
          <div><i className="green-dot" />G <code>0—255</code></div>
          <div><i className="blue-dot" />B <code>0—255</code></div>
          <p>Results are rounded to the nearest integer and clamped. Alpha is preserved.</p>
        </section>
      </aside>
    </div>
  )
}
