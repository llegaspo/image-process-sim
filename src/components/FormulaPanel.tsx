import type { PixelBuffer, ProcessingSettings, TechniqueId } from '../lib/imageProcessing'
import { gaussianKernel, getPixel, luminance } from '../lib/imageProcessing'

export interface TechniqueInfo {
  id: TechniqueId
  name: string
  eyebrow: string
  summary: string
  formula: string
  note: string
  sourceLabel: string
  sourceUrl: string
}

interface FormulaPanelProps {
  info: TechniqueInfo
  settings: ProcessingSettings
  before: PixelBuffer
  after: PixelBuffer
  selected: { x: number; y: number }
}

function calculateSubstitution(
  id: TechniqueId,
  settings: ProcessingSettings,
  input: [number, number, number, number],
  output: [number, number, number, number],
) {
  const [r, g, b] = input
  const y = luminance(r, g, b, settings.grayMethod)
  switch (id) {
    case 'channels': return `${settings.channel.toUpperCase()} channel → [${output[0]}, ${output[1]}, ${output[2]}]`
    case 'grayscale': return settings.grayMethod === 'weighted'
      ? `0.299(${r}) + 0.587(${g}) + 0.114(${b}) = ${output[0]}`
      : `(${r} + ${g} + ${b}) ÷ 3 = ${output[0]}`
    case 'threshold': return `${Math.round(luminance(r, g, b))} ${y > settings.threshold ? '>' : '≤'} ${settings.threshold} → ${output[0]}`
    case 'tone': return `${settings.contrast.toFixed(2)}(${r}) ${settings.brightness >= 0 ? '+' : '−'} ${Math.abs(settings.brightness)} → ${output[0]} (R)`
    case 'invert': return `255 − ${r} = ${output[0]} (R)`
    case 'boxBlur': return `${settings.kernelSize ** 2} neighbors × ${(1 / settings.kernelSize ** 2).toFixed(3)} → ${output[0]} (R)`
    case 'gaussianBlur': return `Σ(neighbor × weight), σ = ${settings.sigma.toFixed(2)} → ${output[0]} (R)`
    case 'median': return `middle of ${settings.kernelSize ** 2} sorted values → ${output[0]} (R)`
    case 'sharpen': return `center × ${(1 + 4 * settings.sharpenStrength).toFixed(1)} − neighbors × ${settings.sharpenStrength.toFixed(1)} → ${output[0]} (R)`
    case 'sobel': return `${settings.sobelDirection === 'magnitude' ? '√(Gx² + Gy²)' : `|G${settings.sobelDirection}|`} → ${output[0]}`
    case 'equalize': return `CDF(${Math.round(luminance(r, g, b))}) mapped to full range → ${output[0]}`
  }
}

export function FormulaPanel({ info, settings, before, after, selected }: FormulaPanelProps) {
  const input = getPixel(before, selected.x, selected.y)
  const output = getPixel(after, selected.x, selected.y)
  const kernel = info.id === 'gaussianBlur'
    ? gaussianKernel(settings.kernelSize, settings.sigma)
    : info.id === 'boxBlur'
      ? Array.from({ length: settings.kernelSize }, () => Array.from({ length: settings.kernelSize }, () => 1 / settings.kernelSize ** 2))
      : info.id === 'sharpen'
        ? [[0, -settings.sharpenStrength, 0], [-settings.sharpenStrength, 1 + 4 * settings.sharpenStrength, -settings.sharpenStrength], [0, -settings.sharpenStrength, 0]]
        : null

  return (
    <section className="formula-panel" aria-labelledby="formula-heading">
      <div className="formula-heading-row">
        <div>
          <span className="section-kicker">THE MATH</span>
          <h2 id="formula-heading">{info.name}</h2>
        </div>
        <span className="coordinate-pill">x {selected.x} · y {selected.y}</span>
      </div>
      <p className="formula-summary">{info.summary}</p>
      <div className="equation-block">
        <span>GENERAL FORMULA</span>
        <code>{info.formula}</code>
      </div>
      <div className="substitution-block">
        <span>YOUR SELECTED PIXEL</span>
        <code>{calculateSubstitution(info.id, settings, input, output)}</code>
      </div>
      {kernel && (
        <div className="kernel-wrap">
          <span className="mini-label">LIVE KERNEL · values rounded for display</span>
          <div className="kernel-grid" style={{ gridTemplateColumns: `repeat(${kernel.length}, 1fr)` }}>
            {kernel.flat().map((value, index) => <span key={index}>{Math.abs(value) < 0.001 ? '0' : value.toFixed(3)}</span>)}
          </div>
          <div className="kernel-sum">Σ weights = {kernel.flat().reduce((sum, value) => sum + value, 0).toFixed(3)}</div>
        </div>
      )}
      <div className="accuracy-note"><b>Why it works</b><span>{info.note}</span></div>
      <a className="reference-link" href={info.sourceUrl} target="_blank" rel="noreferrer">Reference · {info.sourceLabel} ↗</a>
    </section>
  )
}
