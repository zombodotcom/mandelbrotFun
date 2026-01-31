/**
 * WebGLRenderer - GPU-accelerated fractal rendering engine
 */

import { ShaderManager } from './ShaderManager.js';

/**
 * WebGLRenderer class
 * Encapsulates all WebGL rendering operations for the Mandelbrot explorer
 */
export class WebGLRenderer {
  /**
   * Creates a new WebGLRenderer
   * @param {HTMLCanvasElement} canvas - The canvas to render to
   * @param {Object} options - Renderer options
   * @param {boolean} options.antialias - Enable antialiasing
   * @param {boolean} options.preserveDrawingBuffer - Preserve buffer for screenshots
   */
  constructor(canvas, options = {}) {
    if (!canvas) {
      throw new Error('Canvas element is required');
    }
    
    this._canvas = canvas;
    this._options = {
      antialias: false,
      preserveDrawingBuffer: true,
      ...options
    };
    
    // Initialize WebGL
    this._gl = this._initWebGL();
    if (!this._gl) {
      throw new Error('WebGL not supported');
    }
    
    // Initialize shader manager
    this._shaderManager = new ShaderManager(this._gl);
    
    // Setup rendering
    this._program = null;
    this._uniforms = null;
    this._vertexBuffer = null;
    this._positionLocation = -1;
    
    // FPS tracking
    this._lastFrameTime = performance.now();
    this._frameCount = 0;
    this._fps = 0;
    this._fpsUpdateInterval = 1000;
    this._lastFpsUpdate = performance.now();
    
    // Rendering state
    this._isInitialized = false;
    this._needsRender = true;
    this._animationFrameId = null;
  }

  /**
   * Initializes WebGL context
   * @private
   */
  _initWebGL() {
    const contextOptions = {
      antialias: this._options.antialias,
      preserveDrawingBuffer: this._options.preserveDrawingBuffer
    };
    
    return this._canvas.getContext('webgl', contextOptions) ||
           this._canvas.getContext('experimental-webgl', contextOptions);
  }

  /**
   * Gets the WebGL context
   * @returns {WebGLRenderingContext}
   */
  getContext() {
    return this._gl;
  }

  /**
   * Gets the shader manager
   * @returns {ShaderManager}
   */
  getShaderManager() {
    return this._shaderManager;
  }

