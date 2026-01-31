/**
 * ShaderManager - Handles WebGL shader compilation and program management
 */

/**
 * Vertex shader source for fullscreen quad rendering
 */
export const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Fragment shader source for Mandelbrot rendering
 */
export const FRAGMENT_SHADER_SOURCE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform float u_power;
uniform float u_maxIter;
uniform float u_base;
uniform float u_colorScheme;
uniform float u_colorOffset;
uniform float u_burningShip;
uniform float u_juliaMode;
uniform vec2 u_juliaC;

vec3 hsl2rgb(float h, float s, float l) {
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c / 2.0;
    
    vec3 rgb;
    if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    
    return rgb + m;
}

vec2 complexPower(vec2 z, float n) {
    if (abs(n - 2.0) < 0.01) {
        return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
    }
    
    float r = length(z);
    float theta = atan(z.y, z.x);
    float newR = pow(r, n);
    float newTheta = n * theta;
    return vec2(newR * cos(newTheta), newR * sin(newTheta));
}

vec3 getColor(float iterations, float maxIterations, float base, float scheme, float offset) {
    if (iterations >= maxIterations - 0.5) {
        return vec3(0.0, 0.0, 0.0);
    }
    
    float baseValue = mod(iterations + offset, base);
    float baseFraction = baseValue / base;
    float t = iterations / maxIterations;
    
    vec3 color;
    
    if (scheme < 0.5) { // Rainbow
        float hue = mod(baseFraction + t + offset/100.0, 1.0);
        color = hsl2rgb(hue, 1.0, 0.5);
    } else if (scheme < 1.5) { // Fire
        color = vec3(t, 0.8 * baseFraction, 0.2 * (1.0 - t));
    } else if (scheme < 2.5) { // Ice
        color = vec3(0.2 * baseFraction, 0.6 * t, 0.5 + 0.5 * baseFraction);
    } else if (scheme < 3.5) { // Matrix
        color = vec3(0.0, 0.3 + 0.7 * baseFraction, 0.4 * t);
    } else if (scheme < 4.5) { // Purple
        color = vec3(0.8 * baseFraction, 0.2 * t, 0.5 + 0.5 * baseFraction);
    } else if (scheme < 5.5) { // Electric Blue
        color = vec3(0.1 * baseFraction, 0.5 * t, 0.8 + 0.2 * baseFraction);
    } else if (scheme < 6.5) { // Lava
        color = vec3(0.9 * t, 0.3 * baseFraction, 0.1);
    } else { // Neon
        float hue = mod(baseFraction * 3.0 + offset/50.0, 1.0);
        color = hsl2rgb(hue, 1.0, 0.5 + 0.3 * sin(t * 10.0));
    }
    
    return color;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv = (uv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    vec2 c = u_center + uv * 2.0 / u_zoom;
    
    vec2 z;
    if (u_juliaMode > 0.5) {
        z = c;
        c = u_juliaC;
    } else {
        z = vec2(0.0, 0.0);
    }
    
    float iterations = 0.0;
    float smoothVal = 0.0;
    
    for (int i = 0; i < 1000; i++) {
        if (float(i) >= u_maxIter) break;
        
        if (u_burningShip > 0.5) {
            z = abs(z);
        }
        
        z = complexPower(z, u_power) + c;
        
        float magSq = dot(z, z);
        if (magSq > 256.0) {
            // Smooth iteration count using continuous potential
            float log_zn = log(magSq) / 2.0;
            float nu = log(log_zn / log(2.0)) / log(u_power);
            smoothVal = float(i) + 1.0 - nu;
            iterations = smoothVal;
            break;
        }
        
        iterations = float(i);
    }
    
    vec3 color = getColor(iterations, u_maxIter, u_base, u_colorScheme, u_colorOffset);
    gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * Uniform names used in the fractal shader
 */
export const UNIFORM_NAMES = [
  'u_resolution',
  'u_center',
  'u_zoom',
  'u_power',
  'u_maxIter',
  'u_base',
  'u_colorScheme',
  'u_colorOffset',
  'u_burningShip',
  'u_juliaMode',
  'u_juliaC'
];

/**
 * ShaderManager class
 * Handles shader compilation, program linking, and uniform management
 */
export class ShaderManager {
  /**
   * Creates a new ShaderManager
   * @param {WebGLRenderingContext} gl - WebGL context
   */
  constructor(gl) {
    if (!gl) {
      throw new Error('WebGL context is required');
    }
    this._gl = gl;
    this._programs = new Map();
    this._shaders = new Map();
  }

  /**
   * Compiles a shader from source
   * @param {string} source - Shader source code
   * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
   * @returns {WebGLShader} Compiled shader
   * @throws {Error} If compilation fails
   */
  compileShader(source, type) {
    const gl = this._gl;
    const shader = gl.createShader(type);
    
    if (!shader) {
      throw new Error('Failed to create shader');
    }
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation error: ${info}`);
    }
    
    return shader;
  }

  /**
   * Creates a shader program from vertex and fragment shaders
   * @param {string} vertexSource - Vertex shader source
   * @param {string} fragmentSource - Fragment shader source
   * @param {string} name - Optional program name for caching
   * @returns {WebGLProgram} Linked program
   * @throws {Error} If linking fails
   */
  createProgram(vertexSource, fragmentSource, name = null) {
    const gl = this._gl;
    
    // Check cache
    if (name && this._programs.has(name)) {
      return this._programs.get(name);
    }
    
    const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
    
    const program = gl.createProgram();
    
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error('Failed to create program');
    }
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error(`Program link error: ${info}`);
    }
    
    // Store shaders for cleanup
    this._shaders.set(program, { vertex: vertexShader, fragment: fragmentShader });
    
    // Cache if named
    if (name) {
      this._programs.set(name, program);
    }
    
    return program;
  }

  /**
   * Gets uniform locations for a program
   * @param {WebGLProgram} program - The shader program
   * @param {string[]} names - Array of uniform names
   * @returns {Object} Map of uniform names to locations
   */
  getUniformLocations(program, names) {
    const gl = this._gl;
    const locations = {};
    
    for (const name of names) {
      locations[name] = gl.getUniformLocation(program, name);
    }
    
    return locations;
  }

  /**
   * Gets an attribute location
   * @param {WebGLProgram} program - The shader program
   * @param {string} name - Attribute name
   * @returns {number} Attribute location
   */
  getAttribLocation(program, name) {
    return this._gl.getAttribLocation(program, name);
  }

  /**
   * Creates the default Mandelbrot shader program
   * @returns {WebGLProgram} Mandelbrot shader program
   */
  createMandelbrotProgram() {
    return this.createProgram(
      VERTEX_SHADER_SOURCE,
      FRAGMENT_SHADER_SOURCE,
      'mandelbrot'
    );
  }

  /**
   * Gets uniform locations for the Mandelbrot program
   * @param {WebGLProgram} program - The Mandelbrot program
   * @returns {Object} Map of uniform names to locations
   */
  getMandelbrotUniforms(program) {
    return this.getUniformLocations(program, UNIFORM_NAMES);
  }

  /**
   * Deletes a shader program and its associated shaders
   * @param {WebGLProgram} program - Program to delete
   */
  deleteProgram(program) {
    const gl = this._gl;
    const shaders = this._shaders.get(program);
    
    if (shaders) {
      gl.deleteShader(shaders.vertex);
      gl.deleteShader(shaders.fragment);
      this._shaders.delete(program);
    }
    
    gl.deleteProgram(program);
    
    // Remove from cache
    for (const [name, cached] of this._programs.entries()) {
      if (cached === program) {
        this._programs.delete(name);
        break;
      }
    }
  }

  /**
   * Cleans up all shader resources
   */
  dispose() {
    for (const program of this._programs.values()) {
      this.deleteProgram(program);
    }
    this._programs.clear();
    this._shaders.clear();
  }

  /**
   * Gets a cached program by name
   * @param {string} name - Program name
   * @returns {WebGLProgram|null} Cached program or null
   */
  getProgram(name) {
    return this._programs.get(name) || null;
  }

  /**
   * Checks if a program is cached
   * @param {string} name - Program name
   * @returns {boolean}
   */
  hasProgram(name) {
    return this._programs.has(name);
  }
}
