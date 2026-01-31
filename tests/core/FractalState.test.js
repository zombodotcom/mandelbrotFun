import { FractalState, DEFAULT_STATE } from '../../src/core/FractalState.js';

describe('FractalState', () => {
  describe('constructor', () => {
    test('should initialize with default state', () => {
      const state = new FractalState();
      const currentState = state.getState();
      
      expect(currentState.centerX).toBe(DEFAULT_STATE.centerX);
      expect(currentState.centerY).toBe(DEFAULT_STATE.centerY);
      expect(currentState.zoom).toBe(DEFAULT_STATE.zoom);
      expect(currentState.power).toBe(DEFAULT_STATE.power);
    });

    test('should merge initial state with defaults', () => {
      const state = new FractalState({ zoom: 5, power: 3 });
      const currentState = state.getState();
      
      expect(currentState.zoom).toBe(5);
      expect(currentState.power).toBe(3);
      expect(currentState.centerX).toBe(DEFAULT_STATE.centerX);
    });

    test('should deep clone initial state', () => {
      const initial = { juliaC: [0.1, 0.2] };
      const state = new FractalState(initial);
      
      initial.juliaC[0] = 999;
      expect(state.get('juliaC')[0]).toBe(0.1);
    });
  });

  describe('getState', () => {
    test('should return frozen object', () => {
      const state = new FractalState();
      const currentState = state.getState();
      
      expect(Object.isFrozen(currentState)).toBe(true);
    });

    test('should return a copy, not the original', () => {
      const state = new FractalState();
      const state1 = state.getState();
      const state2 = state.getState();
      
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('get', () => {
    test('should return specific property', () => {
      const state = new FractalState({ zoom: 10 });
      expect(state.get('zoom')).toBe(10);
    });

    test('should return copy of array properties', () => {
      const state = new FractalState({ juliaC: [0.1, 0.2] });
      const juliaC = state.get('juliaC');
      
      juliaC[0] = 999;
      expect(state.get('juliaC')[0]).toBe(0.1);
    });
  });

  describe('update', () => {
    test('should update state with new values', () => {
      const state = new FractalState();
      state.update({ zoom: 5 });
      
      expect(state.get('zoom')).toBe(5);
    });

    test('should return new state after update', () => {
      const state = new FractalState();
      const newState = state.update({ power: 4 });
      
      expect(newState.power).toBe(4);
    });

    test('should not mutate other properties', () => {
      const state = new FractalState({ zoom: 1, power: 2 });
      state.update({ zoom: 10 });
      
      expect(state.get('power')).toBe(2);
    });

    test('should validate power range', () => {
      const state = new FractalState();
      
      state.update({ power: 0 });
      expect(state.get('power')).toBe(1);
      
      state.update({ power: 100 });
      expect(state.get('power')).toBe(12);
    });

    test('should validate maxIter range', () => {
      const state = new FractalState();
      
      state.update({ maxIter: 1 });
      expect(state.get('maxIter')).toBe(10);
      
      state.update({ maxIter: 100000 });
      expect(state.get('maxIter')).toBe(10000);
    });

    test('should validate zoom range', () => {
      const state = new FractalState();
      
      state.update({ zoom: 0.001 });
      expect(state.get('zoom')).toBe(0.1);
    });

    test('should wrap colorOffset', () => {
      const state = new FractalState();
      
      state.update({ colorOffset: 150 });
      expect(state.get('colorOffset')).toBe(50);
      
      state.update({ colorOffset: -30 });
      expect(state.get('colorOffset')).toBe(70);
    });

    test('should not notify listeners when silent', () => {
      const state = new FractalState();
      const listener = jest.fn();
      state.subscribe(listener);
      
      state.update({ zoom: 5 }, { silent: true });
      expect(listener).not.toHaveBeenCalled();
    });

    test('should not update if no actual changes', () => {
      const state = new FractalState({ zoom: 5 });
      const listener = jest.fn();
      state.subscribe(listener);
      
      state.update({ zoom: 5 });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    test('should reset to default state', () => {
      const state = new FractalState({ zoom: 100, power: 5 });
      state.reset();
      
      expect(state.get('zoom')).toBe(DEFAULT_STATE.zoom);
      expect(state.get('power')).toBe(DEFAULT_STATE.power);
    });

    test('should notify listeners', () => {
      const state = new FractalState({ zoom: 100 });
      const listener = jest.fn();
      state.subscribe(listener);
      
      state.reset();
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    test('should call listener on state changes', () => {
      const state = new FractalState();
      const listener = jest.fn();
      state.subscribe(listener);
      
      state.update({ zoom: 5 });
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ zoom: 5 }),
        ['zoom']
      );
    });

    test('should support multiple listeners', () => {
      const state = new FractalState();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      state.subscribe(listener1);
      state.subscribe(listener2);
      state.update({ zoom: 5 });
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    test('should return unsubscribe function', () => {
      const state = new FractalState();
      const listener = jest.fn();
      const unsubscribe = state.subscribe(listener);
      
      unsubscribe();
      state.update({ zoom: 5 });
      
      expect(listener).not.toHaveBeenCalled();
    });

    test('should throw if listener is not a function', () => {
      const state = new FractalState();
      expect(() => state.subscribe('not a function')).toThrow();
    });

    test('should handle listener errors gracefully', () => {
      const state = new FractalState();
      const errorListener = jest.fn(() => { throw new Error('Test error'); });
      const goodListener = jest.fn();
      
      state.subscribe(errorListener);
      state.subscribe(goodListener);
      
      // Should not throw
      expect(() => state.update({ zoom: 5 })).not.toThrow();
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('history', () => {
    test('should support undo when addToHistory is true', () => {
      const state = new FractalState({ zoom: 1 });
      state.update({ zoom: 2 }, { addToHistory: true });
      state.update({ zoom: 3 }, { addToHistory: true });
      
      expect(state.get('zoom')).toBe(3);
      expect(state.canUndo()).toBe(true);
      
      state.undo();
      expect(state.get('zoom')).toBe(2);
    });

    test('canUndo should return false when no history', () => {
      const state = new FractalState();
      expect(state.canUndo()).toBe(false);
    });

    test('undo should return false when no history', () => {
      const state = new FractalState();
      expect(state.undo()).toBe(false);
    });
  });

  describe('getViewport', () => {
    test('should return viewport properties', () => {
      const state = new FractalState({
        width: 800,
        height: 600,
        centerX: -0.5,
        centerY: 0,
        zoom: 2
      });
      
      const viewport = state.getViewport();
      
      expect(viewport.width).toBe(800);
      expect(viewport.height).toBe(600);
      expect(viewport.centerX).toBe(-0.5);
      expect(viewport.centerY).toBe(0);
      expect(viewport.zoom).toBe(2);
    });
  });

  describe('zoomAt', () => {
    test('should zoom and move center toward click point', () => {
      const state = new FractalState({
        width: 800,
        height: 600,
        centerX: 0,
        centerY: 0,
        zoom: 1
      });
      
      const oldZoom = state.get('zoom');
      state.zoomAt(600, 300, 2); // Zoom in at right side of screen
      
      expect(state.get('zoom')).toBe(oldZoom * 2);
      expect(state.get('centerX')).toBeGreaterThan(0); // Center moved right
    });
  });

  describe('pan', () => {
    test('should pan by screen pixels', () => {
      const state = new FractalState({
        width: 800,
        height: 600,
        centerX: 0,
        centerY: 0,
        zoom: 1
      });
      
      state.pan(100, 0); // Pan right
      expect(state.get('centerX')).toBeLessThan(0); // Complex plane moved left
    });
  });

  describe('serialization', () => {
    test('toJSON should serialize state', () => {
      const state = new FractalState({ zoom: 5, power: 3 });
      const json = state.toJSON();
      
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.zoom).toBe(5);
      expect(parsed.power).toBe(3);
    });

    test('fromJSON should deserialize state', () => {
      const original = new FractalState({ zoom: 5, power: 3 });
      const json = original.toJSON();
      
      const restored = FractalState.fromJSON(json);
      expect(restored.get('zoom')).toBe(5);
      expect(restored.get('power')).toBe(3);
    });

    test('fromJSON should handle invalid JSON', () => {
      const state = FractalState.fromJSON('invalid json');
      expect(state.get('zoom')).toBe(DEFAULT_STATE.zoom);
    });
  });

  describe('URL params', () => {
    test('toURLParams should create compact representation', () => {
      const state = new FractalState({ zoom: 5 });
      const params = state.toURLParams();
      
      expect(typeof params).toBe('string');
      expect(params.length).toBeGreaterThan(0);
    });

    test('fromURLParams should restore state', () => {
      const original = new FractalState({ 
        zoom: 5, 
        power: 4,
        centerX: 0.25,
        centerY: 0.5
      });
      const params = original.toURLParams();
      
      const restored = new FractalState();
      restored.fromURLParams(params);
      
      expect(restored.get('zoom')).toBe(5);
      expect(restored.get('power')).toBe(4);
      expect(restored.get('centerX')).toBe(0.25);
      expect(restored.get('centerY')).toBe(0.5);
    });

    test('fromURLParams should handle invalid params', () => {
      const state = new FractalState();
      const result = state.fromURLParams('not valid base64!!');
      
      expect(result).toBe(false);
    });

    test('should include julia params when in julia mode', () => {
      const state = new FractalState({
        juliaMode: true,
        juliaC: [0.3, -0.5]
      });
      const params = state.toURLParams();
      
      const restored = new FractalState();
      restored.fromURLParams(params);
      
      expect(restored.get('juliaMode')).toBe(true);
      expect(restored.get('juliaC')).toEqual([0.3, -0.5]);
    });
  });

  describe('applyPreset', () => {
    test('should apply preset and add to history', () => {
      const state = new FractalState();
      const preset = { zoom: 100, power: 3 };
      
      state.applyPreset(preset);
      
      expect(state.get('zoom')).toBe(100);
      expect(state.get('power')).toBe(3);
      expect(state.canUndo()).toBe(true);
    });
  });
});
