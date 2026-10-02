import {
  getPixel,
  histogram,
  kernelForTechnique,
  luminance,
  otsuThresholdValue,
  sampleChannel,
  type InspectChannel,
  type PixelBuffer,
  type ProcessingSettings,
  type TechniqueId,
} from './imageProcessing'

export interface TraceCell {
  dx: number
  dy: number
  value: number
  weight?: number
  product?: number
  secondaryWeight?: number
  secondaryProduct?: number
  center: boolean
}

export interface PixelExplanation {
  inputValue: number
  outputValue: number
  equation: string
  arithmetic: string
  resultLabel: string
  trace: TraceCell[]
  kernel: number[][] | null
  exactSum?: number
  secondarySum?: number
  sortedValues?: number[]
  globalValue?: number
}

const display = (value: number, digits = 3) => Number(value.toFixed(digits)).toString()

function channelValue(pixel: [number, number, number, number], channel: InspectChannel) {
  if (channel === 'y') return luminance(pixel[0], pixel[1], pixel[2])
  return pixel[{ r: 0, g: 1, b: 2 }[channel]]
}

function neighborhoodTrace(
  image: PixelBuffer,
  point: { x: number; y: number },
  size: number,
  channel: InspectChannel,
  settings: ProcessingSettings,
  kernel?: number[][],
): TraceCell[] {
  const radius = Math.floor(size / 2)
  const cells: TraceCell[] = []
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const value = sampleChannel(image, point.x + dx, point.y + dy, channel, settings.borderMode)
      const weight = kernel?.[dy + radius]?.[dx + radius]
      cells.push({ dx, dy, value, weight, product: weight === undefined ? undefined : value * weight, center: dx === 0 && dy === 0 })
    }
  }
  return cells
}