  /**
   * Initializes the renderer with shaders and buffers
   * @returns {WebGLRenderer} this for chaining
   */
  initialize() {
    if (this._isInitialized) {
      return this;
    }
    
    const gl = this._gl;
    
    // Create Mandelbrot program
    this._program = this._shaderManager.createMandelbrotProgram();
    gl.useProgram(this._program);
    
    // Get uniform locations
    this._uniforms = this._shaderManager.getMandelbrotUniforms(this._program);
    
    // Setup vertex buffer for fullscreen quad
    this._vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]), gl.STATIC_DRAW);
    
    // Setup vertex attribute
    this._positionLocation = this._shaderManager.getAttribLocation(this._program, 'position');
    gl.enableVertexAttribArray(this._positionLocation);
    gl.vertexAttribPointer(this._positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    this._isInitialized = true;
    return this;
  }

  /**
   * Updates shader uniforms from state
   * @param {Object} state - Fractal state object
   */
  updateUniforms(state) {
    if (!this._isInitialized) {
      this.initialize();
    }
    
    const gl = this._gl;
    const u = this._uniforms;
    
    // Split center coordinates into high and low parts for double-double precision
    // This allows deep zooms up to ~10^14 with full precision
    const splitDouble = (value) => {
      const hi = value;
      const lo = value - hi; // Capture the residual
      return [hi, lo];
    };
    
    const [centerXHi, centerXLo] = splitDouble(state.centerX);
    const [centerYHi, centerYLo] = splitDouble(state.centerY);
    
    // Enable double precision for deep zooms (zoom > 1e6)
    const useDoublePrecision = state.zoom > 1e6 ? 1.0 : 0.0;
    
    gl.uniform2f(u.u_resolution, state.width, state.height);
    gl.uniform2f(u.u_center, centerXHi, centerYHi);
    gl.uniform2f(u.u_centerLow, centerXLo, centerYLo);
    gl.uniform1f(u.u_zoom, state.zoom);
    gl.uniform1f(u.u_power, state.power);
    gl.uniform1f(u.u_maxIter, state.maxIter);
    gl.uniform1f(u.u_base, state.numberBase);
    gl.uniform1f(u.u_colorScheme, state.colorScheme);
    gl.uniform1f(u.u_colorOffset, state.colorOffset);
    gl.uniform1f(u.u_burningShip, state.burningShip ? 1.0 : 0.0);
    gl.uniform1f(u.u_juliaMode, state.juliaMode ? 1.0 : 0.0);
    gl.uniform2f(u.u_juliaC, state.juliaC[0], state.juliaC[1]);
    gl.uniform1f(u.u_coloringMode, state.coloringMode || 0);
    gl.uniform1f(u.u_useDoublePrecision, useDoublePrecision);
  }

  /**
   * Renders the fractal with current state
   * @param {Object} state - Fractal state object
   */
  render(state) {
    if (!this._isInitialized) {
      this.initialize();
    }
    
    const gl = this._gl;
    
    // Update canvas size if needed
    if (this._canvas.width !== state.width || this._canvas.height !== state.height) {
      this._canvas.width = state.width;
      this._canvas.height = state.height;
      gl.viewport(0, 0, state.width, state.height);
    }
    
    // Update uniforms
    this.updateUniforms(state);
    
    // Draw fullscreen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Update FPS
    this._updateFPS();
  }

  /**
   * Updates FPS counter
   * @private
   */
  _updateFPS() {
    this._frameCount++;
    const now = performance.now();
    
    if (now - this._lastFpsUpdate >= this._fpsUpdateInterval) {
      this._fps = Math.round(this._frameCount * 1000 / (now - this._lastFpsUpdate));
      this._frameCount = 0;
      this._lastFpsUpdate = now;
    }
  }

  /**
   * Gets the current FPS
   * @returns {number} Current frames per second
   */
  getFPS() {
    return this._fps;
  }

  /**
   * Starts the render loop
   * @param {FractalState} state - State object to render
   * @param {Function} onFrame - Optional callback before each frame
   */
  startRenderLoop(state, onFrame = null) {
    if (this._animationFrameId !== null) {
      return; // Already running
    }
    
    const renderFrame = () => {
      if (onFrame) {
        onFrame();
      }
      
      this.render(state.getState());
      this._animationFrameId = requestAnimationFrame(renderFrame);
    };
    
    this._animationFrameId = requestAnimationFrame(renderFrame);
  }

  /**
   * Stops the render loop
   */
  stopRenderLoop() {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /**
   * Checks if render loop is running
   * @returns {boolean}
   */
  isRunning() {
    return this._animationFrameId !== null;
  }

  /**
   * Resizes the renderer
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this._canvas.width = width;
    this._canvas.height = height;
    this._gl.viewport(0, 0, width, height);
  }

  /**
   * Gets the canvas element
   * @returns {HTMLCanvasElement}
   */
  getCanvas() {
    return this._canvas;
  }

  /**
   * Gets the canvas dimensions
   * @returns {{width: number, height: number}}
   */
  getDimensions() {
    return {
      width: this._canvas.width,
      height: this._canvas.height
    };
  }

  /**
   * Captures the current render as an image
   * @param {string} type - Image MIME type ('image/png' or 'image/jpeg')
   * @param {number} quality - Quality for JPEG (0-1)
   * @returns {string} Data URL of the image
   */
  captureImage(type = 'image/png', quality = 0.92) {
    return this._canvas.toDataURL(type, quality);
  }

  /**
   * Downloads the current render as an image
   * @param {string} filename - Filename for download
   * @param {string} type - Image MIME type
   */
  downloadImage(filename = 'mandelbrot.png', type = 'image/png') {
    const dataUrl = this.captureImage(type);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  /**
   * Cleans up WebGL resources
   */
  dispose() {
    this.stopRenderLoop();
    
    const gl = this._gl;
    
    if (this._vertexBuffer) {
      gl.deleteBuffer(this._vertexBuffer);
      this._vertexBuffer = null;
    }
    
    if (this._shaderManager) {
      this._shaderManager.dispose();
    }
    
    this._isInitialized = false;
  }

  /**
   * Checks if the renderer is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this._isInitialized;
  }

  /**
   * Gets WebGL capabilities
   * @returns {Object} Capability information
   */
  getCapabilities() {
    const gl = this._gl;
    
    return {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
    };
  }
}
