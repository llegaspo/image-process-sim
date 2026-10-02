export interface PixelBuffer {
  width: number
  height: number
  data: Uint8ClampedArray
}

export type TechniqueId =
  | 'channels'
  | 'grayscale'
  | 'threshold'
  | 'otsu'
  | 'tone'
  | 'invert'
  | 'gamma'
  | 'boxBlur'
  | 'gaussianBlur'
  | 'median'
  | 'sharpen'
  | 'sobel'
  | 'laplacian'
  | 'canny'
  | 'equalize'
  | 'morphology'
  | 'resize'

export type BorderMode = 'reflect' | 'replicate' | 'wrap' | 'constant'
export type InspectChannel = 'r' | 'g' | 'b' | 'y'

export interface ProcessingSettings {
  channel: 'rgb' | 'red' | 'green' | 'blue'
  grayMethod: 'weighted' | 'average'
  threshold: number
  brightness: number
  contrast: number
  gamma: number
  kernelSize: number
  sigma: number
  sharpenStrength: number
  sobelDirection: 'magnitude' | 'x' | 'y'
  borderMode: BorderMode
  cannyLow: number
  cannyHigh: number
  morphologyOperation: 'erode' | 'dilate' | 'open' | 'close'
  resizeMethod: 'nearest' | 'bilinear'
  resizeScale: number
}

export interface PipelineStep {
  key: string
  technique: TechniqueId
  name: string
  settings: ProcessingSettings
  enabled: boolean
}

export const DEFAULT_SETTINGS: ProcessingSettings = {
  channel: 'red',
  grayMethod: 'weighted',
  threshold: 128,
  brightness: 12,
  contrast: 1.15,
  gamma: 0.8,
  kernelSize: 5,
  sigma: 1.4,
  sharpenStrength: 1,
  sobelDirection: 'magnitude',
  borderMode: 'reflect',
  cannyLow: 55,
  cannyHigh: 130,
  morphologyOperation: 'dilate',
  resizeMethod: 'bilinear',
  resizeScale: 0.65,
}

export const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)))

export function cloneBuffer(image: PixelBuffer): PixelBuffer {
  return { width: image.width, height: image.height, data: new Uint8ClampedArray(image.data) }
}

export function getPixel(image: PixelBuffer, x: number, y: number): [number, number, number, number] {
  const safeX = Math.max(0, Math.min(image.width - 1, Math.round(x)))
  const safeY = Math.max(0, Math.min(image.height - 1, Math.round(y)))
  const index = (safeY * image.width + safeX) * 4
  return [image.data[index], image.data[index + 1], image.data[index + 2], image.data[index + 3]]
}

function mapCoordinate(value: number, length: number, mode: BorderMode): number | null {
  if (value >= 0 && value < length) return value
  if (mode === 'constant') return null
  if (mode === 'replicate') return Math.max(0, Math.min(length - 1, value))
  if (mode === 'wrap') return ((value % length) + length) % length
  if (length <= 1) return 0
  let reflected = value
  while (reflected < 0 || reflected >= length) {
    if (reflected < 0) reflected = -reflected - 1
    if (reflected >= length) reflected = 2 * length - reflected - 1
  }
  return reflected
}

export function luminance(r: number, g: number, b: number, method: 'weighted' | 'average' = 'weighted'): number {
  return method === 'weighted' ? 0.299 * r + 0.587 * g + 0.114 * b : (r + g + b) / 3
}

export function sampleChannel(
  image: PixelBuffer,
  x: number,
  y: number,
  channel: InspectChannel,
  borderMode: BorderMode = 'reflect',
): number {
  const mappedX = mapCoordinate(x, image.width, borderMode)
  const mappedY = mapCoordinate(y, image.height, borderMode)
  if (mappedX === null || mappedY === null) return 0
  const index = (mappedY * image.width + mappedX) * 4
  if (channel === 'y') return luminance(image.data[index], image.data[index + 1], image.data[index + 2])
  return image.data[index + ({ r: 0, g: 1, b: 2 } as const)[channel]]
}

function sampleRgba(image: PixelBuffer, x: number, y: number, channel: number, borderMode: BorderMode): number {
  const mappedX = mapCoordinate(x, image.width, borderMode)
  const mappedY = mapCoordinate(y, image.height, borderMode)
  if (mappedX === null || mappedY === null) return 0
  return image.data[(mappedY * image.width + mappedX) * 4 + channel]
}

