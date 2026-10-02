import type { PixelBuffer } from './imageProcessing'

const mix = (a: number, b: number, t: number) => a + (b - a) * t

export function createDemoImage(width = 768, height = 480): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4)
  const set = (x: number, y: number, color: [number, number, number], alpha = 255) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const index = (y * width + x) * 4
    data[index] = color[0]
    data[index + 1] = color[1]
    data[index + 2] = color[2]
    data[index + 3] = alpha
  }
  const rect = (x0: number, y0: number, x1: number, y1: number, color: [number, number, number]) => {
    for (let y = Math.max(0, y0); y < Math.min(height, y1); y += 1) for (let x = Math.max(0, x0); x < Math.min(width, x1); x += 1) set(x, y, color)
  }
  const circle = (cx: number, cy: number, radius: number, color: [number, number, number]) => {
    for (let y = cy - radius; y <= cy + radius; y += 1) for (let x = cx - radius; x <= cx + radius; x += 1) if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) set(x, y, color)
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const horizontal = x / (width - 1)
      const vertical = y / (height - 1)
      set(x, y, [mix(28, 222, horizontal) + 16 * vertical, mix(55, 174, horizontal) + 26 * vertical, mix(84, 105, horizontal) + 36 * (1 - vertical)])
    }
  }

  for (let x = 0; x < width; x += 32) rect(x, 0, x + 1, height, [255, 255, 255])
  for (let y = 0; y < height; y += 32) rect(0, y, width, y + 1, [255, 255, 255])
  const horizon = Math.floor(height * 0.68)
  for (let y = 0; y < horizon; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const peakOne = horizon - Math.max(0, 190 - Math.abs(x - width * 0.27) * 0.9)
      const peakTwo = horizon - Math.max(0, 260 - Math.abs(x - width * 0.6) * 0.75)
      if (y > peakOne || y > peakTwo) set(x, y, y > peakTwo ? [31, 43, 58] : [48, 66, 81])
    }
  }
  rect(0, horizon, width, height, [226, 75, 55])
  circle(Math.floor(width * 0.82), Math.floor(height * 0.2), 52, [246, 239, 217])

  const swatches: [number, number, number][] = [[225, 71, 56], [240, 179, 51], [69, 178, 116], [47, 156, 181], [49, 93, 191], [130, 76, 157]]
  swatches.forEach((color, index) => rect(48 + index * 67, horizon + 55, 100 + index * 67, horizon + 111, color))
  const chartX = width - 190
  const chartY = horizon + 35
  rect(chartX, chartY, width - 35, height - 25, [246, 242, 230])
  for (let y = chartY + 18; y < height - 42; y += 12) {
    for (let x = chartX + 18; x < width - 53; x += 12) {
      const checker = ((x - chartX) / 12 + (y - chartY) / 12) % 2 < 1
      rect(x, y, x + 12, y + 12, checker ? [25, 34, 47] : [228, 78, 57])
    }
  }
  for (let x = chartX + 18; x < width - 53; x += 1) {
    const value = Math.round(255 * (x - chartX - 18) / (width - chartX - 72))
    rect(x, height - 37, x + 1, height - 25, [value, value, value])
  }
  return { width, height, data }
}
