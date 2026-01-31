import {
  PRESETS,
  TOUR_STOPS,
  NUMBER_BASES,
  ANIMATION_TYPES,
  getPreset,
  getPresetNames,
  getAllPresets,
  isValidPreset,
  interpolatePresets
} from '../../src/animations/presets.js';

describe('presets', () => {
  describe('PRESETS', () => {
    test('should contain classic preset', () => {
      expect(PRESETS.classic).toBeDefined();
      expect(PRESETS.classic.power).toBe(2);
      expect(PRESETS.classic.centerX).toBe(-0.5);
    });

    test('should contain cubic preset', () => {
      expect(PRESETS.cubic).toBeDefined();
      expect(PRESETS.cubic.power).toBe(3);
    });

    test('should contain burning ship preset', () => {
      expect(PRESETS.burning).toBeDefined();
      expect(PRESETS.burning.burningShip).toBe(true);
    });

    test('should contain Julia presets', () => {
      expect(PRESETS.juliaClassic).toBeDefined();
      expect(PRESETS.juliaClassic.juliaMode).toBe(true);
      expect(PRESETS.juliaClassic.juliaC).toBeDefined();
    });

    test('all presets should have required fields', () => {
      for (const [name, preset] of Object.entries(PRESETS)) {
        expect(preset.power).toBeGreaterThanOrEqual(1);
        expect(typeof preset.centerX).toBe('number');
        expect(typeof preset.centerY).toBe('number');
        expect(typeof preset.zoom).toBe('number');
        expect(preset.name).toBeDefined();
      }
    });
  });

  describe('TOUR_STOPS', () => {
    test('should have multiple stops', () => {
      expect(TOUR_STOPS.length).toBeGreaterThan(0);
    });

    test('each stop should have required fields', () => {
      for (const stop of TOUR_STOPS) {
        expect(typeof stop.centerX).toBe('number');
        expect(typeof stop.centerY).toBe('number');
        expect(typeof stop.zoom).toBe('number');
        expect(typeof stop.duration).toBe('number');
        expect(stop.name).toBeDefined();
      }
    });

    test('should start with overview', () => {
      expect(TOUR_STOPS[0].name).toBe('Overview');
    });
  });

  describe('NUMBER_BASES', () => {
    test('should contain common bases', () => {
      expect(NUMBER_BASES).toContain(2);  // Binary
      expect(NUMBER_BASES).toContain(10); // Decimal
      expect(NUMBER_BASES).toContain(16); // Hex
    });

    test('should be sorted', () => {
      const sorted = [...NUMBER_BASES].sort((a, b) => a - b);
      expect(NUMBER_BASES).toEqual(sorted);
    });
  });

  describe('ANIMATION_TYPES', () => {
    test('should have all animation types', () => {
      expect(ANIMATION_TYPES.ZOOM).toBe('zoom');
      expect(ANIMATION_TYPES.COLOR_CYCLE).toBe('rotate');
      expect(ANIMATION_TYPES.POWER_MORPH).toBe('morph');
      expect(ANIMATION_TYPES.BASE_CYCLE).toBe('base');
      expect(ANIMATION_TYPES.TOUR).toBe('tour');
      expect(ANIMATION_TYPES.JULIA_MORPH).toBe('julia');
    });
  });

  describe('getPreset', () => {
    test('should return preset by name', () => {
      const classic = getPreset('classic');
      expect(classic).toEqual(PRESETS.classic);
    });

    test('should return null for unknown preset', () => {
      expect(getPreset('nonexistent')).toBeNull();
    });
  });

  describe('getPresetNames', () => {
    test('should return array of preset names', () => {
      const names = getPresetNames();
      
      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain('classic');
      expect(names).toContain('cubic');
      expect(names).toContain('seahorse');
    });

    test('should match PRESETS keys', () => {
      const names = getPresetNames();
      const keys = Object.keys(PRESETS);
      
      expect(names).toEqual(keys);
    });
  });

  describe('getAllPresets', () => {
    test('should return array with id property', () => {
      const all = getAllPresets();
      
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBe(Object.keys(PRESETS).length);
      
      const classic = all.find(p => p.id === 'classic');
      expect(classic).toBeDefined();
      expect(classic.power).toBe(2);
    });
  });

  describe('isValidPreset', () => {
    test('should return true for valid preset', () => {
      expect(isValidPreset(PRESETS.classic)).toBe(true);
    });

    test('should return false for null', () => {
      expect(isValidPreset(null)).toBe(false);
    });

    test('should return false for non-object', () => {
      expect(isValidPreset('string')).toBe(false);
    });

    test('should return false if missing required fields', () => {
      expect(isValidPreset({ power: 2, centerX: 0 })).toBe(false);
    });

    test('should return false if juliaMode without juliaC', () => {
      expect(isValidPreset({
        power: 2,
        centerX: 0,
        centerY: 0,
        zoom: 1,
        juliaMode: true
      })).toBe(false);
    });

    test('should return true for julia preset with juliaC', () => {
      expect(isValidPreset({
        power: 2,
        centerX: 0,
        centerY: 0,
        zoom: 1,
        juliaMode: true,
        juliaC: [0.1, 0.2]
      })).toBe(true);
    });
  });

  describe('interpolatePresets', () => {
    const from = {
      centerX: 0,
      centerY: 0,
      zoom: 1,
      power: 2,
      burningShip: false,
      juliaMode: false,
      juliaC: [0, 0]
    };

    const to = {
      centerX: 2,
      centerY: 4,
      zoom: 100,
      power: 4,
      burningShip: true,
      juliaMode: true,
      juliaC: [1, 1]
    };

    test('t=0 should return from values', () => {
      const result = interpolatePresets(from, to, 0);
      
      expect(result.centerX).toBe(0);
      expect(result.centerY).toBe(0);
      expect(result.power).toBe(2);
    });

    test('t=1 should return to values', () => {
      const result = interpolatePresets(from, to, 1);
      
      expect(result.centerX).toBe(2);
      expect(result.centerY).toBe(4);
      expect(result.power).toBe(4);
    });

    test('t=0.5 should be between values', () => {
      const result = interpolatePresets(from, to, 0.5);
      
      expect(result.centerX).toBeCloseTo(1);
      expect(result.centerY).toBeCloseTo(2);
    });

    test('zoom should interpolate logarithmically', () => {
      const result = interpolatePresets(from, to, 0.5);
      
      // Log interpolation means sqrt(1 * 100) = 10
      expect(result.zoom).toBeCloseTo(10);
    });

    test('booleans should switch at t=0.5', () => {
      const before = interpolatePresets(from, to, 0.49);
      const after = interpolatePresets(from, to, 0.51);
      
      expect(before.burningShip).toBe(false);
      expect(after.burningShip).toBe(true);
    });

    test('juliaC should interpolate', () => {
      const result = interpolatePresets(from, to, 0.5);
      
      expect(result.juliaC[0]).toBeCloseTo(0.5);
      expect(result.juliaC[1]).toBeCloseTo(0.5);
    });
  });
});
