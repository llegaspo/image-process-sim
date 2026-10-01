import type { PixelBuffer } from './imageProcessing'

export function createDemoImage(width = 720, height = 480): PixelBuffer {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })!

  const sky = context.createLinearGradient(0, 0, width, height)
  sky.addColorStop(0, '#0f3154')
  sky.addColorStop(0.48, '#36a7b5')
  sky.addColorStop(1, '#f2ca7b')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  context.fillStyle = 'rgba(255,255,255,.18)'
  for (let x = 0; x < width; x += 32) context.fillRect(x, 0, 1, height)
  for (let y = 0; y < height; y += 32) context.fillRect(0, y, width, 1)

  context.fillStyle = '#f4efe5'
  context.beginPath()
  context.arc(574, 102, 58, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#e85644'
  context.fillRect(0, 320, width, 160)
  context.fillStyle = '#172234'
  context.beginPath()
  context.moveTo(0, 348)
  context.lineTo(185, 172)
  context.lineTo(330, 348)
  context.closePath()
  context.fill()
  context.fillStyle = '#253b58'
  context.beginPath()
  context.moveTo(224, 348)
  context.lineTo(428, 122)
  context.lineTo(650, 348)
  context.closePath()
  context.fill()

  const swatches = ['#e85644', '#f1b84b', '#65c991', '#38a8c4', '#315bb3', '#8d5bbd']
  swatches.forEach((color, index) => {
    context.fillStyle = color
    context.fillRect(44 + index * 68, 383, 52, 52)
  })

  context.fillStyle = '#f8f4e9'
  context.fillRect(486, 355, 184, 96)
  context.fillStyle = '#172234'
  context.font = '700 22px Manrope, sans-serif'
  context.fillText('PIXELS', 518, 399)
  context.font = '500 13px DM Mono, monospace'
  context.fillText('R  G  B  →  Y', 517, 425)

  const image = context.getImageData(0, 0, width, height)
  return { width, height, data: image.data }
}
