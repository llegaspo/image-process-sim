/// <reference lib="webworker" />

import { processImage, runPipeline, type PipelineStep, type PixelBuffer, type ProcessingSettings, type TechniqueId } from '../lib/imageProcessing'

interface WorkRequest {
  id: number
  original: PixelBuffer
  steps: PipelineStep[]
  previewEnabled: boolean
  technique: TechniqueId
  settings: ProcessingSettings
}

self.onmessage = (event: MessageEvent<WorkRequest>) => {
  const { id, original, steps, previewEnabled, technique, settings } = event.data
  const pipelineInput = runPipeline(original, steps)
  const result = previewEnabled ? processImage(pipelineInput, technique, settings) : pipelineInput
  self.postMessage({ id, pipelineInput, result }, { transfer: [pipelineInput.data.buffer, ...(result === pipelineInput ? [] : [result.data.buffer])] })
}

export {}
