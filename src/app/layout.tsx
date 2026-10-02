import type { Metadata } from 'next'
import { IBM_Plex_Mono, Instrument_Sans, Newsreader } from 'next/font/google'
import 'katex/dist/katex.min.css'
import './globals.css'

const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans' })
const serif = Newsreader({ subsets: ['latin'], variable: '--font-serif' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Image Lab — Image Processing Fundamentals',
  description: 'Explore image processing through pixels, neighborhoods, kernels, formulas, and exact calculations.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
