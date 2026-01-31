/**
 * ColorSchemes - Pure functions for fractal coloring
 * All functions return RGB arrays [r, g, b] with values 0-1
 */

/**
 * Color scheme identifiers
 */
export const COLOR_SCHEME_IDS = {
  RAINBOW: 0,
  FIRE: 1,
  ICE: 2,
  MATRIX: 3,
  PURPLE: 4,
  ELECTRIC_BLUE: 5,
  LAVA: 6,
  NEON: 7
};

/**
 * Color scheme names for display
 */
export const COLOR_SCHEME_NAMES = {
  [COLOR_SCHEME_IDS.RAINBOW]: 'Rainbow',
  [COLOR_SCHEME_IDS.FIRE]: 'Fire',
  [COLOR_SCHEME_IDS.ICE]: 'Ice',
  [COLOR_SCHEME_IDS.MATRIX]: 'Matrix Green',
  [COLOR_SCHEME_IDS.PURPLE]: 'Purple Haze',
  [COLOR_SCHEME_IDS.ELECTRIC_BLUE]: 'Electric Blue',
  [COLOR_SCHEME_IDS.LAVA]: 'Lava',
  [COLOR_SCHEME_IDS.NEON]: 'Neon'
};

/**
 * Number base names for display
 */
export const NUMBER_BASE_NAMES = {
  2: 'Binary',
  3: 'Ternary',
  4: 'Quaternary',
  5: 'Quinary',
  6: 'Senary',
  8: 'Octal',
  10: 'Decimal',
  12: 'Dozenal',
  16: 'Hexadecimal',
  32: 'Base-32',
  60: 'Sexagesimal'
};

/**
 * Available number bases
 */
export const AVAILABLE_BASES = [2, 3, 4, 5, 6, 8, 10, 12, 16, 32, 60];

/**
 * Converts HSL color values to RGB
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {number[]} RGB values as [r, g, b] (0-1)
 */
export function hsl2rgb(h, s, l) {
  // Handle edge cases
  h = ((h % 1) + 1) % 1; // Normalize to 0-1
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  
  let r, g, b;
  
  if (h < 1/6) {
    [r, g, b] = [c, x, 0];
  } else if (h < 2/6) {
    [r, g, b] = [x, c, 0];
  } else if (h < 3/6) {
    [r, g, b] = [0, c, x];
  } else if (h < 4/6) {
    [r, g, b] = [0, x, c];
  } else if (h < 5/6) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  return [r + m, g + m, b + m];
}

/**
 * Converts RGB to HSL
 * @param {number} r - Red (0-1)
 * @param {number} g - Green (0-1)
 * @param {number} b - Blue (0-1)
 * @returns {number[]} HSL values as [h, s, l] (0-1)
 */
export function rgb2hsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return [0, 0, l]; // Achromatic
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }
  
  return [h, s, l];
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two colors
 * @param {number[]} color1 - First RGB color [r, g, b]
 * @param {number[]} color2 - Second RGB color [r, g, b]
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number[]} Interpolated RGB color
 */
export function lerpColor(color1, color2, t) {
  return [
    lerp(color1[0], color2[0], t),
    lerp(color1[1], color2[1], t),
    lerp(color1[2], color2[2], t)
  ];
}

/**
 * Computes the color for a given iteration count using specified scheme
 * @param {number} iterations - Number of iterations before escape
 * @param {number} maxIterations - Maximum iteration limit
 * @param {number} base - Number base for color banding
 * @param {number} schemeId - Color scheme ID
 * @param {number} offset - Color offset for animation (0-100)
 * @returns {number[]} RGB color as [r, g, b] (0-1)
 */
export function getColor(iterations, maxIterations, base, schemeId, offset = 0) {
  // Points inside the set are black
  if (iterations >= maxIterations - 0.5) {
    return [0, 0, 0];
  }
  
  // Calculate base-based banding
  const baseValue = (iterations + offset) % base;
  const baseFraction = baseValue / base;
  const t = iterations / maxIterations;
  
  switch (schemeId) {
    case COLOR_SCHEME_IDS.RAINBOW: {
      const hue = (baseFraction + t + offset / 100) % 1;
      return hsl2rgb(hue, 1.0, 0.5);
    }
    
    case COLOR_SCHEME_IDS.FIRE:
      return [t, 0.8 * baseFraction, 0.2 * (1 - t)];
    
    case COLOR_SCHEME_IDS.ICE:
      return [0.2 * baseFraction, 0.6 * t, 0.5 + 0.5 * baseFraction];
    
    case COLOR_SCHEME_IDS.MATRIX:
      return [0.0, 0.3 + 0.7 * baseFraction, 0.4 * t];
    
    case COLOR_SCHEME_IDS.PURPLE:
      return [0.8 * baseFraction, 0.2 * t, 0.5 + 0.5 * baseFraction];
    
    case COLOR_SCHEME_IDS.ELECTRIC_BLUE:
      return [0.1 * baseFraction, 0.5 * t, 0.8 + 0.2 * baseFraction];
    
    case COLOR_SCHEME_IDS.LAVA:
      return [0.9 * t, 0.3 * baseFraction, 0.1];
    
    case COLOR_SCHEME_IDS.NEON: {
      const hue = (baseFraction * 3 + offset / 50) % 1;
      return hsl2rgb(hue, 1.0, 0.5 + 0.3 * Math.sin(t * 10));
    }
    
    default:
      return hsl2rgb(baseFraction, 1.0, 0.5);
  }
}

/**
 * Converts normalized RGB (0-1) to 8-bit RGB (0-255)
 * @param {number[]} rgb - RGB values [r, g, b] (0-1)
 * @returns {number[]} RGB values [r, g, b] (0-255)
 */
export function rgbTo8bit(rgb) {
  return [
    Math.round(rgb[0] * 255),
    Math.round(rgb[1] * 255),
    Math.round(rgb[2] * 255)
  ];
}

/**
 * Converts 8-bit RGB (0-255) to normalized RGB (0-1)
 * @param {number[]} rgb - RGB values [r, g, b] (0-255)
 * @returns {number[]} RGB values [r, g, b] (0-1)
 */
export function rgbFromBit(rgb) {
  return [
    rgb[0] / 255,
    rgb[1] / 255,
    rgb[2] / 255
  ];
}

/**
 * Converts RGB to hex string
 * @param {number[]} rgb - RGB values [r, g, b] (0-1)
 * @returns {string} Hex color string (e.g., "#ff0000")
 */
export function rgbToHex(rgb) {
  const [r, g, b] = rgbTo8bit(rgb);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Parses hex color string to RGB
 * @param {string} hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns {number[]} RGB values [r, g, b] (0-1)
 */
export function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  const bigint = parseInt(hex, 16);
  return [
    ((bigint >> 16) & 255) / 255,
    ((bigint >> 8) & 255) / 255,
    (bigint & 255) / 255
  ];
}
