'use client'

import type { ProcessingSettings, TechniqueId } from '@/lib/imageProcessing'

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <div className="segmented-control">{options.map((option) => <button type="button" className={value === option.value ? 'active' : ''} onClick={() => onChange(option.value)} key={option.value}>{option.label}</button>)}</div>
}

function Range({ label, symbol, value, min, max, step = 1, onChange }: { label: string; symbol: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="range-field">
      <span><b>{label}</b><code>{symbol} = {Number.isInteger(step) ? value : value.toFixed(2)}</code></span>
      <input type="range" value={value} min={min} max={max} step={step} style={{ '--progress': `${(value - min) / (max - min) * 100}%` } as React.CSSProperties} onChange={(event) => onChange(Number(event.target.value))} />
      <small><span>{min}</span><span>{max}</span></small>
    </label>
  )
}

interface ControlsProps {
  technique: TechniqueId
  settings: ProcessingSettings
  update: <K extends keyof ProcessingSettings>(key: K, value: ProcessingSettings[K]) => void
}

export function TechniqueControls({ technique, settings, update }: ControlsProps) {
  return (
    <div className="technique-controls">
      {technique === 'channels' && <Segmented value={settings.channel} onChange={(value) => update('channel', value)} options={[{ value: 'rgb', label: 'RGB' }, { value: 'red', label: 'R' }, { value: 'green', label: 'G' }, { value: 'blue', label: 'B' }]} />}
      {technique === 'grayscale' && <Segmented value={settings.grayMethod} onChange={(value) => update('grayMethod', value)} options={[{ value: 'weighted', label: 'BT.601 weighted' }, { value: 'average', label: 'Simple mean' }]} />}
      {technique === 'threshold' && <Range label="Decision threshold" symbol="T" value={settings.threshold} min={0} max={255} onChange={(value) => update('threshold', value)} />}
      {technique === 'tone' && <><Range label="Contrast gain" symbol="α" value={settings.contrast} min={0} max={2.5} step={0.05} onChange={(value) => update('contrast', value)} /><Range label="Brightness bias" symbol="β" value={settings.brightness} min={-100} max={100} onChange={(value) => update('brightness', value)} /></>}
      {technique === 'gamma' && <Range label="Power exponent" symbol="γ" value={settings.gamma} min={0.2} max={3} step={0.05} onChange={(value) => update('gamma', value)} />}
      {['boxBlur', 'gaussianBlur', 'median', 'morphology'].includes(technique) && <Segmented value={String(settings.kernelSize)} onChange={(value) => update('kernelSize', Number(value))} options={[3, 5, 7].map((size) => ({ value: String(size), label: `${size}×${size}` }))} />}
      {technique === 'gaussianBlur' && <Range label="Gaussian spread" symbol="σ" value={settings.sigma} min={0.4} max={3.5} step={0.05} onChange={(value) => update('sigma', value)} />}
      {technique === 'sharpen' && <Range label="Sharpen strength" symbol="s" value={settings.sharpenStrength} min={0} max={2} step={0.1} onChange={(value) => update('sharpenStrength', value)} />}
      {technique === 'sobel' && <Segmented value={settings.sobelDirection} onChange={(value) => update('sobelDirection', value)} options={[{ value: 'magnitude', label: '|G|' }, { value: 'x', label: 'Gx' }, { value: 'y', label: 'Gy' }]} />}
      {technique === 'canny' && <><Range label="Weak-edge threshold" symbol="Tlow" value={settings.cannyLow} min={0} max={254} onChange={(value) => update('cannyLow', Math.min(value, settings.cannyHigh - 1))} /><Range label="Strong-edge threshold" symbol="Thigh" value={settings.cannyHigh} min={1} max={255} onChange={(value) => update('cannyHigh', Math.max(value, settings.cannyLow + 1))} /></>}
      {technique === 'morphology' && <Segmented value={settings.morphologyOperation} onChange={(value) => update('morphologyOperation', value)} options={[{ value: 'erode', label: 'Erode' }, { value: 'dilate', label: 'Dilate' }, { value: 'open', label: 'Open' }, { value: 'close', label: 'Close' }]} />}
      {technique === 'resize' && <><Segmented value={settings.resizeMethod} onChange={(value) => update('resizeMethod', value)} options={[{ value: 'nearest', label: 'Nearest' }, { value: 'bilinear', label: 'Bilinear' }]} /><Range label="Output scale" symbol="s" value={settings.resizeScale} min={0.25} max={1.5} step={0.05} onChange={(value) => update('resizeScale', value)} /></>}
      {['boxBlur', 'gaussianBlur', 'median', 'sharpen', 'sobel', 'laplacian', 'canny', 'morphology'].includes(technique) && (
        <label className="select-field"><span>Border policy</span><select value={settings.borderMode} onChange={(event) => update('borderMode', event.target.value as ProcessingSettings['borderMode'])}><option value="reflect">Reflect</option><option value="replicate">Replicate</option><option value="wrap">Wrap</option><option value="constant">Constant zero</option></select></label>
      )}
      {['invert', 'otsu', 'equalize', 'laplacian'].includes(technique) && <p className="fixed-operation">This operation has no adjustable mathematical parameter. Select a different pixel to inspect its result.</p>}
    </div>
  )
}
