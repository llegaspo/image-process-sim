'use client'

import { MathFormula } from './MathFormula'
import type { Lesson } from '@/lib/lessons'
import type { PixelExplanation } from '@/lib/explain'
import type { InspectChannel } from '@/lib/imageProcessing'

export function CalculationPanel({ lesson, explanation, channel }: { lesson: Lesson; explanation: PixelExplanation; channel: InspectChannel }) {
  const hasProducts = explanation.trace.some((cell) => cell.weight !== undefined)
  return (
    <section className="calculation-section" id="calculation">
      <div className="calculation-heading">
        <span className="step-number">5</span>
        <div><span className="eyebrow">HOW THIS PIXEL CHANGED</span><h2>From definition to stored value</h2></div>
        <div className="channel-chip">INSPECTING {channel.toUpperCase()}</div>
      </div>
      <div className="calculation-layout">
        <div className="formula-column">
          <span className="micro-label">{lesson.formulaLabel}</span>
          <MathFormula formula={lesson.formula} className="main-formula" />
          <p>{lesson.explanation}</p>
          <a href={lesson.sourceUrl} target="_blank" rel="noreferrer">Primary reference · {lesson.sourceLabel} ↗</a>
        </div>
        <div className="arithmetic-column">
          <span className="micro-label">SELECTED-PIXEL SUBSTITUTION</span>
          <code className="equation-name">{explanation.equation}</code>
          <p className="arithmetic-line">{explanation.arithmetic}</p>
          {explanation.sortedValues && <div className="sorted-values">{explanation.sortedValues.map((value, index) => <span className={index === Math.floor(explanation.sortedValues!.length / 2) ? 'middle' : ''} key={`${value}-${index}`}>{Math.round(value)}</span>)}</div>}
          {explanation.trace.length > 0 && (
            <div className="product-table">
              <div className="product-row table-head"><span>offset</span><span>value</span>{hasProducts && <><span>weight</span><span>product</span></>}</div>
              {explanation.trace.map((cell, index) => (
                <div className={`product-row ${cell.center ? 'center' : ''}`} key={index}>
                  <span>({cell.dx}, {cell.dy})</span><span>{cell.value.toFixed(3)}</span>
                  {hasProducts && <><span>{cell.weight?.toFixed(6) ?? '—'}{cell.secondaryWeight !== undefined ? ` / ${cell.secondaryWeight}` : ''}</span><span>{cell.product?.toFixed(4) ?? '—'}{cell.secondaryProduct !== undefined ? ` / ${cell.secondaryProduct.toFixed(4)}` : ''}</span></>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="calculation-result">
          <span>RESULT</span>
          <b>{explanation.resultLabel}</b>
          <div className="value-transition"><code>{explanation.inputValue.toFixed(1)}</code><i>→</i><code>{explanation.outputValue.toFixed(1)}</code></div>
          <small>Full precision is retained until the final round-and-clamp step.</small>
        </div>
      </div>
    </section>
  )
}
