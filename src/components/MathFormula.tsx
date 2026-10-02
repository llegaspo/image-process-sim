'use client'

import katex from 'katex'

export function MathFormula({ formula, display = true, className = '' }: { formula: string; display?: boolean; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: katex.renderToString(formula, { displayMode: display, throwOnError: false, strict: false }) }} />
}
