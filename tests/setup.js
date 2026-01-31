/**
 * Jest test setup file
 * Provides mocks and utilities for testing WebGL and DOM components
 */

/**
 * Creates a mock WebGL context for testing
 * @returns {Object} Mock WebGL context with stubbed methods
 */
export function createMockGLContext() {
  return {
    // Shader methods
    createShader: jest.fn(() => ({})),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn(() => true),
    getShaderInfoLog: jest.fn(() => ''),
    deleteShader: jest.fn(),
    
    // Program methods
    createProgram: jest.fn(() => ({})),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn(() => true),
    getProgramInfoLog: jest.fn(() => ''),
    useProgram: jest.fn(),
    deleteProgram: jest.fn(),
    
    // Uniform methods
    getUniformLocation: jest.fn((program, name) => ({ name })),
    uniform1f: jest.fn(),
    uniform2f: jest.fn(),
    uniform1i: jest.fn(),
    
    // Buffer methods
    createBuffer: jest.fn(() => ({})),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    deleteBuffer: jest.fn(),
    
    // Attribute methods
    getAttribLocation: jest.fn(() => 0),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    
    // Drawing
    drawArrays: jest.fn(),
    viewport: jest.fn(),
    clearColor: jest.fn(),
    clear: jest.fn(),
    
    // Queries
    getParameter: jest.fn(() => 'mock'),
    
    // Constants
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    TRIANGLE_STRIP: 5,
    COLOR_BUFFER_BIT: 16384,
    MAX_TEXTURE_SIZE: 35661,
    MAX_VERTEX_ATTRIBS: 34921,
    MAX_VARYING_VECTORS: 36348,
    MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
    VENDOR: 7936,
    RENDERER: 7937,
    VERSION: 7938,
    SHADING_LANGUAGE_VERSION: 35724
  };
}

/**
 * Creates a mock canvas element for testing
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} Mock canvas element
 */
export function createMockCanvas(width = 800, height = 600) {
  const mockGL = createMockGLContext();
  
  return {
    width,
    height,
    getContext: jest.fn((type) => {
      if (type === 'webgl' || type === 'experimental-webgl') {
        return mockGL;
      }
      return null;
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
      left: 0,
      top: 0,
      width,
      height
    })),
    style: {}
  };
}

/**
 * Creates a default test state for fractal rendering
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test state object
 */
export function createTestState(overrides = {}) {
  return {
    centerX: -0.5,
    centerY: 0.0,
    zoom: 1.0,
    power: 2.0,
    maxIter: 256,
    numberBase: 10,
    colorScheme: 3,
    colorOffset: 0.0,
    burningShip: false,
    juliaMode: false,
    juliaC: [-0.4, 0.6],
    ...overrides
  };
}

/**
 * Creates a mock DOM element for testing
 * @param {string} tagName - Element tag name
 * @param {Object} props - Element properties
 * @returns {Object} Mock DOM element
 */
export function createMockElement(tagName = 'div', props = {}) {
  const element = {
    tagName: tagName.toUpperCase(),
    value: props.value || '',
    textContent: props.textContent || '',
    classList: {
      _classes: new Set(),
      add: jest.fn(function(cls) { this._classes.add(cls); }),
      remove: jest.fn(function(cls) { this._classes.delete(cls); }),
      contains: jest.fn(function(cls) { return this._classes.has(cls); }),
      toggle: jest.fn(function(cls) {
        if (this._classes.has(cls)) {
          this._classes.delete(cls);
        } else {
          this._classes.add(cls);
        }
      })
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    getAttribute: jest.fn(),
    setAttribute: jest.fn(),
    style: {},
    ...props
  };
  
  return element;
}

// Global mocks for performance API if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: jest.fn(() => Date.now())
  };
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});
