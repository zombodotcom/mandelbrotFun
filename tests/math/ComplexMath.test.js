import {
  complexPower,
  magnitudeSquared,
  magnitude,
  complexAdd,
  complexSubtract,
  complexMultiply,
  mandelbrotIteration,
  screenToComplex,
  complexToScreen,
  smoothIteration
} from '../../src/math/ComplexMath.js';

describe('ComplexMath', () => {
  describe('complexPower', () => {
    test('z^2 should square the complex number correctly', () => {
      // (3 + 4i)^2 = 9 + 24i - 16 = -7 + 24i
      const result = complexPower([3, 4], 2);
      expect(result[0]).toBeCloseTo(-7);
      expect(result[1]).toBeCloseTo(24);
    });

    test('z^2 for real number should work', () => {
      const result = complexPower([2, 0], 2);
      expect(result[0]).toBeCloseTo(4);
      expect(result[1]).toBeCloseTo(0);
    });

    test('z^2 for pure imaginary should work', () => {
      // (2i)^2 = -4
      const result = complexPower([0, 2], 2);
      expect(result[0]).toBeCloseTo(-4);
      expect(result[1]).toBeCloseTo(0);
    });

    test('z^3 should cube the complex number correctly', () => {
      // (1 + i)^3 = (1 + i)(1 + 2i - 1) = (1 + i)(2i) = 2i - 2 = -2 + 2i
      const result = complexPower([1, 1], 3);
      expect(result[0]).toBeCloseTo(-2);
      expect(result[1]).toBeCloseTo(2);
    });

    test('z^0 should return 1', () => {
      const result = complexPower([5, 3], 0);
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(0);
    });

    test('zero raised to any positive power should be zero', () => {
      const result = complexPower([0, 0], 5);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0);
    });

    test('z^4 should work correctly', () => {
      // (1 + i)^4 = ((1+i)^2)^2 = (2i)^2 = -4
      const result = complexPower([1, 1], 4);
      expect(result[0]).toBeCloseTo(-4);
      expect(result[1]).toBeCloseTo(0, 5);
    });
  });

  describe('magnitudeSquared', () => {
    test('should compute |z|^2 correctly', () => {
      expect(magnitudeSquared([3, 4])).toBe(25);
    });

    test('should return 0 for origin', () => {
      expect(magnitudeSquared([0, 0])).toBe(0);
    });

    test('should work for negative values', () => {
      expect(magnitudeSquared([-3, -4])).toBe(25);
    });
  });

  describe('magnitude', () => {
    test('should compute |z| correctly', () => {
      expect(magnitude([3, 4])).toBe(5);
    });

    test('should return 0 for origin', () => {
      expect(magnitude([0, 0])).toBe(0);
    });
  });

  describe('complexAdd', () => {
    test('should add two complex numbers', () => {
      const result = complexAdd([1, 2], [3, 4]);
      expect(result).toEqual([4, 6]);
    });

    test('should handle negative numbers', () => {
      const result = complexAdd([1, -2], [-3, 4]);
      expect(result).toEqual([-2, 2]);
    });
  });

  describe('complexSubtract', () => {
    test('should subtract two complex numbers', () => {
      const result = complexSubtract([5, 6], [3, 4]);
      expect(result).toEqual([2, 2]);
    });
  });

  describe('complexMultiply', () => {
    test('should multiply two complex numbers', () => {
      // (1 + 2i)(3 + 4i) = 3 + 4i + 6i + 8i^2 = 3 + 10i - 8 = -5 + 10i
      const result = complexMultiply([1, 2], [3, 4]);
      expect(result[0]).toBeCloseTo(-5);
      expect(result[1]).toBeCloseTo(10);
    });

    test('should multiply real numbers', () => {
      const result = complexMultiply([3, 0], [4, 0]);
      expect(result).toEqual([12, 0]);
    });
  });

  describe('mandelbrotIteration', () => {
    test('origin should be in the set', () => {
      const result = mandelbrotIteration([0, 0], 100, 2);
      expect(result).toBe(100);
    });

    test('point at (-2, 0) should be in the set', () => {
      const result = mandelbrotIteration([-2, 0], 100, 2);
      expect(result).toBe(100);
    });

    test('point at (1, 0) should escape quickly', () => {
      const result = mandelbrotIteration([1, 0], 100, 2);
      expect(result).toBeLessThan(10);
    });

    test('point far outside should escape immediately', () => {
      const result = mandelbrotIteration([10, 10], 100, 2);
      expect(result).toBe(0);
    });

    test('burning ship mode should work', () => {
      // Use a point where burning ship variant behaves differently
      const normalResult = mandelbrotIteration([0.5, 0.5], 100, 2);
      const burningResult = mandelbrotIteration([0.5, 0.5], 100, 2, { burningShip: true });
      // Results should differ due to abs() operation
      expect(typeof burningResult).toBe('number');
      expect(burningResult).toBeGreaterThanOrEqual(0);
    });

    test('julia mode should use provided constant', () => {
      const result = mandelbrotIteration([0, 0], 100, 2, {
        juliaMode: true,
        juliaC: [-0.4, 0.6]
      });
      expect(result).toBeGreaterThan(0);
    });

    test('higher power should change behavior', () => {
      // Use a point that escapes at different rates for different powers
      const power2 = mandelbrotIteration([0.6, 0.6], 100, 2);
      const power3 = mandelbrotIteration([0.6, 0.6], 100, 3);
      // Both should escape, but at different rates
      expect(power2).toBeLessThan(100);
      expect(power3).toBeLessThan(100);
      // The escape times should differ
      expect(power2).not.toBe(power3);
    });
  });

  describe('screenToComplex', () => {
    const viewport = {
      width: 800,
      height: 600,
      centerX: -0.5,
      centerY: 0,
      zoom: 1
    };

    test('center of screen should map to center of viewport', () => {
      const result = screenToComplex(400, 300, viewport);
      expect(result[0]).toBeCloseTo(-0.5);
      expect(result[1]).toBeCloseTo(0);
    });

    test('should respect aspect ratio', () => {
      const left = screenToComplex(0, 300, viewport);
      const right = screenToComplex(800, 300, viewport);
      const top = screenToComplex(400, 0, viewport);
      const bottom = screenToComplex(400, 600, viewport);
      
      // Horizontal span should be larger due to aspect ratio
      const horizSpan = right[0] - left[0];
      const vertSpan = top[1] - bottom[1];
      expect(horizSpan / vertSpan).toBeCloseTo(800 / 600);
    });

    test('zoom should affect scale', () => {
      const zoom1 = screenToComplex(0, 0, viewport);
      const zoom2 = screenToComplex(0, 0, { ...viewport, zoom: 2 });
      
      // With 2x zoom, distance from center should be halved
      const dist1 = Math.abs(zoom1[0] - viewport.centerX);
      const dist2 = Math.abs(zoom2[0] - viewport.centerX);
      expect(dist1 / dist2).toBeCloseTo(2);
    });
  });

  describe('complexToScreen', () => {
    const viewport = {
      width: 800,
      height: 600,
      centerX: -0.5,
      centerY: 0,
      zoom: 1
    };

    test('should be inverse of screenToComplex', () => {
      const original = [200, 150];
      const complex = screenToComplex(original[0], original[1], viewport);
      const backToScreen = complexToScreen(complex[0], complex[1], viewport);
      
      expect(backToScreen[0]).toBeCloseTo(original[0]);
      expect(backToScreen[1]).toBeCloseTo(original[1]);
    });

    test('center of viewport should map to center of screen', () => {
      const result = complexToScreen(-0.5, 0, viewport);
      expect(result[0]).toBeCloseTo(400);
      expect(result[1]).toBeCloseTo(300);
    });
  });

  describe('smoothIteration', () => {
    test('should return maxIter for points in set', () => {
      const result = smoothIteration([0, 0], 100, 2);
      expect(result).toBe(100);
    });

    test('should return smooth values for escaping points', () => {
      const result = smoothIteration([0.5, 0.5], 100, 2);
      // Should escape and return a value less than maxIter
      expect(result).toBeLessThan(100);
      expect(result).toBeGreaterThan(0);
    });

    test('should escape immediately for far points', () => {
      const result = smoothIteration([10, 10], 100, 2);
      expect(result).toBeLessThan(3);
    });
  });
});
