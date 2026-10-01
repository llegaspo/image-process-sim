import { useMemo } from 'react'
import type { PixelBuffer } from '../lib/imageProcessing'
import { histogram } from '../lib/imageProcessing'

export function HistogramChart({ before, after }: { before: PixelBuffer; after: PixelBuffer }) {
  const [beforeBins, afterBins] = useMemo(() => [histogram(before), histogram(after)], [before, after])
  const max = Math.max(...beforeBins, ...afterBins, 1)
  const beforePoints = beforeBins.map((value, index) => `${index},${72 - (value / max) * 68}`).join(' ')
  const afterPoints = afterBins.map((value, index) => `${index},${72 - (value / max) * 68}`).join(' ')
  return (
    <div className="histogram-card">
      <div className="histogram-title">
        <span>Intensity distribution</span>
        <span className="legend"><i /> input <i /> result</span>
      </div>
      <svg viewBox="0 0 255 76" preserveAspectRatio="none" aria-label="Before and after intensity histograms">
        <polyline points={beforePoints} fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <polyline points={afterPoints} fill="none" stroke="#ef6652" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="histogram-axis"><span>0 · black</span><span>255 · white</span></div>
    </div>
  )
}
