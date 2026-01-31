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
 * Supports: escape time, distance estimation, orbit traps, 15+ color schemes
 * Uses double-double precision emulation for deep zooms
 */
export const FRAGMENT_SHADER_SOURCE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_center;      // High part of center
uniform vec2 u_centerLow;   // Low part of center (for double-double precision)
uniform float u_zoom;
uniform float u_power;
uniform float u_maxIter;
uniform float u_base;
uniform float u_colorScheme;
uniform float u_colorOffset;
uniform float u_burningShip;
uniform float u_juliaMode;
uniform vec2 u_juliaC;
uniform float u_coloringMode;  // 0=escape time, 1=distance est, 2=orbit trap
uniform float u_useDoublePrecision; // 1.0 to enable double-double precision

// ============ DOUBLE-DOUBLE ARITHMETIC ============
// Represents a number as the sum of two floats: x = hi + lo
// This effectively doubles the precision from ~7 to ~15 decimal digits

// Quick two-sum: returns (hi, lo) such that a + b = hi + lo exactly
vec2 twoSum(float a, float b) {
    float s = a + b;
    float v = s - a;
    float e = (a - (s - v)) + (b - v);
    return vec2(s, e);
}

// Two-product with FMA emulation
vec2 twoProd(float a, float b) {
    float p = a * b;
    // Split a and b into high and low parts
    float splitA = a * 4097.0; // 2^12 + 1
    float aHi = splitA - (splitA - a);
    float aLo = a - aHi;
    float splitB = b * 4097.0;
    float bHi = splitB - (splitB - b);
    float bLo = b - bHi;
    float e = ((aHi * bHi - p) + aHi * bLo + aLo * bHi) + aLo * bLo;
    return vec2(p, e);
}

// Double-double addition: (aHi, aLo) + (bHi, bLo)
vec2 ddAdd(vec2 a, vec2 b) {
    vec2 s = twoSum(a.x, b.x);
    vec2 t = twoSum(a.y, b.y);
    s.y += t.x;
    s = twoSum(s.x, s.y);
    s.y += t.y;
    return twoSum(s.x, s.y);
}

// Double-double multiplication: (aHi, aLo) * (bHi, bLo)
vec2 ddMul(vec2 a, vec2 b) {
    vec2 p = twoProd(a.x, b.x);
    p.y += a.x * b.y + a.y * b.x;
    return twoSum(p.x, p.y);
}

// Double-double subtraction
vec2 ddSub(vec2 a, vec2 b) {
    return ddAdd(a, vec2(-b.x, -b.y));
}

// Double-double from single float
vec2 ddFromFloat(float a) {
    return vec2(a, 0.0);
}

// Complex multiplication with double-double precision
// z = (zxHi, zxLo) + i*(zyHi, zyLo)
void ddComplexMul(vec2 zx, vec2 zy, vec2 wx, vec2 wy, out vec2 rx, out vec2 ry) {
    // (zx + i*zy) * (wx + i*wy) = (zx*wx - zy*wy) + i*(zx*wy + zy*wx)
    vec2 zxwx = ddMul(zx, wx);
    vec2 zywy = ddMul(zy, wy);
    vec2 zxwy = ddMul(zx, wy);
    vec2 zywx = ddMul(zy, wx);
    rx = ddSub(zxwx, zywy);
    ry = ddAdd(zxwy, zywx);
}

// Complex squaring with double-double precision (optimized)
void ddComplexSquare(vec2 zx, vec2 zy, out vec2 rx, out vec2 ry) {
    // z^2 = (zx^2 - zy^2) + i*(2*zx*zy)
    vec2 zx2 = ddMul(zx, zx);
    vec2 zy2 = ddMul(zy, zy);
    vec2 zxzy = ddMul(zx, zy);
    rx = ddSub(zx2, zy2);
    ry = ddAdd(zxzy, zxzy);  // 2 * zx * zy
}

// ============ STANDARD COMPLEX ARITHMETIC ============

// Complex multiplication
vec2 complexMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

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

