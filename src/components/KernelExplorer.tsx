'use client'

import { kernelForTechnique, type ProcessingSettings, type TechniqueId } from '@/lib/imageProcessing'

export function KernelExplorer({ technique, settings }: { technique: TechniqueId; settings: ProcessingSettings }) {
  const kernel = kernelForTechnique(technique, settings)
  if (!kernel) {
    const rule = technique === 'median' ? 'SORT → MIDDLE'
      : technique === 'morphology' ? `${settings.morphologyOperation.toUpperCase()} · ${settings.kernelSize}×${settings.kernelSize}`
        : technique === 'sobel' ? 'Gx + Gy'
          : technique === 'canny' ? 'BLUR → GRADIENT → NMS → HYSTERESIS'
            : technique === 'equalize' || technique === 'otsu' ? 'USES THE FULL HISTOGRAM'
              : technique === 'resize' ? settings.resizeMethod.toUpperCase()
                : 'ONE INPUT PIXEL → ONE OUTPUT PIXEL'
    return <div className="operator-rule"><span>OPERATOR</span><b>{rule}</b></div>
  }
  const sum = kernel.flat().reduce((total, value) => total + value, 0)
  const maxMagnitude = Math.max(...kernel.flat().map(Math.abs), 0.0001)
  return (
    <div className="kernel-explorer">
      <div className="matrix-grid kernel" style={{ gridTemplateColumns: `repeat(${kernel.length}, 1fr)` }}>
        {kernel.flat().map((value, index) => {
          const intensity = Math.abs(value) / maxMagnitude
          const negative = value < 0
          return <span key={index} className={negative ? 'negative' : ''} style={{ '--cell-alpha': intensity } as React.CSSProperties}>{Math.abs(value) < 0.0005 ? '0' : value.toFixed(3)}</span>
        })}
      </div>
      <div className="kernel-total"><span>Full-precision sum</span><b>Σ K = {sum.toFixed(6)}</b></div>
      <p>Values are rounded here only for display. The mask is applied as cross-correlation; every shown mask is symmetric, so its result is also identical to convolution.</p>
    </div>
  )
}