export function buildPixelExplanation(
  technique: TechniqueId,
  settings: ProcessingSettings,
  input: PixelBuffer,
  output: PixelBuffer,
  point: { x: number; y: number },
  inspectChannel: InspectChannel,
): PixelExplanation {
  const inputPixel = getPixel(input, point.x, point.y)
  const outputPoint = technique === 'resize'
    ? { x: Math.max(0, Math.min(output.width - 1, Math.round((point.x + 0.5) * settings.resizeScale - 0.5))), y: Math.max(0, Math.min(output.height - 1, Math.round((point.y + 0.5) * settings.resizeScale - 0.5))) }
    : point
  const outputPixel = getPixel(output, outputPoint.x, outputPoint.y)
  const inputValue = channelValue(inputPixel, inspectChannel)
  const outputValue = channelValue(outputPixel, inspectChannel)
  const base = { inputValue, outputValue, trace: [] as TraceCell[], kernel: null as number[][] | null }

  if (technique === 'channels') {
    return { ...base, equation: 'Select one stored component', arithmetic: `[${inputPixel[0]}, ${inputPixel[1]}, ${inputPixel[2]}] → [${outputPixel[0]}, ${outputPixel[1]}, ${outputPixel[2]}]`, resultLabel: `${settings.channel.toUpperCase()} view` }
  }
  if (technique === 'grayscale') {
    const arithmetic = settings.grayMethod === 'weighted'
      ? `0.299(${inputPixel[0]}) + 0.587(${inputPixel[1]}) + 0.114(${inputPixel[2]}) = ${display(luminance(inputPixel[0], inputPixel[1], inputPixel[2]))}`
      : `(${inputPixel[0]} + ${inputPixel[1]} + ${inputPixel[2]}) / 3 = ${display(luminance(inputPixel[0], inputPixel[1], inputPixel[2], 'average'))}`
    return { ...base, equation: settings.grayMethod === 'weighted' ? '0.299R + 0.587G + 0.114B' : '(R + G + B) / 3', arithmetic, resultLabel: `Stored gray = ${outputPixel[0]}` }
  }
  if (technique === 'threshold') {
    const y = luminance(inputPixel[0], inputPixel[1], inputPixel[2])
    return { ...base, equation: 'Y > T ? 255 : 0', arithmetic: `${display(y)} ${y > settings.threshold ? '>' : '≤'} ${settings.threshold}`, resultLabel: `Binary output = ${outputPixel[0]}` }
  }
  if (technique === 'tone') {
    return { ...base, equation: 'clamp(αC + β)', arithmetic: `clamp(${display(settings.contrast, 2)} × ${display(inputValue)} ${settings.brightness >= 0 ? '+' : '−'} ${Math.abs(settings.brightness)})`, resultLabel: `Stored ${inspectChannel.toUpperCase()} = ${display(outputValue)}` }
  }
  if (technique === 'invert') {
    return { ...base, equation: '255 − C', arithmetic: `255 − ${display(inputValue)} = ${display(255 - inputValue)}`, resultLabel: `Stored ${inspectChannel.toUpperCase()} = ${display(outputValue)}` }
  }
  if (technique === 'gamma') {
    const exact = 255 * Math.pow(inputValue / 255, settings.gamma)
    return { ...base, equation: '255(C / 255)^γ', arithmetic: `255 × (${display(inputValue)} / 255)^${display(settings.gamma, 2)} = ${display(exact)}`, resultLabel: `Rounded output = ${display(outputValue)}` }
  }

  const kernel = kernelForTechnique(technique, settings)
  if (kernel) {
    const trace = neighborhoodTrace(input, point, kernel.length, inspectChannel, settings, kernel)
    const exactSum = trace.reduce((sum, cell) => sum + (cell.product ?? 0), 0)
    const displayed = technique === 'laplacian' ? Math.abs(exactSum) : exactSum
    return {
      ...base, kernel, trace, exactSum,
      equation: `Σ value(i,j) × K(i,j)`,
      arithmetic: `${trace.length} full-precision products sum to ${display(exactSum, 4)}${technique === 'laplacian' ? `; |response| = ${display(displayed, 4)}` : ''}`,
      resultLabel: `Rounded and clamped = ${display(outputValue)}`,
    }
  }

  if (technique === 'median') {
    const trace = neighborhoodTrace(input, point, settings.kernelSize, inspectChannel, settings)
    const sortedValues = trace.map((cell) => cell.value).sort((a, b) => a - b)
    const middle = sortedValues[Math.floor(sortedValues.length / 2)]
    return { ...base, trace, sortedValues, equation: 'middle(sorted neighborhood)', arithmetic: `${sortedValues.length} values → index ${Math.floor(sortedValues.length / 2)} = ${display(middle)}`, resultLabel: `Median output = ${display(outputValue)}` }
  }

  if (technique === 'sobel') {
    const gxKernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
    const gyKernel = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
    const trace = neighborhoodTrace(input, point, 3, 'y', settings, gxKernel).map((cell, index) => {
      const row = Math.floor(index / 3)
      const column = index % 3
      const secondaryWeight = gyKernel[row][column]
      return { ...cell, secondaryWeight, secondaryProduct: cell.value * secondaryWeight }
    })
    const gx = trace.reduce((sum, cell) => sum + (cell.product ?? 0), 0)
    const gy = trace.reduce((sum, cell) => sum + (cell.secondaryProduct ?? 0), 0)
    const magnitude = Math.hypot(gx, gy)
    return { ...base, kernel: gxKernel, trace, exactSum: gx, secondarySum: gy, equation: 'G = √(Gx² + Gy²)', arithmetic: `Gx = ${display(gx)}, Gy = ${display(gy)}, |G| = ${display(magnitude)}`, resultLabel: `${settings.sobelDirection} output = ${display(outputValue)}` }
  }

  if (technique === 'morphology') {
    const trace = neighborhoodTrace(input, point, settings.kernelSize, 'y', settings)
    const values = trace.map((cell) => luminance(cell.value, cell.value, cell.value) > 127 ? 255 : 0)
    return { ...base, trace, equation: settings.morphologyOperation === 'erode' ? 'min(binary neighborhood)' : settings.morphologyOperation === 'dilate' ? 'max(binary neighborhood)' : 'two ordered min/max passes', arithmetic: `${values.filter((value) => value === 255).length} of ${values.length} samples are foreground`, resultLabel: `${settings.morphologyOperation} output = ${display(outputValue)}` }
  }

  if (technique === 'otsu') {
    const selected = otsuThresholdValue(input)
    return { ...base, globalValue: selected, equation: 'arg minₜ σ²w(t)', arithmetic: `The full 256-bin histogram selects t = ${selected}`, resultLabel: `${display(inputValue)} ${inputValue > selected ? '>' : '≤'} ${selected} → ${display(outputValue)}` }
  }

  if (technique === 'equalize') {
    const bins = histogram(input)
    const sourceLevel = Math.round(luminance(inputPixel[0], inputPixel[1], inputPixel[2]))
    const cdf = bins.slice(0, sourceLevel + 1).reduce((sum, count) => sum + count, 0)
    const cdfMin = bins.reduce((state, count) => state.found ? state : count > 0 ? { found: true, total: state.total + count } : { found: false, total: state.total + count }, { found: false, total: 0 }).total
    return { ...base, globalValue: cdf, equation: '(CDF(Y) − CDFmin) / (N − CDFmin) × 255', arithmetic: `Y = ${sourceLevel}, CDF(Y) = ${cdf}, N = ${input.width * input.height}, CDFmin = ${cdfMin}`, resultLabel: `Equalized output = ${display(outputValue)}` }
  }

  if (technique === 'resize') {
    const destinationX = outputPoint.x
    const destinationY = outputPoint.y
    const sourceX = (destinationX + 0.5) / settings.resizeScale - 0.5
    const sourceY = (destinationY + 0.5) / settings.resizeScale - 0.5
    return { ...base, equation: 'source = (destination + 0.5) / scale − 0.5', arithmetic: `destination (${destinationX}, ${destinationY}) maps to source (${display(sourceX)}, ${display(sourceY)})`, resultLabel: `${settings.resizeMethod} output = ${display(outputValue)}` }
  }

  if (technique === 'canny') {
    return { ...base, equation: 'Gaussian → Sobel → NMS → hysteresis', arithmetic: `low = ${settings.cannyLow}, high = ${settings.cannyHigh}; weak pixels survive only when connected to a strong edge`, resultLabel: `Final edge = ${display(outputValue)}` }
  }

  return { ...base, equation: '', arithmetic: '', resultLabel: `Output = ${display(outputValue)}` }
}
