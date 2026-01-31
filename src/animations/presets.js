/**
 * Presets - Predefined fractal configurations and tour stops
 */

/**
 * Fractal preset configurations
 * Each preset defines a specific view and rendering parameters
 */
export const PRESETS = {
  classic: {
    name: 'Classic',
    description: 'The classic Mandelbrot set view',
    power: 2,
    centerX: -0.5,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: false
  },
  
  cubic: {
    name: 'Cubic',
    description: 'z³ + c - Three-fold symmetry',
    power: 3,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: false
  },
  
  quartic: {
    name: 'Quartic',
    description: 'z⁴ + c - Four-fold symmetry',
    power: 4,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: false
  },
  
  quintic: {
    name: 'Quintic',
    description: 'z⁵ + c - Five-fold symmetry',
    power: 5,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: false
  },
  
  burning: {
    name: 'Burning Ship',
    description: 'The burning ship fractal variant',
    power: 2,
    centerX: -0.5,
    centerY: -0.5,
    zoom: 1.0,
    burningShip: true,
    juliaMode: false
  },
  
  seahorse: {
    name: 'Seahorse Valley',
    description: 'Famous seahorse-shaped spiral region',
    power: 2,
    centerX: -0.747,
    centerY: 0.1,
    zoom: 50,
    burningShip: false,
    juliaMode: false
  },
  
  elephant: {
    name: 'Elephant Valley',
    description: 'Region with elephant trunk-like structures',
    power: 2,
    centerX: 0.275,
    centerY: 0,
    zoom: 10,
    burningShip: false,
    juliaMode: false
  },
  
  spiral: {
    name: 'Deep Spiral',
    description: 'Deep zoom into a spiral formation',
    power: 2,
    centerX: -0.743643887037151,
    centerY: 0.131825904205330,
    zoom: 1000,
    burningShip: false,
    juliaMode: false
  },
  
  tripleSpiral: {
    name: 'Triple Spiral',
    description: 'Triple spiral junction',
    power: 2,
    centerX: -0.04524,
    centerY: 0.9868,
    zoom: 100,
    burningShip: false,
    juliaMode: false
  },
  
  juliaClassic: {
    name: 'Julia Classic',
    description: 'Classic Julia set at c = -0.4 + 0.6i',
    power: 2,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: true,
    juliaC: [-0.4, 0.6]
  },
  
  juliaDragon: {
    name: 'Julia Dragon',
    description: 'Dragon-shaped Julia set',
    power: 2,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: true,
    juliaC: [-0.8, 0.156]
  },
  
  juliaSan: {
    name: 'Julia San Marco',
    description: 'San Marco basin Julia set',
    power: 2,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: true,
    juliaC: [-0.75, 0]
  }
};

/**
 * Tour stop locations for animated tours
 */
export const TOUR_STOPS = [
  {
    name: 'Overview',
    centerX: -0.5,
    centerY: 0,
    zoom: 1,
    duration: 3000
  },
  {
    name: 'Main Cardioid',
    centerX: -0.7,
    centerY: 0,
    zoom: 4,
    duration: 3000
  },
  {
    name: 'Seahorse Valley',
    centerX: -0.747,
    centerY: 0.1,
    zoom: 50,
    duration: 4000
  },
  {
    name: 'Spiral Detail',
    centerX: -0.235125,
    centerY: 0.827215,
    zoom: 100,
    duration: 4000
  },
  {
    name: 'Mini Mandelbrot',
    centerX: -0.743643887037151,
    centerY: 0.131825904205330,
    zoom: 1000,
    duration: 5000
  },
  {
    name: 'Elephant Valley',
    centerX: 0.275,
    centerY: 0,
    zoom: 20,
    duration: 4000
  },
  {
    name: 'Antenna',
    centerX: -1.25,
    centerY: 0,
    zoom: 5,
    duration: 3000
  }
];

/**
 * Available number bases for visualization
 */
export const NUMBER_BASES = [2, 3, 4, 5, 6, 8, 10, 12, 16, 32, 60];

/**
 * Animation types
 */
export const ANIMATION_TYPES = {
  ZOOM: 'zoom',
  COLOR_CYCLE: 'rotate',
  POWER_MORPH: 'morph',
  BASE_CYCLE: 'base',
  TOUR: 'tour',
  JULIA_MORPH: 'julia'
};

/**
 * Gets a preset by name
 * @param {string} name - Preset name
 * @returns {Object|null} Preset configuration or null
 */
export function getPreset(name) {
  return PRESETS[name] || null;
}

/**
 * Gets all preset names
 * @returns {string[]} Array of preset names
 */
export function getPresetNames() {
  return Object.keys(PRESETS);
}

/**
 * Gets all presets as an array
 * @returns {Array} Array of preset objects with id
 */
export function getAllPresets() {
  return Object.entries(PRESETS).map(([id, preset]) => ({
    id,
    ...preset
  }));
}

/**
 * Validates a preset configuration
 * @param {Object} preset - Preset to validate
 * @returns {boolean} True if valid
 */
export function isValidPreset(preset) {
  if (!preset || typeof preset !== 'object') {
    return false;
  }
  
  const requiredFields = ['power', 'centerX', 'centerY', 'zoom'];
  
  for (const field of requiredFields) {
    if (typeof preset[field] !== 'number') {
      return false;
    }
  }
  
  if (preset.juliaMode && !Array.isArray(preset.juliaC)) {
    return false;
  }
  
  return true;
}

/**
 * Interpolates between two presets
 * @param {Object} from - Starting preset
 * @param {Object} to - Ending preset
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Object} Interpolated preset
 */
export function interpolatePresets(from, to, t) {
  // Ease function for smooth transitions
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const et = ease(t);
  
  const lerp = (a, b) => a + (b - a) * et;
  
  return {
    centerX: lerp(from.centerX, to.centerX),
    centerY: lerp(from.centerY, to.centerY),
    zoom: Math.exp(lerp(Math.log(from.zoom), Math.log(to.zoom))), // Log interpolation for zoom
    power: lerp(from.power, to.power),
    burningShip: t > 0.5 ? to.burningShip : from.burningShip,
    juliaMode: t > 0.5 ? to.juliaMode : from.juliaMode,
    juliaC: from.juliaC && to.juliaC ? [
      lerp(from.juliaC[0], to.juliaC[0]),
      lerp(from.juliaC[1], to.juliaC[1])
    ] : (t > 0.5 ? to.juliaC : from.juliaC)
  };
}
