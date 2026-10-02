'use client'

import { sampleChannel, type InspectChannel, type PixelBuffer, type ProcessingSettings } from '@/lib/imageProcessing'

interface NeighborhoodExplorerProps {
  image: PixelBuffer
  point: { x: number; y: number }
  size: number
  channel: InspectChannel
  settings: ProcessingSettings
}

export function NeighborhoodExplorer({ image, point, size, channel, settings }: NeighborhoodExplorerProps) {
  const radius = Math.floor(size / 2)
  const cells = []
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const value = sampleChannel(image, point.x + dx, point.y + dy, channel, settings.borderMode)
      const center = dx === 0 && dy === 0
      cells.push(
        <div className={`neighbor-cell ${center ? 'center' : ''}`} key={`${dx}:${dy}`} style={{ background: `rgb(${value} ${value} ${value})`, color: value > 145 ? '#171917' : '#fff' }} title={`offset (${dx}, ${dy}), value ${value.toFixed(3)}`}>
          <b>{Math.round(value)}</b><small>{dx >= 0 ? '+' : ''}{dx},{dy >= 0 ? '+' : ''}{dy}</small>
        </div>,
      )
    }
  }
  return (
    <div className="neighbor-explorer">
      <div className="matrix-grid neighborhood" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>{cells}</div>
      <div className="neighbor-caption">
        <span>center <b>({point.x}, {point.y})</b></span>
        <span>{size} × {size} = <b>{size * size} samples</b></span>
      </div>
      <div className="neighbor-definitions">
        <span><b>N₄</b> axial neighbors</span>
        <span><b>N₈</b> N₄ + diagonals</span>
        <span><b>Wᵣ</b> square window, r = {radius}</span>
      </div>
    </div>
  )
}
