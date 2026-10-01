import { useEffect, useRef } from 'react'
import { ScanSearch } from 'lucide-react'
import type { PixelBuffer } from '../lib/imageProcessing'

interface ImageStageProps {
  before: PixelBuffer
  after: PixelBuffer
  split: number
  onSplitChange: (value: number) => void
  selectedPixel: { x: number; y: number }
  onSelectPixel: (point: { x: number; y: number }) => void
}

function PaintCanvas({ image, className, style }: { image: PixelBuffer; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = image.width
    canvas.height = image.height
    canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0)
  }, [image])
  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />
}

export function ImageStage({ before, after, split, onSplitChange, selectedPixel, onSelectPixel }: ImageStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)

  const selectFromPointer = (clientX: number, clientY: number) => {
    const bounds = stageRef.current?.getBoundingClientRect()
    if (!bounds) return
    onSelectPixel({
      x: Math.max(0, Math.min(before.width - 1, Math.floor(((clientX - bounds.left) / bounds.width) * before.width))),
      y: Math.max(0, Math.min(before.height - 1, Math.floor(((clientY - bounds.top) / bounds.height) * before.height))),
    })
  }

  return (
    <div className="image-stage-shell">
      <div
        className="image-stage"
        ref={stageRef}
        style={{ aspectRatio: `${before.width} / ${before.height}` }}
        onClick={(event) => selectFromPointer(event.clientX, event.clientY)}
        role="img"
        aria-label="Interactive before and after image. Click to inspect a pixel."
      >
        <PaintCanvas image={after} className="image-layer image-after" />
        <PaintCanvas image={before} className="image-layer image-before" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
        <div className="split-line" style={{ left: `${split}%` }} aria-hidden="true">
          <span className="split-handle"><span>‹</span><span>›</span></span>
        </div>
        <div
          className="pixel-marker"
          style={{ left: `${((selectedPixel.x + 0.5) / before.width) * 100}%`, top: `${((selectedPixel.y + 0.5) / before.height) * 100}%` }}
          aria-hidden="true"
        />
        <span className="canvas-badge before-badge">INPUT</span>
        <span className="canvas-badge after-badge">RESULT</span>
      </div>
      <input
        className="split-range"
        type="range"
        min="0"
        max="100"
        value={split}
        onChange={(event) => onSplitChange(Number(event.target.value))}
        aria-label="Before and after comparison position"
      />
      <div className="stage-hint"><ScanSearch size={14} /> Click anywhere to inspect its pixel math</div>
    </div>
  )
}
