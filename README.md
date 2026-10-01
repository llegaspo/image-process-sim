# Pixel Forge

Pixel Forge is an interactive, browser-only image-processing lab. It connects each visual transformation to its formula, the source pixel values, and the resulting values.

## Included lessons

- RGB channel isolation
- Weighted and arithmetic-mean grayscale
- Binary thresholding
- Brightness and contrast
- Inversion
- Box, Gaussian, and median blur
- Laplacian-style sharpening
- Sobel edge detection
- Histogram equalization

Users can upload an image, inspect individual pixels, compare input and output, build a reorderable processing pipeline, and export the result. Images never leave the browser.

## Run locally

```bash
npm install
npm run dev
```

Then open the local address printed by Vite.

## Verification

```bash
npm test
npm run test:e2e
npm run build
```

The unit tests use hand-calculated fixtures for pixel math and filter behavior. The browser tests exercise desktop and mobile interactions.
