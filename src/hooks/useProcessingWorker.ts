'use client'

import { useEffect, useRef, useState } from 'react'
import { processImage, runPipeline, type PipelineStep, type PixelBuffer, type ProcessingSettings, type TechniqueId } from '../lib/imageProcessing'

interface ProcessingResult {
  pipelineInput: PixelBuffer
  result: PixelBuffer
  processing: boolean
}

export function useProcessingWorker(
  original: PixelBuffer,
  steps: PipelineStep[],
  previewEnabled: boolean,
  technique: TechniqueId,
  settings: ProcessingSettings,
): ProcessingResult {
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)
  const [state, setState] = useState<ProcessingResult>(() => {
    const pipelineInput = runPipeline(original, steps)
    return { pipelineInput, result: previewEnabled ? processImage(pipelineInput, technique, settings) : pipelineInput, processing: false }
  })

  useEffect(() => {
    if (typeof Worker === 'undefined') return
    const worker = new Worker(new URL('../workers/processing.worker.ts', import.meta.url))
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<{ id: number; pipelineInput: PixelBuffer; result: PixelBuffer }>) => {
      if (event.data.id !== requestId.current) return
      setState({ pipelineInput: event.data.pipelineInput, result: event.data.result, processing: false })
    }
    return () => worker.terminate()
  }, [])

  useEffect(() => {
    const id = ++requestId.current
    setState((current) => ({ ...current, processing: true }))
    const timer = window.setTimeout(() => {
      if (workerRef.current) {
        workerRef.current.postMessage({ id, original, steps, previewEnabled, technique, settings })
      } else {
        const pipelineInput = runPipeline(original, steps)
        const result = previewEnabled ? processImage(pipelineInput, technique, settings) : pipelineInput
        setState({ pipelineInput, result, processing: false })
      }
    }, 45)
    return () => window.clearTimeout(timer)
  }, [original, previewEnabled, settings, steps, technique])

  return state
}