// Get color based on scheme (0-19)
vec3 getColor(float iterations, float maxIterations, float base, float scheme, float offset, float distance, float orbitTrap, float interiorValue) {
    // Interior coloring - when iterations hit max
    if (iterations >= maxIterations - 0.5) {
        // Use interior value (based on final orbit position) for coloring
        if (interiorValue > 0.01) {
            // Color interior based on final orbit characteristics
            float hue = mod(interiorValue * 3.0 + offset / 100.0, 1.0);
            return hsl2rgb(hue, 0.5, 0.15 + 0.1 * interiorValue);
        }
        return vec3(0.0, 0.0, 0.0);  // Default black interior
    }
    
    float baseValue = mod(iterations + offset, base);
    float baseFraction = baseValue / base;
    float t = iterations / maxIterations;
    
    // Distance-based modifier (for distance estimation mode)
    float distMod = 1.0 - clamp(distance * u_zoom * 0.5, 0.0, 1.0);
    
    // Orbit trap modifier
    float trapMod = clamp(orbitTrap * 2.0, 0.0, 1.0);
    
    vec3 color;
    int schemeInt = int(scheme);
    
    // Original schemes (0-7)
    if (schemeInt == 0) { // Rainbow
        float hue = mod(baseFraction + t + offset/100.0, 1.0);
        color = hsl2rgb(hue, 1.0, 0.5);
    } else if (schemeInt == 1) { // Fire
        color = vec3(min(1.0, t * 1.5), baseFraction * 0.7, 0.2 * (1.0 - t));
    } else if (schemeInt == 2) { // Ice
        color = vec3(0.2 * baseFraction, 0.5 + 0.3 * t, 0.7 + 0.3 * baseFraction);
    } else if (schemeInt == 3) { // Matrix Green
        color = vec3(0.0, 0.3 + 0.7 * baseFraction, 0.4 * t);
    } else if (schemeInt == 4) { // Purple Haze
        color = vec3(0.6 * baseFraction + 0.2 * t, 0.1 * t, 0.4 + 0.6 * baseFraction);
    } else if (schemeInt == 5) { // Electric Blue
        color = vec3(0.1 * baseFraction, 0.4 * t + 0.2, 0.8 + 0.2 * baseFraction);
    } else if (schemeInt == 6) { // Lava
        color = vec3(0.9 * t + 0.1, 0.3 * baseFraction, 0.05);
    } else if (schemeInt == 7) { // Neon
        float hue = mod(baseFraction * 3.0 + offset/50.0, 1.0);
        color = hsl2rgb(hue, 1.0, 0.5 + 0.3 * sin(t * 10.0));
    }
    // New schemes (8-19)
    else if (schemeInt == 8) { // Sunset
        color = mix(vec3(0.1, 0.0, 0.2), vec3(1.0, 0.5, 0.0), t);
        color = mix(color, vec3(1.0, 0.9, 0.3), baseFraction);
    } else if (schemeInt == 9) { // Ocean
        color = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.6, 0.8), t);
        color = mix(color, vec3(0.5, 0.9, 1.0), baseFraction * 0.5);
    } else if (schemeInt == 10) { // Plasma
        float hue = mod(t * 0.8 + baseFraction * 0.5 + offset/100.0, 1.0);
        color = hsl2rgb(hue * 0.8 + 0.7, 1.0, 0.4 + 0.2 * baseFraction);
    } else if (schemeInt == 11) { // Copper
        color = vec3(0.7 + 0.3 * t, 0.4 + 0.3 * baseFraction, 0.2 * t);
    } else if (schemeInt == 12) { // Gold
        color = vec3(0.8 + 0.2 * t, 0.6 + 0.3 * baseFraction, 0.1 + 0.2 * t);
    } else if (schemeInt == 13) { // Monochrome
        float v = t * 0.7 + baseFraction * 0.3;
        color = vec3(v, v, v);
    } else if (schemeInt == 14) { // Stripes
        float stripe = mod(iterations * 0.1 + offset * 0.1, 1.0);
        stripe = step(0.5, stripe);
        color = mix(vec3(0.1, 0.1, 0.3), vec3(0.9, 0.8, 0.4), stripe);
    } else if (schemeInt == 15) { // Psychedelic
        float hue1 = mod(t * 5.0 + offset/20.0, 1.0);
        float hue2 = mod(baseFraction * 7.0, 1.0);
        color = hsl2rgb(mod(hue1 + hue2, 1.0), 1.0, 0.5);
    } else if (schemeInt == 16) { // Forest
        color = mix(vec3(0.0, 0.2, 0.0), vec3(0.4, 0.8, 0.2), t);
        color = mix(color, vec3(0.6, 0.5, 0.2), baseFraction * 0.3);
    } else if (schemeInt == 17) { // Midnight
        color = mix(vec3(0.0, 0.0, 0.1), vec3(0.2, 0.1, 0.4), t);
        color += vec3(0.1, 0.1, 0.3) * baseFraction;
    } else if (schemeInt == 18) { // Distance Glow
        // Uses distance estimation for glow effect
        color = hsl2rgb(mod(t + offset/100.0, 1.0), 0.8, 0.3 + 0.4 * distMod);
    } else { // Orbit Trap (19)
        // Uses orbit trap value for coloring
        float hue = mod(trapMod + offset/100.0, 1.0);
        color = hsl2rgb(hue, 0.9, 0.3 + 0.5 * (1.0 - trapMod));
    }
    
    return color;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv = (uv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    float iterations = 0.0;
    float minDist = 1000.0;
    float minDistCross = 1000.0;
    vec2 z;
    vec2 dz = vec2(1.0, 0.0);
    
    // Use double-double precision for deep zooms (zoom > 1e6)
    if (u_useDoublePrecision > 0.5 && abs(u_power - 2.0) < 0.01 && u_juliaMode < 0.5 && u_burningShip < 0.5) {
        // Double-double precision path for z^2 + c
        // Calculate c with extended precision
        float uvScale = 2.0 / u_zoom;
        vec2 cxDD = ddAdd(vec2(u_center.x, u_centerLow.x), ddFromFloat(uv.x * uvScale));
        vec2 cyDD = ddAdd(vec2(u_center.y, u_centerLow.y), ddFromFloat(uv.y * uvScale));
        
        // z starts at 0
        vec2 zxDD = vec2(0.0, 0.0);
        vec2 zyDD = vec2(0.0, 0.0);
        
        for (int i = 0; i < 2000; i++) {
            if (float(i) >= u_maxIter) break;
            
            // z = z^2 + c using double-double
            vec2 newZxDD, newZyDD;
            ddComplexSquare(zxDD, zyDD, newZxDD, newZyDD);
            zxDD = ddAdd(newZxDD, cxDD);
            zyDD = ddAdd(newZyDD, cyDD);
            
            // Convert to float for escape check and coloring
            z = vec2(zxDD.x, zyDD.x);
            
            // Orbit trap calculations
            float distToOrigin = length(z);
            minDist = min(minDist, distToOrigin);
            minDistCross = min(minDistCross, min(abs(z.x), abs(z.y)));
            
            float magSq = dot(z, z);
            if (magSq > 256.0) {
                float log_zn = log(magSq) / 2.0;
                float nu = log(log_zn / log(2.0)) / log(2.0);
                iterations = float(i) + 1.0 - nu;
                break;
            }
            
            iterations = float(i);
        }
    } else {
        // Standard precision path
        vec2 c = u_center + uv * 2.0 / u_zoom;
        
        if (u_juliaMode > 0.5) {
            z = c;
            c = u_juliaC;
        } else {
            z = vec2(0.0, 0.0);
        }
        
        for (int i = 0; i < 2000; i++) {
            if (float(i) >= u_maxIter) break;
            
            if (u_burningShip > 0.5) {
                z = abs(z);
            }
            
            // Track derivative for distance estimation
            if (abs(u_power - 2.0) < 0.01) {
                dz = 2.0 * complexMul(z, dz) + vec2(1.0, 0.0);
            } else {
                dz = u_power * complexMul(complexPower(z, u_power - 1.0), dz) + vec2(1.0, 0.0);
            }
            
            z = complexPower(z, u_power) + c;
            
            // Orbit trap calculations
            float distToOrigin = length(z);
            minDist = min(minDist, distToOrigin);
            minDistCross = min(minDistCross, min(abs(z.x), abs(z.y)));
            
            float magSq = dot(z, z);
            if (magSq > 256.0) {
                float log_zn = log(magSq) / 2.0;
                float nu = log(log_zn / log(2.0)) / log(u_power);
                iterations = float(i) + 1.0 - nu;
                break;
            }
            
            iterations = float(i);
        }
    }
    
    // Calculate distance estimate
    float zMag = length(z);
    float dzMag = length(dz);
    float distance = 0.0;
    if (dzMag > 0.0 && iterations < u_maxIter - 0.5) {
        distance = log(zMag * zMag) * zMag / dzMag * 0.5;
    }
    
    // Select orbit trap value based on coloring mode
    float orbitTrap = minDist;
    if (u_coloringMode > 1.5) {
        orbitTrap = minDistCross;
    }
    
    // Interior coloring value
    float interiorValue = 0.0;
    if (iterations >= u_maxIter - 0.5) {
        float angle = atan(z.y, z.x);
        interiorValue = mod(angle / 3.14159 + 1.0, 1.0) * 0.5 + minDist * 0.5;
    }
    
    vec3 color = getColor(iterations, u_maxIter, u_base, u_colorScheme, u_colorOffset, distance, orbitTrap, interiorValue);
    gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * Uniform names used in the fractal shader
 */
export const UNIFORM_NAMES = [
  'u_resolution',
  'u_center',
  'u_centerLow',
  'u_zoom',
  'u_power',
  'u_maxIter',
  'u_base',
  'u_colorScheme',
  'u_colorOffset',
  'u_burningShip',
  'u_juliaMode',
  'u_juliaC',
  'u_coloringMode',
  'u_useDoublePrecision'
];

/**
 * Color scheme names for UI
 */
export const COLOR_SCHEME_NAMES = [
  'Rainbow',           // 0
  'Fire',              // 1
  'Ice',               // 2
  'Matrix Green',      // 3
  'Purple Haze',       // 4
  'Electric Blue',     // 5
  'Lava',              // 6
  'Neon',              // 7
  'Sunset',            // 8
  'Ocean',             // 9
  'Plasma',            // 10
  'Copper',            // 11
  'Gold',              // 12
  'Monochrome',        // 13
  'Stripes',           // 14
  'Psychedelic',       // 15
  'Forest',            // 16
  'Midnight',          // 17
  'Distance Glow',     // 18
  'Orbit Trap'         // 19
];

/**
 * Coloring modes
 */
export const COLORING_MODES = {
  ESCAPE_TIME: 0,
  DISTANCE_ESTIMATION: 1,
  ORBIT_TRAP: 2
};

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
