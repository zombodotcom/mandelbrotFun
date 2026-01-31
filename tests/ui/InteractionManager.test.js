import { InteractionManager } from '../../src/ui/InteractionManager.js';
import { FractalState } from '../../src/core/FractalState.js';
import { createMockCanvas, createMockElement } from '../setup.js';

describe('InteractionManager', () => {
  let canvas;
  let state;
  let manager;

  beforeEach(() => {
    canvas = createMockCanvas(800, 600);
    canvas.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600
    }));
    canvas.style = {};
    
    state = new FractalState({ width: 800, height: 600 });
    manager = new InteractionManager(canvas, state);
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('constructor', () => {
    test('should throw if no canvas provided', () => {
      expect(() => new InteractionManager(null, state)).toThrow('Canvas element is required');
    });

    test('should throw if no state provided', () => {
      expect(() => new InteractionManager(canvas, null)).toThrow('FractalState is required');
    });

    test('should create with valid arguments', () => {
      expect(manager).toBeInstanceOf(InteractionManager);
    });

    test('should attach event listeners', () => {
      expect(canvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(canvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(canvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(canvas.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), expect.any(Object));
      expect(canvas.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should attach touch listeners when enabled', () => {
      expect(canvas.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));
      expect(canvas.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.any(Object));
      expect(canvas.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    });

    test('should not be dragging initially', () => {
      expect(manager.isDragging()).toBe(false);
    });
  });

  describe('options', () => {
    test('should have default options', () => {
      const options = manager.getOptions();
      
      expect(options.zoomFactor).toBe(2);
      expect(options.wheelZoomFactor).toBe(1.1);
      expect(options.enablePan).toBe(true);
      expect(options.enableZoom).toBe(true);
      expect(options.enableClick).toBe(true);
      expect(options.enableTouch).toBe(true);
    });

    test('should accept custom options', () => {
      const customManager = new InteractionManager(canvas, state, {
        zoomFactor: 3,
        enablePan: false
      });
      
      const options = customManager.getOptions();
      expect(options.zoomFactor).toBe(3);
      expect(options.enablePan).toBe(false);
      
      customManager.dispose();
    });

    test('setOptions should update options', () => {
      manager.setOptions({ zoomFactor: 4 });
      
      expect(manager.getOptions().zoomFactor).toBe(4);
    });
  });

  describe('mouse events', () => {
    test('mousedown should start dragging', () => {
      const mousedown = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )[1];
      
      mousedown({ clientX: 100, clientY: 100 });
      
      expect(manager.isDragging()).toBe(true);
    });

    test('mouseup should stop dragging', () => {
      const mousedown = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )[1];
      const mouseup = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mouseup'
      )[1];
      
      mousedown({ clientX: 100, clientY: 100 });
      mouseup({ clientX: 150, clientY: 100 });
      
      expect(manager.isDragging()).toBe(false);
    });

    test('mousemove while dragging should pan', () => {
      const mousedown = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )[1];
      const mousemove = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mousemove'
      )[1];
      
      const initialCenterX = state.get('centerX');
      
      mousedown({ clientX: 100, clientY: 100 });
      mousemove({ clientX: 150, clientY: 100 });
      
      // Center should have moved
      expect(state.get('centerX')).not.toBe(initialCenterX);
    });

    test('wheel should zoom', () => {
      const wheel = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'wheel'
      )[1];
      
      const initialZoom = state.get('zoom');
      
      wheel({
        deltaY: -100,
        clientX: 400,
        clientY: 300,
        preventDefault: jest.fn()
      });
      
      expect(state.get('zoom')).toBeGreaterThan(initialZoom);
    });

    test('wheel down should zoom out', () => {
      const wheel = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'wheel'
      )[1];
      
      const initialZoom = state.get('zoom');
      
      wheel({
        deltaY: 100,
        clientX: 400,
        clientY: 300,
        preventDefault: jest.fn()
      });
      
      expect(state.get('zoom')).toBeLessThan(initialZoom);
    });

    test('click should zoom in at point', () => {
      const click = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      )[1];
      
      // Need to also trigger mousedown/up for drag distance calculation
      const mousedown = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )[1];
      const mouseup = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mouseup'
      )[1];
      
      const initialZoom = state.get('zoom');
      
      // Simulate click (same position for mousedown and click)
      mousedown({ clientX: 400, clientY: 300 });
      mouseup({ clientX: 400, clientY: 300 });
      click({ 
        clientX: 400, 
        clientY: 300, 
        shiftKey: false 
      });
      
      expect(state.get('zoom')).toBeGreaterThan(initialZoom);
    });

    test('shift+click should zoom out', () => {
      const click = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      )[1];
      const mousedown = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )[1];
      const mouseup = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mouseup'
      )[1];
      
      const initialZoom = state.get('zoom');
      
      mousedown({ clientX: 400, clientY: 300 });
      mouseup({ clientX: 400, clientY: 300 });
      click({ 
        clientX: 400, 
        clientY: 300, 
        shiftKey: true 
      });
      
      expect(state.get('zoom')).toBeLessThan(initialZoom);
    });

    test('mouseleave should stop dragging', () => {
      const mousedown = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )[1];
      const mouseleave = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mouseleave'
      )[1];
      
      mousedown({ clientX: 100, clientY: 100 });
      expect(manager.isDragging()).toBe(true);
      
      mouseleave({});
      expect(manager.isDragging()).toBe(false);
    });
  });

  describe('disabled interactions', () => {
    test('should not pan when enablePan is false', () => {
      manager.setOptions({ enablePan: false });
      
      const mousedown = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'mousedown'
      )[1];
      
      mousedown({ clientX: 100, clientY: 100 });
      
      expect(manager.isDragging()).toBe(false);
    });

    test('should not zoom when enableZoom is false', () => {
      manager.setOptions({ enableZoom: false });
      
      const wheel = canvas.addEventListener.mock.calls.find(
        call => call[0] === 'wheel'
      )[1];
      
      const initialZoom = state.get('zoom');
      
      wheel({
        deltaY: -100,
        clientX: 400,
        clientY: 300,
        preventDefault: jest.fn()
      });
      
      expect(state.get('zoom')).toBe(initialZoom);
    });
  });

  describe('dispose', () => {
    test('should remove event listeners', () => {
      manager.dispose();
      
      expect(canvas.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(canvas.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(canvas.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(canvas.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
      expect(canvas.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
});
