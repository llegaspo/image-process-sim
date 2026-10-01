import { describe, expect, it } from 'vitest'
import {
  adjustTone,
  boxKernel,
  convolve,
  equalizeHistogram,
  gaussianKernel,
  getPixel,
  grayscale,
  invert,
  isolateChannel,
  medianFilter,
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
    expect([...convolve(constant, boxKernel(3)).data]).toEqual([...constant.data])
  })

  it('uses the channel median and rejects an isolated bright impulse', () => {
    const pixels = Array.from({ length: 9 }, (_, index) => index === 4 ? [255, 255, 255, 255] : [0, 0, 0, 255])
    expect(getPixel(medianFilter(image(3, 3, pixels), 3), 1, 1)).toEqual([0, 0, 0, 255])
  })

  it('leaves uniform regions unchanged when sharpening', () => {
    const constant = image(2, 2, Array.from({ length: 4 }, () => [91, 91, 91, 255]))
    expect([...sharpen(constant, 1.5).data]).toEqual([...constant.data])
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
})
