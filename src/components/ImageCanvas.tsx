'use client'

import { useEffect, useRef } from 'react'
import type { PixelBuffer } from '@/lib/imageProcessing'

interface ImageCanvasProps {
  image: PixelBuffer
  label: string
  point?: { x: number; y: number }
  onPointChange?: (point: { x: number; y: number }) => void
  processing?: boolean
}

export function ImageCanvas({ image, label, point, onPointChange, processing = false }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = image.width
    canvas.height = image.height
    canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0)
  }, [image])

  const select = (clientX: number, clientY: number) => {
    const bounds = frameRef.current?.getBoundingClientRect()
    if (!bounds || !onPointChange) return
    onPointChange({
      x: Math.max(0, Math.min(image.width - 1, Math.floor((clientX - bounds.left) / bounds.width * image.width))),
      y: Math.max(0, Math.min(image.height - 1, Math.floor((clientY - bounds.top) / bounds.height * image.height))),
    })
  }

  return (
    <div className="image-panel">
      <div
        ref={frameRef}
        className={`image-frame ${onPointChange ? 'selectable' : ''}`}
        style={{ aspectRatio: `${image.width}/${image.height}` }}
        onClick={(event) => select(event.clientX, event.clientY)}
        tabIndex={onPointChange ? 0 : undefined}
        onKeyDown={(event) => {
          if (!point || !onPointChange) return
          const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
          if (!delta) return
          event.preventDefault()
          onPointChange({ x: Math.max(0, Math.min(image.width - 1, point.x + delta[0])), y: Math.max(0, Math.min(image.height - 1, point.y + delta[1])) })
        }}
        role={onPointChange ? 'application' : 'img'}
        aria-label={onPointChange ? `${label} image. Click a pixel or use arrow keys to inspect it.` : `${label} image`}
      >
        <canvas ref={canvasRef} />
        {point && (
          <span className="selected-pixel" style={{ left: `${(point.x + 0.5) / image.width * 100}%`, top: `${(point.y + 0.5) / image.height * 100}%` }} />
        )}
        {processing && <span className="processing-flag">CALCULATING</span>}
      </div>
      <div className="image-meta"><span>{label}</span><code>{image.width} × {image.height}</code></div>
    </div>
  )
}
