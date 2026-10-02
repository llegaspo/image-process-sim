# Image Lab

Image Lab is an interactive, browser-only course for understanding image processing through source pixels, two-dimensional neighborhoods, kernels, exact arithmetic, and visible results.

## Curriculum

The 17 lessons cover:

- RGBA storage, RGB channels, and grayscale conversion
- Manual and Otsu binary thresholding
- Brightness, contrast, inversion, and gamma mapping
- 4-neighbor, 8-neighbor, and square-window neighborhoods
- Box, Gaussian, and median filtering
- Sharpening, Sobel gradients, Laplacian response, and Canny edges
- Histograms and histogram equalization
- Binary morphology
- Nearest-neighbor and bilinear resampling

Every lesson includes its general formula, a substituted calculation for the selected pixel, implementation assumptions, and a primary technical reference. Uploaded images stay in the browser.

## Stack

- pnpm
- Next.js App Router with static export
- React and strict TypeScript
- Web Worker image processing
- KaTeX equations
- Vitest and Playwright

## Development

```bash
pnpm install
pnpm dev
```

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Or run the complete sequence with `pnpm verify`.

The generated visual reference used for the redesign is retained at [`design/reference/image-lab-concept.png`](design/reference/image-lab-concept.png).
