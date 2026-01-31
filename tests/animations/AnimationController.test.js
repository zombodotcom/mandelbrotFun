import { AnimationController, ANIMATION_TYPES } from '../../src/animations/AnimationController.js';
import { FractalState } from '../../src/core/FractalState.js';

describe('AnimationController', () => {
  let state;
  let controller;

  beforeEach(() => {
    jest.useFakeTimers();
    state = new FractalState();
    controller = new AnimationController(state);
  });

  afterEach(() => {
    controller.dispose();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    test('should throw if no state provided', () => {
      expect(() => new AnimationController(null)).toThrow('FractalState is required');
    });

    test('should create with valid state', () => {
      expect(controller).toBeInstanceOf(AnimationController);
    });

    test('should have default speed of 5', () => {
      expect(controller.getSpeed()).toBe(5);
    });

    test('should have no running animations', () => {
      expect(controller.getRunningAnimations()).toEqual([]);
    });
  });

  describe('setSpeed', () => {
    test('should set speed', () => {
      controller.setSpeed(8);
      expect(controller.getSpeed()).toBe(8);
    });

    test('should clamp to minimum 1', () => {
      controller.setSpeed(0);
      expect(controller.getSpeed()).toBe(1);
    });

    test('should clamp to maximum 10', () => {
      controller.setSpeed(15);
      expect(controller.getSpeed()).toBe(10);
    });
  });

  describe('start', () => {
    test('should start zoom animation', () => {
      const result = controller.start(ANIMATION_TYPES.ZOOM);
      
      expect(result).toBe(true);
      expect(controller.isRunning(ANIMATION_TYPES.ZOOM)).toBe(true);
    });

    test('should return false if already running', () => {
      controller.start(ANIMATION_TYPES.ZOOM);
      const result = controller.start(ANIMATION_TYPES.ZOOM);
      
      expect(result).toBe(false);
    });

    test('should return false for unknown type', () => {
      const result = controller.start('unknown');
      expect(result).toBe(false);
    });

    test('should add to running animations', () => {
      controller.start(ANIMATION_TYPES.ZOOM);
      controller.start(ANIMATION_TYPES.COLOR_CYCLE);
      
      const running = controller.getRunningAnimations();
      expect(running).toContain(ANIMATION_TYPES.ZOOM);
      expect(running).toContain(ANIMATION_TYPES.COLOR_CYCLE);
    });
  });

  describe('stop', () => {
    test('should stop running animation', () => {
      controller.start(ANIMATION_TYPES.ZOOM);
      const result = controller.stop(ANIMATION_TYPES.ZOOM);
      
      expect(result).toBe(true);
      expect(controller.isRunning(ANIMATION_TYPES.ZOOM)).toBe(false);
    });

    test('should return false if not running', () => {
      const result = controller.stop(ANIMATION_TYPES.ZOOM);
      expect(result).toBe(false);
    });

    test('should clear interval', () => {
      controller.start(ANIMATION_TYPES.ZOOM);
      
      const clearSpy = jest.spyOn(global, 'clearInterval');
      controller.stop(ANIMATION_TYPES.ZOOM);
      
      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });
  });

  describe('stopAll', () => {
    test('should stop all animations', () => {
      controller.start(ANIMATION_TYPES.ZOOM);
      controller.start(ANIMATION_TYPES.COLOR_CYCLE);
      controller.start(ANIMATION_TYPES.POWER_MORPH);
      
      controller.stopAll();
      
      expect(controller.getRunningAnimations()).toEqual([]);
    });
  });

  describe('toggle', () => {
    test('should start if not running', () => {
      const result = controller.toggle(ANIMATION_TYPES.ZOOM);
      
      expect(result).toBe(true);
      expect(controller.isRunning(ANIMATION_TYPES.ZOOM)).toBe(true);
    });

    test('should stop if running', () => {
      controller.start(ANIMATION_TYPES.ZOOM);
      const result = controller.toggle(ANIMATION_TYPES.ZOOM);
      
      expect(result).toBe(false);
      expect(controller.isRunning(ANIMATION_TYPES.ZOOM)).toBe(false);
    });
  });

  describe('subscribe', () => {
    test('should notify on animation start', () => {
      const listener = jest.fn();
      controller.subscribe(listener);
      
      controller.start(ANIMATION_TYPES.ZOOM);
      
      expect(listener).toHaveBeenCalledWith([ANIMATION_TYPES.ZOOM]);
    });

    test('should notify on animation stop', () => {
      const listener = jest.fn();
      controller.start(ANIMATION_TYPES.ZOOM);
      
      controller.subscribe(listener);
      controller.stop(ANIMATION_TYPES.ZOOM);
      
      expect(listener).toHaveBeenCalledWith([]);
    });

    test('should return unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = controller.subscribe(listener);
      
      unsubscribe();
      controller.start(ANIMATION_TYPES.ZOOM);
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('zoom animation', () => {
    test('should modify zoom state', () => {
      const initialZoom = state.get('zoom');
      
      controller.start(ANIMATION_TYPES.ZOOM);
      jest.advanceTimersByTime(100);
      
      expect(state.get('zoom')).not.toBe(initialZoom);
    });

    test('should reverse direction at limits', () => {
      state.update({ zoom: 9999 });
      
      controller.start(ANIMATION_TYPES.ZOOM);
      jest.advanceTimersByTime(100);
      
      // Should start decreasing
      const zoom1 = state.get('zoom');
      jest.advanceTimersByTime(100);
      const zoom2 = state.get('zoom');
      
      expect(zoom2).toBeLessThan(zoom1);
    });
  });

  describe('color cycle animation', () => {
    test('should modify colorOffset', () => {
      controller.start(ANIMATION_TYPES.COLOR_CYCLE);
      jest.advanceTimersByTime(100);
      
      expect(state.get('colorOffset')).toBeGreaterThan(0);
    });

    test('should wrap at 100', () => {
      state.update({ colorOffset: 99 });
      
      controller.start(ANIMATION_TYPES.COLOR_CYCLE);
      jest.advanceTimersByTime(200);
      
      // Should wrap around
      expect(state.get('colorOffset')).toBeLessThan(100);
    });
  });

  describe('power morph animation', () => {
    test('should modify power', () => {
      controller.start(ANIMATION_TYPES.POWER_MORPH);
      jest.advanceTimersByTime(200);
      
      expect(state.get('power')).toBeGreaterThan(2);
    });

    test('should oscillate between 2 and 8', () => {
      state.update({ power: 7.9 });
      
      controller.start(ANIMATION_TYPES.POWER_MORPH);
      jest.advanceTimersByTime(500);
      
      // Should have hit limit and reversed
      expect(state.get('power')).toBeLessThan(8);
    });
  });

  describe('base cycle animation', () => {
    test('should cycle through number bases', () => {
      const initialBase = state.get('numberBase');
      
      controller.start(ANIMATION_TYPES.BASE_CYCLE);
      jest.advanceTimersByTime(1000);
      
      expect(state.get('numberBase')).not.toBe(initialBase);
    });
  });

  describe('tour animation', () => {
    test('should modify center and zoom', () => {
      const initialState = state.getState();
      
      controller.start(ANIMATION_TYPES.TOUR);
      jest.advanceTimersByTime(1000);
      
      // Position should have changed
      const currentState = state.getState();
      const changed = 
        currentState.centerX !== initialState.centerX ||
        currentState.centerY !== initialState.centerY ||
        currentState.zoom !== initialState.zoom;
      
      expect(changed).toBe(true);
    });
  });

  describe('julia morph animation', () => {
    test('should enable julia mode', () => {
      controller.start(ANIMATION_TYPES.JULIA_MORPH);
      
      expect(state.get('juliaMode')).toBe(true);
    });

    test('should modify juliaC', () => {
      controller.start(ANIMATION_TYPES.JULIA_MORPH);
      
      const initial = state.get('juliaC');
      jest.advanceTimersByTime(100);
      const after = state.get('juliaC');
      
      expect(after).not.toEqual(initial);
    });

    test('should orbit around origin', () => {
      controller.start(ANIMATION_TYPES.JULIA_MORPH);
      
      // Check multiple points form approximate circle
      const points = [];
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(100);
        points.push(state.get('juliaC'));
      }
      
      // All points should have similar magnitude (~0.7885)
      for (const [x, y] of points) {
        const mag = Math.sqrt(x * x + y * y);
        expect(mag).toBeCloseTo(0.7885, 1);
      }
    });
  });

  describe('dispose', () => {
    test('should stop all animations', () => {
      controller.start(ANIMATION_TYPES.ZOOM);
      controller.start(ANIMATION_TYPES.COLOR_CYCLE);
      
      controller.dispose();
      
      expect(controller.getRunningAnimations()).toEqual([]);
    });

    test('should clear listeners', () => {
      const listener = jest.fn();
      controller.subscribe(listener);
      
      controller.dispose();
      controller.start(ANIMATION_TYPES.ZOOM);
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('multiple animations', () => {
    test('should run multiple animations simultaneously', () => {
      controller.start(ANIMATION_TYPES.ZOOM);
      controller.start(ANIMATION_TYPES.COLOR_CYCLE);
      controller.start(ANIMATION_TYPES.POWER_MORPH);
      
      const initialState = state.getState();
      jest.advanceTimersByTime(200);
      const afterState = state.getState();
      
      // All should have changed
      expect(afterState.zoom).not.toBe(initialState.zoom);
      expect(afterState.colorOffset).not.toBe(initialState.colorOffset);
      expect(afterState.power).not.toBe(initialState.power);
    });
  });
});
