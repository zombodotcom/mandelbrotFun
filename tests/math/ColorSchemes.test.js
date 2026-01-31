import {
  hsl2rgb,
  rgb2hsl,
  lerp,
  lerpColor,
  getColor,
  rgbTo8bit,
  rgbFromBit,
  rgbToHex,
  hexToRgb,
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_NAMES,
  NUMBER_BASE_NAMES,
  AVAILABLE_BASES
} from '../../src/math/ColorSchemes.js';

describe('ColorSchemes', () => {
  describe('hsl2rgb', () => {
    test('red (h=0) should convert correctly', () => {
      const result = hsl2rgb(0, 1, 0.5);
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(0);
      expect(result[2]).toBeCloseTo(0);
    });

    test('green (h=1/3) should convert correctly', () => {
      const result = hsl2rgb(1/3, 1, 0.5);
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(1);
      expect(result[2]).toBeCloseTo(0);
    });

    test('blue (h=2/3) should convert correctly', () => {
      const result = hsl2rgb(2/3, 1, 0.5);
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(0);
      expect(result[2]).toBeCloseTo(1);
    });

    test('white (l=1) should convert correctly', () => {
      const result = hsl2rgb(0, 0, 1);
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(1);
      expect(result[2]).toBeCloseTo(1);
    });

    test('black (l=0) should convert correctly', () => {
      const result = hsl2rgb(0, 0, 0);
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(0);
      expect(result[2]).toBeCloseTo(0);
    });

    test('gray (s=0) should be grayscale', () => {
      const result = hsl2rgb(0.5, 0, 0.5);
      expect(result[0]).toBeCloseTo(result[1]);
      expect(result[1]).toBeCloseTo(result[2]);
    });

    test('should handle hue > 1 by wrapping', () => {
      const result1 = hsl2rgb(0.2, 1, 0.5);
      const result2 = hsl2rgb(1.2, 1, 0.5);
      expect(result1[0]).toBeCloseTo(result2[0]);
      expect(result1[1]).toBeCloseTo(result2[1]);
      expect(result1[2]).toBeCloseTo(result2[2]);
    });

    test('should handle negative hue by wrapping', () => {
      const result1 = hsl2rgb(0.8, 1, 0.5);
      const result2 = hsl2rgb(-0.2, 1, 0.5);
      expect(result1[0]).toBeCloseTo(result2[0]);
      expect(result1[1]).toBeCloseTo(result2[1]);
      expect(result1[2]).toBeCloseTo(result2[2]);
    });
  });

  describe('rgb2hsl', () => {
    test('should be inverse of hsl2rgb for pure red', () => {
      const rgb = [1, 0, 0];
      const hsl = rgb2hsl(...rgb);
      expect(hsl[0]).toBeCloseTo(0);
      expect(hsl[1]).toBeCloseTo(1);
      expect(hsl[2]).toBeCloseTo(0.5);
    });

    test('should handle grayscale', () => {
      const hsl = rgb2hsl(0.5, 0.5, 0.5);
      expect(hsl[1]).toBeCloseTo(0); // Saturation should be 0
      expect(hsl[2]).toBeCloseTo(0.5);
    });

    test('should handle black', () => {
      const hsl = rgb2hsl(0, 0, 0);
      expect(hsl[2]).toBeCloseTo(0);
    });

    test('should handle white', () => {
      const hsl = rgb2hsl(1, 1, 1);
      expect(hsl[2]).toBeCloseTo(1);
    });
  });

  describe('lerp', () => {
    test('t=0 should return first value', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    test('t=1 should return second value', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    test('t=0.5 should return midpoint', () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
    });

    test('should work with negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe('lerpColor', () => {
    test('should interpolate between colors', () => {
      const black = [0, 0, 0];
      const white = [1, 1, 1];
      const result = lerpColor(black, white, 0.5);
      
      expect(result[0]).toBeCloseTo(0.5);
      expect(result[1]).toBeCloseTo(0.5);
      expect(result[2]).toBeCloseTo(0.5);
    });

    test('t=0 should return first color', () => {
      const red = [1, 0, 0];
      const blue = [0, 0, 1];
      const result = lerpColor(red, blue, 0);
      
      expect(result).toEqual(red);
    });

    test('t=1 should return second color', () => {
      const red = [1, 0, 0];
      const blue = [0, 0, 1];
      const result = lerpColor(red, blue, 1);
      
      expect(result).toEqual(blue);
    });
  });

  describe('getColor', () => {
    test('should return black for maxIterations', () => {
      const result = getColor(100, 100, 10, COLOR_SCHEME_IDS.RAINBOW);
      expect(result).toEqual([0, 0, 0]);
    });

    test('should return non-black for escaping points', () => {
      const result = getColor(50, 100, 10, COLOR_SCHEME_IDS.RAINBOW);
      const isBlack = result[0] === 0 && result[1] === 0 && result[2] === 0;
      expect(isBlack).toBe(false);
    });

    test('different color schemes should produce different colors', () => {
      const rainbow = getColor(25, 100, 10, COLOR_SCHEME_IDS.RAINBOW);
      const fire = getColor(25, 100, 10, COLOR_SCHEME_IDS.FIRE);
      const matrix = getColor(25, 100, 10, COLOR_SCHEME_IDS.MATRIX);
      
      // They shouldn't all be the same
      const allSame = 
        rainbow[0] === fire[0] && fire[0] === matrix[0] &&
        rainbow[1] === fire[1] && fire[1] === matrix[1] &&
        rainbow[2] === fire[2] && fire[2] === matrix[2];
      
      expect(allSame).toBe(false);
    });

    test('different bases should affect color banding', () => {
      // Use an iteration count that produces different results with different bases
      const base2 = getColor(23, 100, 2, COLOR_SCHEME_IDS.RAINBOW);
      const base10 = getColor(23, 100, 10, COLOR_SCHEME_IDS.RAINBOW);
      
      // The baseFraction calculation differs for different bases
      // 23 % 2 = 1, 1/2 = 0.5
      // 23 % 10 = 3, 3/10 = 0.3
      expect(base2[0]).not.toBeCloseTo(base10[0], 1);
    });

    test('color values should be in range 0-1', () => {
      for (let scheme = 0; scheme <= 7; scheme++) {
        const result = getColor(50, 100, 10, scheme);
        expect(result[0]).toBeGreaterThanOrEqual(0);
        expect(result[0]).toBeLessThanOrEqual(1);
        expect(result[1]).toBeGreaterThanOrEqual(0);
        expect(result[1]).toBeLessThanOrEqual(1);
        expect(result[2]).toBeGreaterThanOrEqual(0);
        expect(result[2]).toBeLessThanOrEqual(1);
      }
    });

    test('matrix scheme should have dominant green', () => {
      const result = getColor(50, 100, 10, COLOR_SCHEME_IDS.MATRIX);
      expect(result[1]).toBeGreaterThan(result[0]); // Green > Red
      expect(result[1]).toBeGreaterThan(result[2]); // Green > Blue
    });
  });

  describe('rgbTo8bit and rgbFromBit', () => {
    test('should convert to 0-255 range', () => {
      expect(rgbTo8bit([1, 0.5, 0])).toEqual([255, 128, 0]);
    });

    test('should convert back from 0-255 range', () => {
      const result = rgbFromBit([255, 128, 0]);
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(0.5, 1);
      expect(result[2]).toBeCloseTo(0);
    });

    test('roundtrip should preserve values approximately', () => {
      const original = [0.75, 0.25, 0.5];
      const bit8 = rgbTo8bit(original);
      const back = rgbFromBit(bit8);
      
      expect(back[0]).toBeCloseTo(original[0], 2);
      expect(back[1]).toBeCloseTo(original[1], 2);
      expect(back[2]).toBeCloseTo(original[2], 2);
    });
  });

  describe('rgbToHex and hexToRgb', () => {
    test('should convert red to #ff0000', () => {
      expect(rgbToHex([1, 0, 0])).toBe('#ff0000');
    });

    test('should convert green to #00ff00', () => {
      expect(rgbToHex([0, 1, 0])).toBe('#00ff00');
    });

    test('should convert blue to #0000ff', () => {
      expect(rgbToHex([0, 0, 1])).toBe('#0000ff');
    });

    test('should parse hex with #', () => {
      const result = hexToRgb('#ff0000');
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(0);
      expect(result[2]).toBeCloseTo(0);
    });

    test('should parse hex without #', () => {
      const result = hexToRgb('00ff00');
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(1);
      expect(result[2]).toBeCloseTo(0);
    });

    test('roundtrip should work', () => {
      const original = [0.5, 0.25, 0.75];
      const hex = rgbToHex(original);
      const back = hexToRgb(hex);
      
      // Allow for rounding differences
      expect(back[0]).toBeCloseTo(original[0], 1);
      expect(back[1]).toBeCloseTo(original[1], 1);
      expect(back[2]).toBeCloseTo(original[2], 1);
    });
  });

  describe('constants', () => {
    test('COLOR_SCHEME_IDS should have expected values', () => {
      expect(COLOR_SCHEME_IDS.RAINBOW).toBe(0);
      expect(COLOR_SCHEME_IDS.MATRIX).toBe(3);
      expect(COLOR_SCHEME_IDS.NEON).toBe(7);
    });

    test('COLOR_SCHEME_NAMES should have entries for all IDs', () => {
      for (const id of Object.values(COLOR_SCHEME_IDS)) {
        expect(COLOR_SCHEME_NAMES[id]).toBeDefined();
        expect(typeof COLOR_SCHEME_NAMES[id]).toBe('string');
      }
    });

    test('NUMBER_BASE_NAMES should cover AVAILABLE_BASES', () => {
      for (const base of AVAILABLE_BASES) {
        expect(NUMBER_BASE_NAMES[base]).toBeDefined();
      }
    });

    test('AVAILABLE_BASES should include common bases', () => {
      expect(AVAILABLE_BASES).toContain(2);  // Binary
      expect(AVAILABLE_BASES).toContain(10); // Decimal
      expect(AVAILABLE_BASES).toContain(16); // Hex
    });
  });
});
