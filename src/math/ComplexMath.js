/**
 * ComplexMath - Pure functions for complex number operations
 * All functions are stateless and easily testable
 */

/**
 * Computes z^n for a complex number z represented as [real, imaginary]
 * @param {number[]} z - Complex number as [real, imaginary]
 * @param {number} n - Power to raise z to
 * @returns {number[]} Result as [real, imaginary]
 */
export function complexPower(z, n) {
  const [x, y] = z;
  
  // Optimization for common case z^2
  if (Math.abs(n - 2) < 0.01) {
    return [x * x - y * y, 2 * x * y];
  }
  
  // General case using polar form: z^n = r^n * e^(i*n*theta)
  const r = Math.sqrt(x * x + y * y);
  
  // Handle zero case
  if (r === 0) {
    return [0, 0];
  }
  
  const theta = Math.atan2(y, x);
  const newR = Math.pow(r, n);
  const newTheta = n * theta;
  
  return [newR * Math.cos(newTheta), newR * Math.sin(newTheta)];
}

/**
 * Computes the magnitude squared of a complex number
 * Avoids sqrt for performance in escape-time calculations
 * @param {number[]} z - Complex number as [real, imaginary]
 * @returns {number} |z|^2
 */
export function magnitudeSquared(z) {
  return z[0] * z[0] + z[1] * z[1];
}

/**
 * Computes the magnitude of a complex number
 * @param {number[]} z - Complex number as [real, imaginary]
 * @returns {number} |z|
 */
export function magnitude(z) {
  return Math.sqrt(z[0] * z[0] + z[1] * z[1]);
}

/**
 * Adds two complex numbers
 * @param {number[]} a - First complex number
 * @param {number[]} b - Second complex number
 * @returns {number[]} Sum as [real, imaginary]
 */
export function complexAdd(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

/**
 * Subtracts two complex numbers (a - b)
 * @param {number[]} a - First complex number
 * @param {number[]} b - Second complex number
 * @returns {number[]} Difference as [real, imaginary]
 */
export function complexSubtract(a, b) {
  return [a[0] - b[0], a[1] - b[1]];
}

/**
 * Multiplies two complex numbers
 * @param {number[]} a - First complex number
 * @param {number[]} b - Second complex number
 * @returns {number[]} Product as [real, imaginary]
 */
export function complexMultiply(a, b) {
  return [
    a[0] * b[0] - a[1] * b[1],
    a[0] * b[1] + a[1] * b[0]
  ];
}

/**
 * Computes the escape time for a point in the Mandelbrot set
 * @param {number[]} c - Complex constant c as [real, imaginary]
 * @param {number} maxIter - Maximum iterations
 * @param {number} power - Power for z^n + c formula
 * @param {Object} options - Additional options
 * @param {boolean} options.burningShip - Use burning ship variant
 * @param {boolean} options.juliaMode - Julia set mode
 * @param {number[]} options.juliaC - Julia constant when in Julia mode
 * @returns {number} Number of iterations before escape (maxIter if doesn't escape)
 */
export function mandelbrotIteration(c, maxIter, power, options = {}) {
  const { burningShip = false, juliaMode = false, juliaC = [0, 0] } = options;
  
  let z = juliaMode ? [...c] : [0, 0];
  const constant = juliaMode ? juliaC : c;
  
  for (let i = 0; i < maxIter; i++) {
    // Burning ship variant takes absolute values
    if (burningShip) {
      z = [Math.abs(z[0]), Math.abs(z[1])];
    }
    
    // z = z^n + c
    z = complexAdd(complexPower(z, power), constant);
    
    // Escape condition: |z|^2 > 4
    if (magnitudeSquared(z) > 4) {
      return i;
    }
  }
  
  return maxIter;
}

/**
 * Converts screen pixel coordinates to complex plane coordinates
 * @param {number} px - Pixel x coordinate
 * @param {number} py - Pixel y coordinate
 * @param {Object} viewport - Viewport configuration
 * @param {number} viewport.width - Canvas width in pixels
 * @param {number} viewport.height - Canvas height in pixels
 * @param {number} viewport.centerX - Center x in complex plane
 * @param {number} viewport.centerY - Center y in complex plane
 * @param {number} viewport.zoom - Zoom level
 * @returns {number[]} Complex coordinate as [real, imaginary]
 */
export function screenToComplex(px, py, viewport) {
  const { width, height, centerX, centerY, zoom } = viewport;
  const aspectRatio = width / height;
  
  // Normalize to [-1, 1]
  const normalizedX = (px / width - 0.5) * 2;
  const normalizedY = (py / height - 0.5) * 2;
  
  // Apply aspect ratio correction and zoom
  const scale = 2.0 / zoom;
  const real = centerX + normalizedX * aspectRatio * scale;
  const imag = centerY - normalizedY * scale; // Y is inverted in screen coords
  
  return [real, imag];
}

/**
 * Converts complex plane coordinates to screen pixel coordinates
 * @param {number} real - Real component
 * @param {number} imag - Imaginary component
 * @param {Object} viewport - Viewport configuration
 * @returns {number[]} Pixel coordinates as [x, y]
 */
export function complexToScreen(real, imag, viewport) {
  const { width, height, centerX, centerY, zoom } = viewport;
  const aspectRatio = width / height;
  
  const scale = 2.0 / zoom;
  
  const normalizedX = (real - centerX) / (aspectRatio * scale);
  const normalizedY = (centerY - imag) / scale;
  
  const px = (normalizedX / 2 + 0.5) * width;
  const py = (normalizedY / 2 + 0.5) * height;
  
  return [px, py];
}

/**
 * Calculates smooth iteration count for continuous coloring
 * Uses the normalized iteration count algorithm
 * @param {number[]} c - Complex constant
 * @param {number} maxIter - Maximum iterations
 * @param {number} power - Power for z^n + c
 * @returns {number} Smooth iteration count
 */
export function smoothIteration(c, maxIter, power) {
  let z = [0, 0];
  
  for (let i = 0; i < maxIter; i++) {
    z = complexAdd(complexPower(z, power), c);
    const magSq = magnitudeSquared(z);
    
    if (magSq > 256) { // Use larger escape radius for smoothing
      // Smooth coloring formula
      const log_zn = Math.log(magSq) / 2;
      const nu = Math.log(log_zn / Math.log(power)) / Math.log(power);
      return i + 1 - nu;
    }
  }
  
  return maxIter;
}
