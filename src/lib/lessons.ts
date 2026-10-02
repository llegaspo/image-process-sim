import type { TechniqueId } from './imageProcessing'

export interface Lesson {
  id: TechniqueId
  number: string
  title: string
  shortTitle: string
  category: 'Pixels & tone' | 'Neighborhoods' | 'Edges' | 'Global & shape'
  kind: 'point' | 'neighborhood' | 'global' | 'multistage' | 'geometry'
  description: string
  formula: string
  formulaLabel: string
  explanation: string
  sourceLabel: string
  sourceUrl: string
}

export const LESSONS: Lesson[] = [
  {
    id: 'channels', number: '01', title: 'RGB channels', shortTitle: 'Channels', category: 'Pixels & tone', kind: 'point',
    description: 'A browser pixel stores red, green, blue, and alpha components. Isolate a channel to see which locations carry that primary.',
    formula: 'P(x,y)=[R,G,B,A],\\quad R,G,B,A\\in\\{0,\\ldots,255\\}', formulaLabel: '8-bit RGBA pixel',
    explanation: 'Canvas ImageData stores four consecutive values per pixel in RGBA order. This lab preserves alpha unless the lesson explicitly resamples the image.',
    sourceLabel: 'MDN · ImageData.data', sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/ImageData/data',
  },
  {
    id: 'grayscale', number: '02', title: 'RGB to grayscale', shortTitle: 'Grayscale', category: 'Pixels & tone', kind: 'point',
    description: 'Reduce three encoded color channels to one intensity value using either the documented BT.601/OpenCV weights or a simple arithmetic mean.',
    formula: 'Y=0.299R+0.587G+0.114B', formulaLabel: 'Weighted encoded luma',
    explanation: 'This is an encoded luma convention, not a universal measure of physical luminance. Converting gray back to RGB copies Y into all three color channels.',
    sourceLabel: 'OpenCV · Color conversions', sourceUrl: 'https://docs.opencv.org/4.x/de/d25/imgproc_color_conversions.html',
  },
  {
    id: 'threshold', number: '03', title: 'Binary threshold', shortTitle: 'Threshold', category: 'Pixels & tone', kind: 'point',
    description: 'Classify every pixel into one of two values using a manually selected intensity boundary.',
    formula: 'B(x,y)=\\begin{cases}255&Y(x,y)>T\\\\0&Y(x,y)\\le T\\end{cases}', formulaLabel: 'Binary decision',
    explanation: 'A binary image contains only black and white. It is different from grayscale, which can contain all 256 encoded intensity values.',
    sourceLabel: 'OpenCV · Thresholding', sourceUrl: 'https://docs.opencv.org/4.x/d7/d4d/tutorial_py_thresholding.html',
  },
  {
    id: 'tone', number: '04', title: 'Brightness & contrast', shortTitle: 'Tone', category: 'Pixels & tone', kind: 'point',
    description: 'Apply the same linear gain and bias independently to each color channel.',
    formula: "C'=\\operatorname{clamp}(\\alpha C+\\beta,0,255)", formulaLabel: 'Linear point transform',
    explanation: 'Gain α changes the spacing between encoded values; bias β shifts them. Values outside the 8-bit interval must be saturated.',
    sourceLabel: 'OpenCV · Linear transforms', sourceUrl: 'https://docs.opencv.org/4.x/d3/dc1/tutorial_basic_linear_transform.html',
  },
  {
    id: 'invert', number: '05', title: 'Intensity inversion', shortTitle: 'Invert', category: 'Pixels & tone', kind: 'point',
    description: 'Reflect every encoded channel value across the midpoint of the 8-bit interval.',
    formula: "C'=255-C", formulaLabel: '8-bit complement',
    explanation: 'Inversion is its own inverse: applying the operation twice returns the original color values.',
    sourceLabel: 'OpenCV · Pixelwise operations', sourceUrl: 'https://docs.opencv.org/4.x/d2/de8/group__core__array.html',
  },
  {
    id: 'gamma', number: '06', title: 'Gamma mapping', shortTitle: 'Gamma', category: 'Pixels & tone', kind: 'point',
    description: 'Use a nonlinear power curve to redistribute encoded brightness values.',
    formula: "C'=255\\left(\\frac{C}{255}\\right)^\\gamma", formulaLabel: 'Power-law mapping',
    explanation: 'With this displayed convention, γ below 1 brightens midtones and γ above 1 darkens them. This teaching transform is not a complete color-management pipeline.',
    sourceLabel: 'OpenCV · Gamma correction', sourceUrl: 'https://docs.opencv.org/4.x/d3/dc1/tutorial_basic_linear_transform.html',
  },
  {
    id: 'boxBlur', number: '07', title: 'Box blur', shortTitle: 'Box blur', category: 'Neighborhoods', kind: 'neighborhood',
    description: 'Replace each pixel by the equally weighted mean of an n×n neighborhood.',
    formula: "I'(x,y)=\\sum_{i=-r}^{r}\\sum_{j=-r}^{r}\\frac{1}{n^2}I(x+i,y+j),\\quad n=2r+1", formulaLabel: 'Uniform neighborhood filter',
    explanation: 'A 3×3 window has 9 samples; 5×5 has 25. Every weight is 1/n², so the complete kernel sums to one.',
    sourceLabel: 'OpenCV · Smoothing images', sourceUrl: 'https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html',
  },
  {
    id: 'gaussianBlur', number: '08', title: 'Gaussian blur', shortTitle: 'Gaussian', category: 'Neighborhoods', kind: 'neighborhood',
    description: 'Average a neighborhood with weights that decrease smoothly with distance from the center.',
    formula: 'K(i,j)=\\frac{\\exp(-(i^2+j^2)/(2\\sigma^2))}{\\sum_{a,b}\\exp(-(a^2+b^2)/(2\\sigma^2))}', formulaLabel: 'Normalized discrete Gaussian',
    explanation: 'The implementation calculates full-precision weights and normalizes their discrete sum to one. Rounded values are only for display.',
    sourceLabel: 'OpenCV · Gaussian smoothing', sourceUrl: 'https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html',
  },
  {
    id: 'median', number: '09', title: 'Median filter', shortTitle: 'Median', category: 'Neighborhoods', kind: 'neighborhood',
    description: 'Sort the neighborhood values and select the middle observation instead of averaging.',
    formula: "I'(x,y)=\\operatorname{median}\\{I(x+i,y+j):(i,j)\\in W_r\\}", formulaLabel: 'Nonlinear rank filter',
    explanation: 'The median is always one of the sampled values. It is especially useful for isolated salt-and-pepper noise and is not a convolution.',
    sourceLabel: 'OpenCV · Median smoothing', sourceUrl: 'https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html',
  },
  {
    id: 'sharpen', number: '10', title: 'Laplacian sharpening', shortTitle: 'Sharpen', category: 'Neighborhoods', kind: 'neighborhood',
    description: 'Increase local contrast by adding a scaled four-neighbor high-frequency response to the center pixel.',
    formula: "I'=I+s(4I-I_N-I_S-I_E-I_W)", formulaLabel: 'Four-neighbor sharpening',
    explanation: 'The displayed kernel sums to one, preserving constant regions before final clipping while strengthening rapid changes.',
    sourceLabel: 'OpenCV · Mask operations', sourceUrl: 'https://docs.opencv.org/5.0/tutorials/core/mat-mask-operations/mat_mask_operations.html',
  },
  {
    id: 'sobel', number: '11', title: 'Sobel gradients', shortTitle: 'Sobel', category: 'Edges', kind: 'neighborhood',
    description: 'Estimate horizontal and vertical first derivatives, then inspect either component or their Euclidean magnitude.',
    formula: 'G=\\sqrt{G_x^2+G_y^2},\\quad \\theta=\\operatorname{atan2}(G_y,G_x)', formulaLabel: 'Gradient magnitude and direction',
    explanation: 'Sobel combines differentiation with a small amount of smoothing. Large magnitudes indicate rapid intensity change, not an object by themselves.',
    sourceLabel: 'OpenCV · Sobel derivatives', sourceUrl: 'https://docs.opencv.org/4.x/d2/d2c/tutorial_sobel_derivatives.html',
  },
  {
    id: 'laplacian', number: '12', title: 'Laplacian response', shortTitle: 'Laplacian', category: 'Edges', kind: 'neighborhood',
    description: 'Approximate the sum of second spatial derivatives with a symmetric four-neighbor mask.',
    formula: '\\nabla^2 I\\approx I_N+I_S+I_E+I_W-4I', formulaLabel: 'Discrete second derivative',
    explanation: 'The signed response changes around an edge. The display uses absolute magnitude so positive and negative responses are both visible.',
    sourceLabel: 'OpenCV · Laplace operator', sourceUrl: 'https://docs.opencv.org/4.x/d5/db5/tutorial_laplace_operator.html',
  },
  {
    id: 'canny', number: '13', title: 'Canny edge detector', shortTitle: 'Canny', category: 'Edges', kind: 'multistage',
    description: 'Build a thin binary edge map through smoothing, gradients, non-maximum suppression, and hysteresis connectivity.',
    formula: 'G\\rightarrow\\operatorname{NMS}(G,\\theta)\\rightarrow\\operatorname{hysteresis}(T_{low},T_{high})', formulaLabel: 'Four-stage detector',
    explanation: 'Strong responses are accepted; weak responses survive only when connected to a strong edge. The high threshold must remain above the low threshold.',
    sourceLabel: 'OpenCV · Canny detector', sourceUrl: 'https://docs.opencv.org/4.x/d7/de1/tutorial_js_canny.html',
  },
  {
    id: 'otsu', number: '14', title: 'Otsu thresholding', shortTitle: 'Otsu', category: 'Global & shape', kind: 'global',
    description: 'Choose a global binary threshold by minimizing the weighted variance within the two resulting classes.',
    formula: '\\sigma_w^2(t)=q_1(t)\\sigma_1^2(t)+q_2(t)\\sigma_2^2(t)', formulaLabel: 'Automatic global threshold',
    explanation: 'Otsu works best for a bimodal histogram. Unlike manual thresholding, its selected value depends on the entire image distribution.',
    sourceLabel: 'OpenCV · Otsu binarization', sourceUrl: 'https://docs.opencv.org/4.x/d7/d4d/tutorial_py_thresholding.html',
  },
  {
    id: 'equalize', number: '15', title: 'Histogram equalization', shortTitle: 'Equalize', category: 'Global & shape', kind: 'global',
    description: 'Use the cumulative intensity distribution as a lookup table that spreads occupied grayscale levels across the available range.',
    formula: "Y'=\\operatorname{round}\\left(\\frac{CDF(Y)-CDF_{min}}{N-CDF_{min}}\\,255\\right)", formulaLabel: 'CDF remapping',
    explanation: 'This is a global transform: the selected pixel cannot be calculated without statistics from the entire image. It may also amplify noise.',
    sourceLabel: 'OpenCV · Histogram equalization', sourceUrl: 'https://docs.opencv.org/4.x/d4/d1b/tutorial_histogram_equalization.html',
  },
  {
    id: 'morphology', number: '16', title: 'Binary morphology', shortTitle: 'Morphology', category: 'Global & shape', kind: 'neighborhood',
    description: 'Use a binary structuring element to shrink, expand, open, or close foreground regions.',
    formula: '(A\\ominus B)(x)=\\min_{b\\in B}A(x+b),\\quad(A\\oplus B)(x)=\\max_{b\\in B}A(x-b)', formulaLabel: 'Erosion and dilation',
    explanation: 'Opening is erosion followed by dilation; closing reverses that order. This lab first binarizes intensity at 127.',
    sourceLabel: 'OpenCV · Morphological transforms', sourceUrl: 'https://docs.opencv.org/4.x/d9/d61/tutorial_py_morphological_ops.html',
  },
  {
    id: 'resize', number: '17', title: 'Image resampling', shortTitle: 'Resampling', category: 'Global & shape', kind: 'geometry',
    description: 'Map each destination-pixel center into source coordinates, then reconstruct a value with nearest-neighbor or bilinear interpolation.',
    formula: 'x_s=\\frac{x_d+0.5}{s}-0.5,\\quad I_b=(1-t_x)(1-t_y)I_{00}+t_x(1-t_y)I_{10}+\\cdots', formulaLabel: 'Center-aligned bilinear sampling',
    explanation: 'Nearest-neighbor selects one sample. Bilinear interpolation combines the four surrounding samples but does not add new source detail.',
    sourceLabel: 'OpenCV · Geometric transforms', sourceUrl: 'https://docs.opencv.org/4.x/da/d54/group__imgproc__transform.html',
  },
]

export const lessonById = (id: TechniqueId) => LESSONS.find((lesson) => lesson.id === id) ?? LESSONS[0]
