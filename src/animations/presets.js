/**
 * Presets - Predefined fractal configurations and tour stops
 */

/**
 * Fractal preset configurations
 * Each preset defines a specific view and rendering parameters
 */
/**
 * Preset categories for organization
 */
export const PRESET_CATEGORIES = {
  CLASSIC: 'Classic Views',
  FAMOUS: 'Famous Locations',
  DEEP_ZOOM: 'Deep Zooms',
  JULIA: 'Julia Sets',
  VARIANTS: 'Fractal Variants'
};

export const PRESETS = {
  // ============ CLASSIC VIEWS ============
  classic: {
    name: 'Classic',
    description: 'The classic Mandelbrot set view',
    category: PRESET_CATEGORIES.CLASSIC,
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
    category: PRESET_CATEGORIES.CLASSIC,
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
    category: PRESET_CATEGORIES.CLASSIC,
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
    category: PRESET_CATEGORIES.CLASSIC,
    power: 5,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: false
  },

  // ============ FAMOUS LOCATIONS ============
  seahorse: {
    name: 'Seahorse Valley',
    description: 'Famous seahorse-shaped spiral region between main cardioid and period-2 bulb',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: -0.747,
    centerY: 0.1,
    zoom: 50,
    burningShip: false,
    juliaMode: false
  },
  
  elephant: {
    name: 'Elephant Valley',
    description: 'Region with elephant trunk-like structures on the east side',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: 0.275,
    centerY: 0,
    zoom: 10,
    burningShip: false,
    juliaMode: false
  },
  
  northernmost: {
    name: 'Northernmost Point',
    description: 'The highest point of the Mandelbrot set - a famous mathematical landmark',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: -0.207107867093967,
    centerY: 1.122757063632597,
    zoom: 100,
    burningShip: false,
    juliaMode: false
  },
  
  feigenbaum: {
    name: 'Feigenbaum Point',
    description: 'The period-doubling accumulation point, discovered by Mitchell Feigenbaum',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: -1.401155189,
    centerY: 0,
    zoom: 50,
    burningShip: false,
    juliaMode: false
  },
  
  misiurewicz: {
    name: 'Misiurewicz Point',
    description: 'Pre-periodic point with beautiful spiral structures - named after mathematician',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: -0.1011,
    centerY: 0.9563,
    zoom: 80,
    burningShip: false,
    juliaMode: false
  },
  
  satellite: {
    name: 'Satellite Valley',
    description: 'Beautiful region with miniature copies of the main set',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: -0.1592,
    centerY: 1.0317,
    zoom: 150,
    burningShip: false,
    juliaMode: false
  },
  
  tripleSpiral: {
    name: 'Triple Spiral',
    description: 'Junction where three spirals meet in intricate patterns',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: -0.04524,
    centerY: 0.9868,
    zoom: 100,
    burningShip: false,
    juliaMode: false
  },
  
  scepter: {
    name: 'Scepter Valley',
    description: 'Intricate antenna structures near the main antenna',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: -1.256,
    centerY: 0.38,
    zoom: 200,
    burningShip: false,
    juliaMode: false
  },
  
  lightningBolt: {
    name: 'Lightning Bolt',
    description: 'Striking lightning-like patterns in the upper region',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: -0.235125,
    centerY: 0.827215,
    zoom: 100,
    burningShip: false,
    juliaMode: false
  },
  
  antenna: {
    name: 'Main Antenna',
    description: 'The western antenna extending from the main set',
    category: PRESET_CATEGORIES.FAMOUS,
    power: 2,
    centerX: -1.75,
    centerY: 0,
    zoom: 3,
    burningShip: false,
    juliaMode: false
  },

  // ============ DEEP ZOOMS ============
  spiral: {
    name: 'Deep Spiral',
    description: 'Deep zoom into a beautiful spiral formation',
    category: PRESET_CATEGORIES.DEEP_ZOOM,
    power: 2,
    centerX: -0.743643887037151,
    centerY: 0.131825904205330,
    zoom: 1000,
    burningShip: false,
    juliaMode: false
  },
  
  deepSeahorse: {
    name: 'Deep Seahorse',
    description: 'Ultra-deep dive into the seahorse valley spirals',
    category: PRESET_CATEGORIES.DEEP_ZOOM,
    power: 2,
    centerX: -0.745428,
    centerY: 0.113009,
    zoom: 5000,
    burningShip: false,
    juliaMode: false
  },
  
  dendrite: {
    name: 'Deep Dendrite',
    description: 'Ultra-detailed filament structures at the antenna tip',
    category: PRESET_CATEGORIES.DEEP_ZOOM,
    power: 2,
    centerX: -1.768778833,
    centerY: -0.001738996,
    zoom: 2000,
    burningShip: false,
    juliaMode: false
  },
  
  miniMandelbrot: {
    name: 'Mini Mandelbrot',
    description: 'A tiny copy of the entire set hidden deep within',
    category: PRESET_CATEGORIES.DEEP_ZOOM,
    power: 2,
    centerX: -0.743643887037151,
    centerY: 0.131825904205330,
    zoom: 50000,
    burningShip: false,
    juliaMode: false
  },
  
  spiralGalaxy: {
    name: 'Spiral Galaxy',
    description: 'Galaxy-like spiral pattern deep in the set',
    category: PRESET_CATEGORIES.DEEP_ZOOM,
    power: 2,
    centerX: -0.761574,
    centerY: -0.0847596,
    zoom: 3000,
    burningShip: false,
    juliaMode: false
  },
  
  tendrilForest: {
    name: 'Tendril Forest',
    description: 'Intricate forest of tendrils near the main cardioid',
    category: PRESET_CATEGORIES.DEEP_ZOOM,
    power: 2,
    centerX: -0.749,
    centerY: 0.032,
    zoom: 1500,
    burningShip: false,
    juliaMode: false
  },
  
  doubleSpiral: {
    name: 'Double Spiral',
    description: 'Two intertwined spirals in perfect harmony',
    category: PRESET_CATEGORIES.DEEP_ZOOM,
    power: 2,
    centerX: -0.7453,
    centerY: 0.1127,
    zoom: 3000,
    burningShip: false,
    juliaMode: false
  },

  // ============ JULIA SETS ============
  juliaClassic: {
    name: 'Julia Classic',
    description: 'Classic Julia set at c = -0.4 + 0.6i with beautiful swirls',
    category: PRESET_CATEGORIES.JULIA,
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
    description: 'Dragon-shaped Julia set with intricate scales',
    category: PRESET_CATEGORIES.JULIA,
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
    description: 'San Marco basin Julia set - named after Venice\'s piazza',
    category: PRESET_CATEGORIES.JULIA,
    power: 2,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: true,
    juliaC: [-0.75, 0]
  },
  
  juliaRabbit: {
    name: 'Douady Rabbit',
    description: 'The famous Douady rabbit Julia set with three-fold symmetry',
    category: PRESET_CATEGORIES.JULIA,
    power: 2,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: true,
    juliaC: [-0.123, 0.745]
  },
  
  juliaSiegel: {
    name: 'Siegel Disk',
    description: 'Julia set with a Siegel disk - smooth circular region',
    category: PRESET_CATEGORIES.JULIA,
    power: 2,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: true,
    juliaC: [-0.391, -0.587]
  },
  
  juliaDendrite: {
    name: 'Julia Dendrite',
    description: 'Tree-like dendrite Julia set from the antenna',
    category: PRESET_CATEGORIES.JULIA,
    power: 2,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: true,
    juliaC: [0.0, 1.0]
  },
  
  juliaSpiral: {
    name: 'Julia Spiral',
    description: 'Mesmerizing spiral Julia set',
    category: PRESET_CATEGORIES.JULIA,
    power: 2,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: true,
    juliaC: [-0.7, 0.27015]
  },
  
  juliaFlower: {
    name: 'Julia Flower',
    description: 'Flower-like Julia set with delicate petals',
    category: PRESET_CATEGORIES.JULIA,
    power: 2,
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    burningShip: false,
    juliaMode: true,
    juliaC: [0.285, 0.01]
  },

  // ============ FRACTAL VARIANTS ============
  burning: {
    name: 'Burning Ship',
    description: 'The burning ship fractal variant - looks like a flaming vessel',
    category: PRESET_CATEGORIES.VARIANTS,
    power: 2,
    centerX: -0.5,
    centerY: -0.5,
    zoom: 1.0,
    burningShip: true,
    juliaMode: false
  },
  
  burningArmada: {
    name: 'Burning Armada',
    description: 'Deep zoom into the Burning Ship showing fleet of ships',
    category: PRESET_CATEGORIES.VARIANTS,
    power: 2,
    centerX: -1.762,
    centerY: -0.028,
    zoom: 50,
    burningShip: true,
    juliaMode: false
  },
  
  cubicNova: {
    name: 'Cubic Nova',
    description: 'Interesting region in the cubic Mandelbrot',
    category: PRESET_CATEGORIES.VARIANTS,
    power: 3,
    centerX: -0.5,
    centerY: 0.5,
    zoom: 20,
    burningShip: false,
    juliaMode: false
  }
};

