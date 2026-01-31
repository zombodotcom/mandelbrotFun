import { WebGLRenderer } from '../../src/core/WebGLRenderer.js';
import { createMockCanvas, createTestState } from '../setup.js';

describe('WebGLRenderer', () => {
  let canvas;
  let renderer;

  beforeEach(() => {
    canvas = createMockCanvas(800, 600);
    renderer = new WebGLRenderer(canvas);
  });

  afterEach(() => {
    if (renderer && renderer.isInitialized()) {
      renderer.dispose();
    }
  });

  describe('constructor', () => {
    test('should throw if no canvas provided', () => {
      expect(() => new WebGLRenderer(null)).toThrow('Canvas element is required');
    });

    test('should create renderer with valid canvas', () => {
      expect(renderer).toBeInstanceOf(WebGLRenderer);
    });

    test('should request WebGL context', () => {
      expect(canvas.getContext).toHaveBeenCalledWith('webgl', expect.any(Object));
    });

    test('should throw if WebGL not supported', () => {
      const badCanvas = createMockCanvas();
      badCanvas.getContext = jest.fn(() => null);
      
      expect(() => new WebGLRenderer(badCanvas)).toThrow('WebGL not supported');
    });

    test('should not be initialized after construction', () => {
      expect(renderer.isInitialized()).toBe(false);
    });
  });

  describe('getContext', () => {
    test('should return WebGL context', () => {
      const gl = renderer.getContext();
      expect(gl).toBeDefined();
      expect(gl.createShader).toBeDefined();
    });
  });

  describe('getShaderManager', () => {
    test('should return shader manager', () => {
      const sm = renderer.getShaderManager();
      expect(sm).toBeDefined();
      expect(sm.compileShader).toBeDefined();
    });
  });

  describe('initialize', () => {
    test('should create program and buffers', () => {
      renderer.initialize();
      
      const gl = renderer.getContext();
      expect(gl.createProgram).toHaveBeenCalled();
      expect(gl.createBuffer).toHaveBeenCalled();
      expect(gl.enableVertexAttribArray).toHaveBeenCalled();
    });

    test('should set initialized flag', () => {
      renderer.initialize();
      expect(renderer.isInitialized()).toBe(true);
    });

    test('should be idempotent', () => {
      renderer.initialize();
      renderer.initialize();
      
      const gl = renderer.getContext();
      // createProgram should only be called once
      expect(gl.createProgram).toHaveBeenCalledTimes(1);
    });

    test('should return this for chaining', () => {
      const result = renderer.initialize();
      expect(result).toBe(renderer);
    });
  });

  describe('updateUniforms', () => {
    test('should initialize if not already', () => {
      const state = createTestState();
      renderer.updateUniforms(state);
      
      expect(renderer.isInitialized()).toBe(true);
    });

    test('should update all uniforms', () => {
      renderer.initialize();
      const gl = renderer.getContext();
      const state = createTestState({
        width: 800,
        height: 600,
        centerX: -0.5,
        centerY: 0,
        zoom: 2,
        power: 3,
        maxIter: 500
      });
      
      renderer.updateUniforms(state);
      
      expect(gl.uniform2f).toHaveBeenCalled();
      expect(gl.uniform1f).toHaveBeenCalled();
    });

    test('should handle boolean uniforms', () => {
      renderer.initialize();
      const gl = renderer.getContext();
      const state = createTestState({
        burningShip: true,
        juliaMode: true
      });
      
      renderer.updateUniforms(state);
      
      // Should pass 1.0 for true booleans
      expect(gl.uniform1f).toHaveBeenCalledWith(
        expect.anything(),
        1.0
      );
    });
  });

  describe('render', () => {
    test('should initialize if not already', () => {
      const state = createTestState();
      renderer.render(state);
      
      expect(renderer.isInitialized()).toBe(true);
    });

    test('should draw arrays', () => {
      const gl = renderer.getContext();
      const state = createTestState();
      
      renderer.render(state);
      
      expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);
    });

    test('should update viewport on size change', () => {
      const gl = renderer.getContext();
      const state = createTestState({ width: 1024, height: 768 });
      
      renderer.render(state);
      
      expect(gl.viewport).toHaveBeenCalledWith(0, 0, 1024, 768);
    });
  });

  describe('getFPS', () => {
    test('should return 0 initially', () => {
      expect(renderer.getFPS()).toBe(0);
    });

    test('should return number', () => {
      const state = createTestState();
      renderer.render(state);
      
      expect(typeof renderer.getFPS()).toBe('number');
    });
  });

  describe('render loop', () => {
    test('startRenderLoop should set running flag', () => {
      const mockState = {
        getState: jest.fn(() => createTestState())
      };
      
      renderer.startRenderLoop(mockState);
      
      expect(renderer.isRunning()).toBe(true);
      renderer.stopRenderLoop();
    });

    test('stopRenderLoop should clear running flag', () => {
      const mockState = {
        getState: jest.fn(() => createTestState())
      };
      
      renderer.startRenderLoop(mockState);
      renderer.stopRenderLoop();
      
      expect(renderer.isRunning()).toBe(false);
    });

    test('should not start twice', () => {
      const mockState = {
        getState: jest.fn(() => createTestState())
      };
      
      renderer.startRenderLoop(mockState);
      const firstId = renderer._animationFrameId;
      
      renderer.startRenderLoop(mockState);
      
      expect(renderer._animationFrameId).toBe(firstId);
      renderer.stopRenderLoop();
    });

    test('should call onFrame callback', () => {
      jest.useFakeTimers();
      
      const mockState = {
        getState: jest.fn(() => createTestState())
      };
      const onFrame = jest.fn();
      
      renderer.startRenderLoop(mockState, onFrame);
      
      // Trigger the animation frame
      jest.runOnlyPendingTimers();
      
      expect(onFrame).toHaveBeenCalled();
      
      renderer.stopRenderLoop();
      jest.useRealTimers();
    });
  });

  describe('resize', () => {
    test('should update canvas dimensions', () => {
      renderer.initialize();
      renderer.resize(1920, 1080);
      
      expect(canvas.width).toBe(1920);
      expect(canvas.height).toBe(1080);
    });

    test('should update viewport', () => {
      renderer.initialize();
      const gl = renderer.getContext();
      
      renderer.resize(1920, 1080);
      
      expect(gl.viewport).toHaveBeenCalledWith(0, 0, 1920, 1080);
    });
  });

  describe('getCanvas', () => {
    test('should return the canvas element', () => {
      expect(renderer.getCanvas()).toBe(canvas);
    });
  });

  describe('getDimensions', () => {
    test('should return canvas dimensions', () => {
      const dims = renderer.getDimensions();
      
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(600);
    });
  });

  describe('captureImage', () => {
    test('should call canvas toDataURL', () => {
      canvas.toDataURL = jest.fn(() => 'data:image/png;base64,...');
      
      const result = renderer.captureImage();
      
      expect(canvas.toDataURL).toHaveBeenCalledWith('image/png', 0.92);
      expect(result).toContain('data:image');
    });

    test('should support JPEG type', () => {
      canvas.toDataURL = jest.fn(() => 'data:image/jpeg;base64,...');
      
      renderer.captureImage('image/jpeg', 0.8);
      
      expect(canvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
    });
  });

  describe('dispose', () => {
    test('should stop render loop', () => {
      const mockState = {
        getState: jest.fn(() => createTestState())
      };
      
      renderer.startRenderLoop(mockState);
      renderer.dispose();
      
      expect(renderer.isRunning()).toBe(false);
    });

    test('should delete buffer', () => {
      renderer.initialize();
      const gl = renderer.getContext();
      
      renderer.dispose();
      
      expect(gl.deleteBuffer).toHaveBeenCalled();
    });

    test('should clear initialized flag', () => {
      renderer.initialize();
      renderer.dispose();
      
      expect(renderer.isInitialized()).toBe(false);
    });
  });

  describe('getCapabilities', () => {
    test('should return capability object', () => {
      const gl = renderer.getContext();
      gl.getParameter = jest.fn((param) => {
        if (param === gl.MAX_TEXTURE_SIZE) return 16384;
        if (param === gl.VENDOR) return 'Test Vendor';
        return 'unknown';
      });
      
      const caps = renderer.getCapabilities();
      
      expect(caps).toHaveProperty('maxTextureSize');
      expect(caps).toHaveProperty('vendor');
      expect(caps).toHaveProperty('renderer');
      expect(caps).toHaveProperty('version');
    });
  });
});