function mapRgb(
  image: PixelBuffer,
  transform: (r: number, g: number, b: number) => [number, number, number],
): PixelBuffer {
  const output = new Uint8ClampedArray(image.data.length)
  for (let index = 0; index < image.data.length; index += 4) {
    const [r, g, b] = transform(image.data[index], image.data[index + 1], image.data[index + 2])
    output[index] = clampByte(r)
    output[index + 1] = clampByte(g)
    output[index + 2] = clampByte(b)
    output[index + 3] = image.data[index + 3]
  }
  return { width: image.width, height: image.height, data: output }
}

export function isolateChannel(image: PixelBuffer, channel: ProcessingSettings['channel']): PixelBuffer {
  if (channel === 'rgb') return cloneBuffer(image)
  return mapRgb(image, (r, g, b) => [channel === 'red' ? r : 0, channel === 'green' ? g : 0, channel === 'blue' ? b : 0])
}

export function grayscale(image: PixelBuffer, method: ProcessingSettings['grayMethod'] = 'weighted'): PixelBuffer {
  return mapRgb(image, (r, g, b) => {
    const y = luminance(r, g, b, method)
    return [y, y, y]
  })
}

export function threshold(image: PixelBuffer, value: number): PixelBuffer {
  return mapRgb(image, (r, g, b) => {
    const binary = luminance(r, g, b) > value ? 255 : 0
    return [binary, binary, binary]
  })
}

export function adjustTone(image: PixelBuffer, brightness: number, contrast: number): PixelBuffer {
  return mapRgb(image, (r, g, b) => [contrast * r + brightness, contrast * g + brightness, contrast * b + brightness])
}

export function invert(image: PixelBuffer): PixelBuffer {
  return mapRgb(image, (r, g, b) => [255 - r, 255 - g, 255 - b])
}

export function gammaCorrect(image: PixelBuffer, gamma: number): PixelBuffer {
  const safeGamma = Math.max(0.01, gamma)
  return mapRgb(image, (r, g, b) => [
    255 * Math.pow(r / 255, safeGamma),
    255 * Math.pow(g / 255, safeGamma),
    255 * Math.pow(b / 255, safeGamma),
  ])
}

export function applyKernel(image: PixelBuffer, kernel: number[][], borderMode: BorderMode = 'reflect'): PixelBuffer {
  const output = new Uint8ClampedArray(image.data.length)
  const radiusY = Math.floor(kernel.length / 2)
  const radiusX = Math.floor(kernel[0].length / 2)
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const destination = (y * image.width + x) * 4
      for (let channel = 0; channel < 3; channel += 1) {
        let total = 0
        for (let ky = 0; ky < kernel.length; ky += 1) {
          for (let kx = 0; kx < kernel[ky].length; kx += 1) {
            total += sampleRgba(image, x + kx - radiusX, y + ky - radiusY, channel, borderMode) * kernel[ky][kx]
          }
        }
        output[destination + channel] = clampByte(total)
      }
      output[destination + 3] = image.data[destination + 3]
    }
  }
  return { width: image.width, height: image.height, data: output }
}

export function boxKernel(size: number): number[][] {
  const safeSize = Math.max(1, Math.round(size) | 1)
  const weight = 1 / (safeSize * safeSize)
  return Array.from({ length: safeSize }, () => Array.from({ length: safeSize }, () => weight))
}

export function gaussianKernel(size: number, sigma: number): number[][] {
  const safeSize = Math.max(1, Math.round(size) | 1)
  const safeSigma = Math.max(0.01, sigma)
  const radius = Math.floor(safeSize / 2)
  const kernel: number[][] = []
  let sum = 0
  for (let y = -radius; y <= radius; y += 1) {
    const row: number[] = []
    for (let x = -radius; x <= radius; x += 1) {
      const weight = Math.exp(-(x * x + y * y) / (2 * safeSigma * safeSigma))
      row.push(weight)
      sum += weight
    }
    kernel.push(row)
  }
  return kernel.map((row) => row.map((weight) => weight / sum))
}

export function medianFilter(image: PixelBuffer, size: number, borderMode: BorderMode = 'reflect'): PixelBuffer {
  const safeSize = Math.max(1, Math.round(size) | 1)
  const radius = Math.floor(safeSize / 2)
  const output = new Uint8ClampedArray(image.data.length)
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const destination = (y * image.width + x) * 4
      for (let channel = 0; channel < 3; channel += 1) {
        const values: number[] = []
        for (let j = -radius; j <= radius; j += 1) {
          for (let i = -radius; i <= radius; i += 1) values.push(sampleRgba(image, x + i, y + j, channel, borderMode))
        }
        values.sort((a, b) => a - b)
        output[destination + channel] = values[Math.floor(values.length / 2)]
      }
      output[destination + 3] = image.data[destination + 3]
    }
  }
  return { width: image.width, height: image.height, data: output }
}