/**
 * Tour stop locations for animated tours
 */
export const TOUR_STOPS = [
  {
    name: 'Overview',
    description: 'The complete Mandelbrot set',
    centerX: -0.5,
    centerY: 0,
    zoom: 1,
    duration: 3000
  },
  {
    name: 'Main Cardioid',
    description: 'The heart-shaped central region',
    centerX: -0.7,
    centerY: 0,
    zoom: 4,
    duration: 3000
  },
  {
    name: 'Seahorse Valley',
    description: 'Famous seahorse-shaped spirals',
    centerX: -0.747,
    centerY: 0.1,
    zoom: 50,
    duration: 4000
  },
  {
    name: 'Northernmost Point',
    description: 'The highest point of the Mandelbrot set',
    centerX: -0.207107867093967,
    centerY: 1.122757063632597,
    zoom: 80,
    duration: 4000
  },
  {
    name: 'Lightning Bolt',
    description: 'Striking lightning-like patterns',
    centerX: -0.235125,
    centerY: 0.827215,
    zoom: 100,
    duration: 4000
  },
  {
    name: 'Deep Spiral',
    description: 'Intricate spiral formation',
    centerX: -0.743643887037151,
    centerY: 0.131825904205330,
    zoom: 1000,
    duration: 5000
  },
  {
    name: 'Misiurewicz Point',
    description: 'Pre-periodic point with spirals',
    centerX: -0.1011,
    centerY: 0.9563,
    zoom: 80,
    duration: 4000
  },
  {
    name: 'Elephant Valley',
    description: 'Elephant trunk-like structures',
    centerX: 0.275,
    centerY: 0,
    zoom: 20,
    duration: 4000
  },
  {
    name: 'Feigenbaum Point',
    description: 'Period-doubling accumulation point',
    centerX: -1.401155189,
    centerY: 0,
    zoom: 50,
    duration: 4000
  },
  {
    name: 'Scepter Valley',
    description: 'Intricate antenna structures',
    centerX: -1.256,
    centerY: 0.38,
    zoom: 200,
    duration: 4000
  },
  {
    name: 'Triple Spiral',
    description: 'Three spirals meeting point',
    centerX: -0.04524,
    centerY: 0.9868,
    zoom: 100,
    duration: 4000
  },
  {
    name: 'Main Antenna',
    description: 'The western antenna of the set',
    centerX: -1.75,
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
