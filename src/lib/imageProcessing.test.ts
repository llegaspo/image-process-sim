import { describe, expect, it } from 'vitest'
import {
  adjustTone,
  DEFAULT_SETTINGS,
  boxKernel,
  applyKernel,
  equalizeHistogram,
  gammaCorrect,
  gaussianKernel,
  getPixel,
  grayscale,
  invert,
  isolateChannel,
  laplacian,
  medianFilter,
  morphology,
  otsuThresholdValue,
  resizeImage,
  sharpen,
  sobel,
  threshold,
  type PixelBuffer,
} from './imageProcessing'

function image(width: number, height: number, pixels: number[][]): PixelBuffer {
  return { width, height, data: new Uint8ClampedArray(pixels.flat()) }
}

describe('point operations', () => {
  const source = image(1, 1, [[200, 100, 50, 137]])

  it('uses the documented weighted grayscale transform and preserves alpha', () => {
    expect([...grayscale(source).data]).toEqual([124, 124, 124, 137])
    expect([...grayscale(source, 'average').data]).toEqual([117, 117, 117, 137])
  })

  it('creates a binary result with a strict greater-than threshold', () => {
    expect([...threshold(image(2, 1, [[128, 128, 128, 255], [129, 129, 129, 200]]), 128).data])
      .toEqual([0, 0, 0, 255, 255, 255, 255, 200])
  })

  it('isolates channels without changing alpha', () => {
    expect([...isolateChannel(source, 'green').data]).toEqual([0, 100, 0, 137])
  })

  it('inverts around 255 and clips tone adjustments to the 8-bit range', () => {
    expect([...invert(source).data]).toEqual([55, 155, 205, 137])
    expect([...adjustTone(source, 100, 2).data]).toEqual([255, 255, 200, 137])
  })

  it('applies the documented power-law gamma convention', () => {
    expect([...gammaCorrect(image(1, 1, [[64, 128, 255, 90]]), 2).data]).toEqual([16, 64, 255, 90])
  })
})

describe('neighborhood filters', () => {
  it('creates box and Gaussian kernels whose weights sum to one', () => {
    expect(boxKernel(3).flat().reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12)
    const gaussian = gaussianKernel(5, 1.2)
    expect(gaussian.flat().reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12)
    expect(gaussian[2][2]).toBeGreaterThan(gaussian[0][0])
    expect(gaussian[0][0]).toBeCloseTo(gaussian[4][4], 12)
  })

  it('preserves a constant image through normalized convolution, including borders', () => {
    const constant = image(2, 2, Array.from({ length: 4 }, () => [80, 120, 160, 90]))
    expect([...applyKernel(constant, boxKernel(3)).data]).toEqual([...constant.data])
  })

  it('implements each advertised border policy explicitly', () => {
    const row = image(2, 1, [[10, 10, 10, 255], [20, 20, 20, 255]])
    const leftSample = [[1, 0, 0]]
    expect(getPixel(applyKernel(row, leftSample, 'reflect'), 0, 0)[0]).toBe(10)
    expect(getPixel(applyKernel(row, leftSample, 'replicate'), 0, 0)[0]).toBe(10)
    expect(getPixel(applyKernel(row, leftSample, 'wrap'), 0, 0)[0]).toBe(20)
    expect(getPixel(applyKernel(row, leftSample, 'constant'), 0, 0)[0]).toBe(0)
  })

  it('uses the channel median and rejects an isolated bright impulse', () => {
    const pixels = Array.from({ length: 9 }, (_, index) => index === 4 ? [255, 255, 255, 255] : [0, 0, 0, 255])
    expect(getPixel(medianFilter(image(3, 3, pixels), 3), 1, 1)).toEqual([0, 0, 0, 255])
  })

  it('leaves uniform regions unchanged when sharpening', () => {
    const constant = image(2, 2, Array.from({ length: 4 }, () => [91, 91, 91, 255]))
    expect([...sharpen(constant, 1.5).data]).toEqual([...constant.data])
  })

  it('keeps a signed Laplacian internally and displays its absolute response', () => {
    const impulse = image(3, 3, Array.from({ length: 9 }, (_, index) => index === 4 ? [100, 100, 100, 255] : [0, 0, 0, 255]))
    expect(getPixel(laplacian(impulse), 1, 1)[0]).toBe(255)
    expect(getPixel(laplacian(impulse), 1, 0)[0]).toBe(100)
  })
})

describe('analysis operations', () => {
  it('detects a vertical intensity edge with the horizontal derivative', () => {
    const edge = image(3, 3, [
      [0, 0, 0, 255], [0, 0, 0, 255], [255, 255, 255, 255],
      [0, 0, 0, 255], [0, 0, 0, 255], [255, 255, 255, 255],
      [0, 0, 0, 255], [0, 0, 0, 255], [255, 255, 255, 255],
    ])
    expect(getPixel(sobel(edge, 'x'), 1, 1)[0]).toBe(255)
    expect(getPixel(sobel(edge, 'y'), 1, 1)[0]).toBe(0)
  })

  it('stretches a two-level grayscale image across the available range', () => {
    const source = image(2, 2, [
      [50, 50, 50, 255], [50, 50, 50, 255],
      [100, 100, 100, 255], [100, 100, 100, 255],
    ])
    expect([...equalizeHistogram(source).data]).toEqual([
      0, 0, 0, 255, 0, 0, 0, 255,
      255, 255, 255, 255, 255, 255, 255, 255,
    ])
  })

  it('handles a flat histogram without division by zero', () => {
    const source = image(1, 1, [[42, 42, 42, 111]])
    expect([...equalizeHistogram(source).data]).toEqual([42, 42, 42, 111])
  })

  it('selects the first maximum-separation threshold for a two-level image', () => {
    const source = image(2, 2, [[50, 50, 50, 255], [50, 50, 50, 255], [100, 100, 100, 255], [100, 100, 100, 255]])
    expect(otsuThresholdValue(source)).toBe(50)
  })

  it('dilates and erodes a binary neighborhood with a square structuring element', () => {
    const impulse = image(3, 3, Array.from({ length: 9 }, (_, index) => index === 4 ? [255, 255, 255, 255] : [0, 0, 0, 255]))
    const settings = { ...DEFAULT_SETTINGS, kernelSize: 3, borderMode: 'constant' as const }
    expect([...morphology(impulse, { ...settings, morphologyOperation: 'dilate' }).data].filter((_, index) => index % 4 === 0)).toEqual(Array(9).fill(255))
    expect([...morphology(impulse, { ...settings, morphologyOperation: 'erode' }).data].filter((_, index) => index % 4 === 0)).toEqual(Array(9).fill(0))
  })

  it('resizes with center-aligned nearest and bilinear sampling', () => {
    const source = image(2, 1, [[0, 0, 0, 255], [200, 200, 200, 255]])
    const nearest = resizeImage(source, 2, 'nearest')
    const bilinear = resizeImage(source, 2, 'bilinear')
    expect([nearest.width, nearest.height]).toEqual([4, 2])
    expect([getPixel(nearest, 0, 0)[0], getPixel(nearest, 3, 0)[0]]).toEqual([0, 200])
    expect(getPixel(bilinear, 1, 0)[0]).toBe(50)
    expect(getPixel(bilinear, 2, 0)[0]).toBe(150)
  })
})
