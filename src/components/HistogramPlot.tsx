'use client'

import { useMemo } from 'react'
import { histogram, type PixelBuffer } from '@/lib/imageProcessing'

export function HistogramPlot({ input, output }: { input: PixelBuffer; output: PixelBuffer }) {
  const [inputBins, outputBins] = useMemo(() => [histogram(input), histogram(output)], [input, output])
  const max = Math.max(...inputBins, ...outputBins, 1)
  const points = (bins: number[]) => bins.map((value, index) => `${index},${60 - value / max * 56}`).join(' ')
  return (
    <div className="histogram-plot">
      <div><span>INTENSITY HISTOGRAM</span><span className="plot-legend"><i /> source <i /> result</span></div>
      <svg viewBox="0 0 255 64" preserveAspectRatio="none" aria-label="Input and output intensity histograms"><polyline points={points(inputBins)} /><polyline className="output-line" points={points(outputBins)} /></svg>
      <small><span>0 · black</span><span>255 · white</span></small>
    </div>
  )
}
