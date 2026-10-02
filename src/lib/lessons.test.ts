import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { LESSONS } from './lessons'
import { createDemoImage } from './demoImage'
import { DEFAULT_SETTINGS, processImage } from './imageProcessing'

describe('lesson curriculum', () => {
  it('defines a unique, sourced lesson for every included concept', () => {
    expect(LESSONS).toHaveLength(17)
    expect(new Set(LESSONS.map((lesson) => lesson.id)).size).toBe(LESSONS.length)
    for (const lesson of LESSONS) {
      expect(lesson.sourceUrl).toMatch(/^https:\/\//)
      expect(lesson.formula.length).toBeGreaterThan(3)
    }
  })

  it('renders every formula without a KaTeX parse error', () => {
    for (const lesson of LESSONS) {
      expect(() => katex.renderToString(lesson.formula, { throwOnError: true })).not.toThrow()
    }
  })

  it('executes every lesson processor with internally consistent output dimensions', () => {
    const source = createDemoImage(24, 16)
    for (const lesson of LESSONS) {
      const result = processImage(source, lesson.id, DEFAULT_SETTINGS)
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
      expect(result.data).toHaveLength(result.width * result.height * 4)
    }
  })
})
