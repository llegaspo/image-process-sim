export interface PixelBuffer {
  width: number
  height: number
  data: Uint8ClampedArray
}

export type TechniqueId =
  | 'channels'
  | 'grayscale'
  | 'threshold'
  | 'tone'
  | 'invert'
  | 'boxBlur'
  | 'gaussianBlur'
  | 'median'
  | 'sharpen'
  | 'sobel'
  | 'equalize'

export interface ProcessingSettings {
  channel: 'rgb' | 'red' | 'green' | 'blue'
  grayMethod: 'weighted' | 'average'
  threshold: number
  brightness: number
  contrast: number
  kernelSize: number
  sigma: number
  sharpenStrength: number
  sobelDirection: 'magnitude' | 'x' | 'y'
}

export const DEFAULT_SETTINGS: ProcessingSettings = {
  channel: 'red',
  grayMethod: 'weighted',
  threshold: 128,
  brightness: 12,
  contrast: 1.15,
  kernelSize: 5,
  sigma: 1.25,
  sharpenStrength: 1,
  sobelDirection: 'magnitude',
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

function reflect(value: number, length: number): number {
  if (length <= 1) return 0
  let reflected = value
  while (reflected < 0 || reflected >= length) {
    if (reflected < 0) reflected = -reflected - 1
    if (reflected >= length) reflected = 2 * length - reflected - 1
  }
  return reflected
}

function sample(image: PixelBuffer, x: number, y: number, channel: number): number {
  const rx = reflect(x, image.width)
  const ry = reflect(y, image.height)
  return image.data[(ry * image.width + rx) * 4 + channel]
}

function mapRgb(
  image: PixelBuffer,
  transform: (r: number, g: number, b: number, index: number) => [number, number, number],
): PixelBuffer {
  const output = new Uint8ClampedArray(image.data.length)
  for (let i = 0; i < image.data.length; i += 4) {
    const [r, g, b] = transform(image.data[i], image.data[i + 1], image.data[i + 2], i / 4)
    output[i] = clampByte(r)
    output[i + 1] = clampByte(g)
    output[i + 2] = clampByte(b)
    output[i + 3] = image.data[i + 3]
  }
  return { width: image.width, height: image.height, data: output }
}

export function luminance(r: number, g: number, b: number, method: 'weighted' | 'average' = 'weighted'): number {
  return method === 'weighted' ? 0.299 * r + 0.587 * g + 0.114 * b : (r + g + b) / 3
}

export function isolateChannel(image: PixelBuffer, channel: ProcessingSettings['channel']): PixelBuffer {
  if (channel === 'rgb') return cloneBuffer(image)
  return mapRgb(image, (r, g, b) => [channel === 'red' ? r : 0, channel === 'green' ? g : 0, channel === 'blue' ? b : 0])
}

export function grayscale(image: PixelBuffer, method: ProcessingSettings['grayMethod'] = 'weighted'): PixelBuffer {
  return mapRgb(image, (r, g, b) => {
    const gray = luminance(r, g, b, method)
    return [gray, gray, gray]
  })
}

export function threshold(image: PixelBuffer, value: number): PixelBuffer {
  return mapRgb(image, (r, g, b) => {
    const binary = luminance(r, g, b) > value ? 255 : 0
    return [binary, binary, binary]
  })
}

export function adjustTone(image: PixelBuffer, brightness: number, contrast: number): PixelBuffer {
  return mapRgb(image, (r, g, b) => [
    contrast * r + brightness,
    contrast * g + brightness,
    contrast * b + brightness,
  ])
}

export function invert(image: PixelBuffer): PixelBuffer {
  return mapRgb(image, (r, g, b) => [255 - r, 255 - g, 255 - b])
}

export function convolve(image: PixelBuffer, kernel: number[][]): PixelBuffer {
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
            total += sample(image, x + kx - radiusX, y + ky - radiusY, channel) * kernel[ky][kx]
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

export function medianFilter(image: PixelBuffer, size: number): PixelBuffer {
  const safeSize = Math.max(1, Math.round(size) | 1)
  const radius = Math.floor(safeSize / 2)
  const output = new Uint8ClampedArray(image.data.length)
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const destination = (y * image.width + x) * 4
      for (let channel = 0; channel < 3; channel += 1) {
        const values: number[] = []
        for (let ky = -radius; ky <= radius; ky += 1) {
          for (let kx = -radius; kx <= radius; kx += 1) values.push(sample(image, x + kx, y + ky, channel))
        }
        values.sort((a, b) => a - b)
        output[destination + channel] = values[Math.floor(values.length / 2)]
      }
      output[destination + 3] = image.data[destination + 3]
    }
  }
  return { width: image.width, height: image.height, data: output }
}

export function sharpen(image: PixelBuffer, strength: number): PixelBuffer {
  const s = Math.max(0, strength)
  return convolve(image, [
    [0, -s, 0],
    [-s, 1 + 4 * s, -s],
    [0, -s, 0],
  ])
}

export function sobel(image: PixelBuffer, direction: ProcessingSettings['sobelDirection']): PixelBuffer {
  const gray = grayscale(image)
  const output = new Uint8ClampedArray(image.data.length)
  const kernelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ]
  const kernelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ]
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      let gx = 0
      let gy = 0
      for (let ky = 0; ky < 3; ky += 1) {
        for (let kx = 0; kx < 3; kx += 1) {
          const value = sample(gray, x + kx - 1, y + ky - 1, 0)
          gx += value * kernelX[ky][kx]
          gy += value * kernelY[ky][kx]
        }
      }
      const gradient = direction === 'x' ? Math.abs(gx) : direction === 'y' ? Math.abs(gy) : Math.hypot(gx, gy)
      const value = clampByte(gradient)
      const index = (y * image.width + x) * 4
      output[index] = value
      output[index + 1] = value
      output[index + 2] = value
      output[index + 3] = image.data[index + 3]
    }
  }
  return { width: image.width, height: image.height, data: output }
}

export function histogram(image: PixelBuffer): number[] {
  const bins = Array.from({ length: 256 }, () => 0)
  for (let i = 0; i < image.data.length; i += 4) bins[clampByte(luminance(image.data[i], image.data[i + 1], image.data[i + 2]))] += 1
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

export function processImage(image: PixelBuffer, technique: TechniqueId, settings: ProcessingSettings): PixelBuffer {
  switch (technique) {
    case 'channels': return isolateChannel(image, settings.channel)
    case 'grayscale': return grayscale(image, settings.grayMethod)
    case 'threshold': return threshold(image, settings.threshold)
    case 'tone': return adjustTone(image, settings.brightness, settings.contrast)
    case 'invert': return invert(image)
    case 'boxBlur': return convolve(image, boxKernel(settings.kernelSize))
    case 'gaussianBlur': return convolve(image, gaussianKernel(settings.kernelSize, settings.sigma))
    case 'median': return medianFilter(image, settings.kernelSize)
    case 'sharpen': return sharpen(image, settings.sharpenStrength)
    case 'sobel': return sobel(image, settings.sobelDirection)
    case 'equalize': return equalizeHistogram(image)
  }
}