export function sharpen(image: PixelBuffer, strength: number, borderMode: BorderMode = 'reflect'): PixelBuffer {
  const s = Math.max(0, strength)
  return applyKernel(image, [[0, -s, 0], [-s, 1 + 4 * s, -s], [0, -s, 0]], borderMode)
}

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]

function grayscaleFloat(image: PixelBuffer): Float64Array {
  const gray = new Float64Array(image.width * image.height)
  for (let index = 0, pixel = 0; index < image.data.length; index += 4, pixel += 1) {
    gray[pixel] = luminance(image.data[index], image.data[index + 1], image.data[index + 2])
  }
  return gray
}

function sampleFloat(values: Float64Array, width: number, height: number, x: number, y: number, mode: BorderMode): number {
  const mappedX = mapCoordinate(x, width, mode)
  const mappedY = mapCoordinate(y, height, mode)
  return mappedX === null || mappedY === null ? 0 : values[mappedY * width + mappedX]
}

function gradients(values: Float64Array, width: number, height: number, mode: BorderMode) {
  const gx = new Float64Array(values.length)
  const gy = new Float64Array(values.length)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let xTotal = 0
      let yTotal = 0
      for (let ky = 0; ky < 3; ky += 1) {
        for (let kx = 0; kx < 3; kx += 1) {
          const value = sampleFloat(values, width, height, x + kx - 1, y + ky - 1, mode)
          xTotal += value * SOBEL_X[ky][kx]
          yTotal += value * SOBEL_Y[ky][kx]
        }
      }
      gx[y * width + x] = xTotal
      gy[y * width + x] = yTotal
    }
  }
  return { gx, gy }
}

function grayBufferFromValues(values: ArrayLike<number>, source: PixelBuffer): PixelBuffer {
  const output = new Uint8ClampedArray(source.data.length)
  for (let pixel = 0; pixel < values.length; pixel += 1) {
    const index = pixel * 4
    const value = clampByte(values[pixel])
    output[index] = value
    output[index + 1] = value
    output[index + 2] = value
    output[index + 3] = source.data[index + 3]
  }
  return { width: source.width, height: source.height, data: output }
}

export function sobel(image: PixelBuffer, direction: ProcessingSettings['sobelDirection'], borderMode: BorderMode = 'reflect'): PixelBuffer {
  const { gx, gy } = gradients(grayscaleFloat(image), image.width, image.height, borderMode)
  const values = gx.map((xValue, index) => direction === 'x' ? Math.abs(xValue) : direction === 'y' ? Math.abs(gy[index]) : Math.hypot(xValue, gy[index]))
  return grayBufferFromValues(values, image)
}

export function laplacian(image: PixelBuffer, borderMode: BorderMode = 'reflect'): PixelBuffer {
  const values = grayscaleFloat(image)
  const response = new Float64Array(values.length)
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const center = sampleFloat(values, image.width, image.height, x, y, borderMode)
      const signed = sampleFloat(values, image.width, image.height, x, y - 1, borderMode)
        + sampleFloat(values, image.width, image.height, x, y + 1, borderMode)
        + sampleFloat(values, image.width, image.height, x - 1, y, borderMode)
        + sampleFloat(values, image.width, image.height, x + 1, y, borderMode)
        - 4 * center
      response[y * image.width + x] = Math.abs(signed)
    }
  }
  return grayBufferFromValues(response, image)
}

export function histogram(image: PixelBuffer): number[] {
  const bins = Array.from({ length: 256 }, () => 0)
  for (let index = 0; index < image.data.length; index += 4) {
    bins[clampByte(luminance(image.data[index], image.data[index + 1], image.data[index + 2]))] += 1
  }
  return bins
}

export function equalizeHistogram(image: PixelBuffer): PixelBuffer {
  const gray = grayscale(image)
  const bins = histogram(gray)
  const cdf: number[] = []
  bins.reduce((total, count, index) => (cdf[index] = total + count), 0)
  const cdfMin = cdf.find((value) => value > 0) ?? 0
  const totalPixels = image.width * image.height
  if (totalPixels === cdfMin) return gray
  const lookup = cdf.map((value) => clampByte(((value - cdfMin) / (totalPixels - cdfMin)) * 255))
  return mapRgb(gray, (r) => [lookup[r], lookup[r], lookup[r]])
}

