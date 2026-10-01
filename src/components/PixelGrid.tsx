import type { PixelBuffer } from '../lib/imageProcessing'
import { getPixel } from '../lib/imageProcessing'

interface PixelGridProps {
  image: PixelBuffer
  selected: { x: number; y: number }
  label: string
}

export function PixelGrid({ image, selected, label }: PixelGridProps) {
  const radius = 2
  const cells = []
  for (let y = selected.y - radius; y <= selected.y + radius; y += 1) {
    for (let x = selected.x - radius; x <= selected.x + radius; x += 1) {
      const [r, g, b] = getPixel(image, x, y)
      const isCenter = x === selected.x && y === selected.y
      cells.push(
        <div
          className={`pixel-cell ${isCenter ? 'is-center' : ''}`}
          style={{ backgroundColor: `rgb(${r} ${g} ${b})` }}
          title={`(${Math.max(0, Math.min(image.width - 1, x))}, ${Math.max(0, Math.min(image.height - 1, y))}) · ${r}, ${g}, ${b}`}
          key={`${x}-${y}`}
        >
          {isCenter && <span>×</span>}
        </div>,
      )
    }
  }
  const [r, g, b] = getPixel(image, selected.x, selected.y)
  return (
    <div className="pixel-grid-card">
      <div className="pixel-grid-header">
        <span>{label}</span>
        <code>({selected.x}, {selected.y})</code>
      </div>
      <div className="pixel-grid">{cells}</div>
      <div className="pixel-values" aria-label={`${label} RGB values`}>
        <span className="red">R <b>{r}</b></span>
        <span className="green">G <b>{g}</b></span>
        <span className="blue">B <b>{b}</b></span>
      </div>
    </div>
  )
}