export function otsuThresholdValue(image: PixelBuffer): number {
  const bins = histogram(image)
  const total = image.width * image.height
  let globalSum = 0
  for (let intensity = 0; intensity < 256; intensity += 1) globalSum += intensity * bins[intensity]
  let backgroundWeight = 0
  let backgroundSum = 0
  let maximumVariance = -1
  let bestThreshold = 0
  for (let thresholdValue = 0; thresholdValue < 256; thresholdValue += 1) {
    backgroundWeight += bins[thresholdValue]
    if (backgroundWeight === 0) continue
    const foregroundWeight = total - backgroundWeight
    if (foregroundWeight === 0) break
    backgroundSum += thresholdValue * bins[thresholdValue]
    const backgroundMean = backgroundSum / backgroundWeight
    const foregroundMean = (globalSum - backgroundSum) / foregroundWeight
    const betweenClassVariance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2
    if (betweenClassVariance > maximumVariance) {
      maximumVariance = betweenClassVariance
      bestThreshold = thresholdValue
    }
  }
  return bestThreshold
}

export function otsuThreshold(image: PixelBuffer): PixelBuffer {
  return threshold(image, otsuThresholdValue(image))
}

function morphPass(image: PixelBuffer, size: number, operation: 'erode' | 'dilate', borderMode: BorderMode): PixelBuffer {
  const binary = threshold(image, 127)
  const radius = Math.floor((Math.max(1, Math.round(size) | 1)) / 2)
  const output = new Uint8ClampedArray(binary.data.length)
  for (let y = 0; y < binary.height; y += 1) {
    for (let x = 0; x < binary.width; x += 1) {
      let result = operation === 'erode' ? 255 : 0
      for (let j = -radius; j <= radius; j += 1) {
        for (let i = -radius; i <= radius; i += 1) {
          const value = sampleRgba(binary, x + i, y + j, 0, borderMode)
          result = operation === 'erode' ? Math.min(result, value) : Math.max(result, value)
        }
      }
      const index = (y * binary.width + x) * 4
      output[index] = result
      output[index + 1] = result
      output[index + 2] = result
      output[index + 3] = image.data[index + 3]
    }
  }
  return { width: image.width, height: image.height, data: output }
}

export function morphology(image: PixelBuffer, settings: ProcessingSettings): PixelBuffer {
  const { kernelSize, morphologyOperation, borderMode } = settings
  if (morphologyOperation === 'erode' || morphologyOperation === 'dilate') return morphPass(image, kernelSize, morphologyOperation, borderMode)
  if (morphologyOperation === 'open') return morphPass(morphPass(image, kernelSize, 'erode', borderMode), kernelSize, 'dilate', borderMode)
  return morphPass(morphPass(image, kernelSize, 'dilate', borderMode), kernelSize, 'erode', borderMode)
}

function gaussianFloat(values: Float64Array, width: number, height: number, size: number, sigma: number, borderMode: BorderMode) {
  const kernel = gaussianKernel(size, sigma)
  const radius = Math.floor(kernel.length / 2)
  const output = new Float64Array(values.length)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let total = 0
      for (let j = -radius; j <= radius; j += 1) {
        for (let i = -radius; i <= radius; i += 1) total += sampleFloat(values, width, height, x + i, y + j, borderMode) * kernel[j + radius][i + radius]
      }
      output[y * width + x] = total
    }
  }
  return output
}

export function canny(image: PixelBuffer, settings: ProcessingSettings): PixelBuffer {
  const { width, height } = image
  const smoothed = gaussianFloat(grayscaleFloat(image), width, height, 5, 1.4, settings.borderMode)
  const { gx, gy } = gradients(smoothed, width, height, settings.borderMode)
  const magnitude = new Float64Array(width * height)
  const direction = new Float64Array(width * height)
  for (let index = 0; index < magnitude.length; index += 1) {
    magnitude[index] = Math.hypot(gx[index], gy[index])
    direction[index] = (Math.atan2(gy[index], gx[index]) * 180 / Math.PI + 180) % 180
  }
  const suppressed = new Float64Array(magnitude.length)
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x
      const angle = direction[index]
      let first = 0
      let second = 0
      if (angle < 22.5 || angle >= 157.5) {
        first = magnitude[index - 1]; second = magnitude[index + 1]
      } else if (angle < 67.5) {
        first = magnitude[index - width + 1]; second = magnitude[index + width - 1]
      } else if (angle < 112.5) {
        first = magnitude[index - width]; second = magnitude[index + width]
      } else {
        first = magnitude[index - width - 1]; second = magnitude[index + width + 1]
      }
      if (magnitude[index] >= first && magnitude[index] >= second) suppressed[index] = magnitude[index]
    }
  }
  const edges = new Uint8Array(magnitude.length)
  const stack: number[] = []
  for (let index = 0; index < suppressed.length; index += 1) {
    if (suppressed[index] >= settings.cannyHigh) { edges[index] = 255; stack.push(index) }
    else if (suppressed[index] >= settings.cannyLow) edges[index] = 75
  }
  while (stack.length) {
    const index = stack.pop()!
    const x = index % width
    const y = Math.floor(index / width)
    for (let j = -1; j <= 1; j += 1) {
      for (let i = -1; i <= 1; i += 1) {
        const nx = x + i
        const ny = y + j
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighbor = ny * width + nx
          if (edges[neighbor] === 75) { edges[neighbor] = 255; stack.push(neighbor) }
        }
      }
    }
  }
  return grayBufferFromValues(edges.map((value) => value === 255 ? 255 : 0), image)
}

export function resizeImage(image: PixelBuffer, scale: number, method: ProcessingSettings['resizeMethod']): PixelBuffer {
  const safeScale = Math.max(0.1, Math.min(2, scale))
  const width = Math.max(1, Math.round(image.width * safeScale))
  const height = Math.max(1, Math.round(image.height * safeScale))
  const output = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceX = (x + 0.5) / safeScale - 0.5
      const sourceY = (y + 0.5) / safeScale - 0.5
      const destination = (y * width + x) * 4
      if (method === 'nearest') {
        const [r, g, b, a] = getPixel(image, Math.round(sourceX), Math.round(sourceY))
        output.set([r, g, b, a], destination)
      } else {
        const x0 = Math.floor(sourceX)
        const y0 = Math.floor(sourceY)
        const tx = sourceX - x0
        const ty = sourceY - y0
        for (let channel = 0; channel < 4; channel += 1) {
          const top = sampleRgba(image, x0, y0, channel, 'replicate') * (1 - tx) + sampleRgba(image, x0 + 1, y0, channel, 'replicate') * tx
          const bottom = sampleRgba(image, x0, y0 + 1, channel, 'replicate') * (1 - tx) + sampleRgba(image, x0 + 1, y0 + 1, channel, 'replicate') * tx
          output[destination + channel] = clampByte(top * (1 - ty) + bottom * ty)
        }
      }
    }
  }
  return { width, height, data: output }
}

export function kernelForTechnique(technique: TechniqueId, settings: ProcessingSettings): number[][] | null {
  if (technique === 'boxBlur') return boxKernel(settings.kernelSize)
  if (technique === 'gaussianBlur') return gaussianKernel(settings.kernelSize, settings.sigma)
  if (technique === 'sharpen') {
    const s = settings.sharpenStrength
    return [[0, -s, 0], [-s, 1 + 4 * s, -s], [0, -s, 0]]
  }
  if (technique === 'laplacian') return [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
  return null
}

export function processImage(image: PixelBuffer, technique: TechniqueId, settings: ProcessingSettings): PixelBuffer {
  switch (technique) {
    case 'channels': return isolateChannel(image, settings.channel)
    case 'grayscale': return grayscale(image, settings.grayMethod)
    case 'threshold': return threshold(image, settings.threshold)
    case 'otsu': return otsuThreshold(image)
    case 'tone': return adjustTone(image, settings.brightness, settings.contrast)
    case 'invert': return invert(image)
    case 'gamma': return gammaCorrect(image, settings.gamma)
    case 'boxBlur': return applyKernel(image, boxKernel(settings.kernelSize), settings.borderMode)
    case 'gaussianBlur': return applyKernel(image, gaussianKernel(settings.kernelSize, settings.sigma), settings.borderMode)
    case 'median': return medianFilter(image, settings.kernelSize, settings.borderMode)
    case 'sharpen': return sharpen(image, settings.sharpenStrength, settings.borderMode)
    case 'sobel': return sobel(image, settings.sobelDirection, settings.borderMode)
    case 'laplacian': return laplacian(image, settings.borderMode)
    case 'canny': return canny(image, settings)
    case 'equalize': return equalizeHistogram(image)
    case 'morphology': return morphology(image, settings)
    case 'resize': return resizeImage(image, settings.resizeScale, settings.resizeMethod)
  }
}

export function runPipeline(original: PixelBuffer, steps: PipelineStep[]): PixelBuffer {
  return steps.reduce((current, step) => step.enabled ? processImage(current, step.technique, step.settings) : current, original)
}
