import { 
  ShaderManager, 
  VERTEX_SHADER_SOURCE, 
  FRAGMENT_SHADER_SOURCE,
  UNIFORM_NAMES 
} from '../../src/core/ShaderManager.js';
import { createMockGLContext } from '../setup.js';

describe('ShaderManager', () => {
  let gl;
  let shaderManager;

  beforeEach(() => {
    gl = createMockGLContext();
    shaderManager = new ShaderManager(gl);
  });

  describe('constructor', () => {
    test('should throw if no WebGL context provided', () => {
      expect(() => new ShaderManager(null)).toThrow('WebGL context is required');
    });

    test('should create with valid WebGL context', () => {
      expect(shaderManager).toBeInstanceOf(ShaderManager);
    });
  });

  describe('compileShader', () => {
    test('should call WebGL shader creation methods', () => {
      const shader = shaderManager.compileShader('void main() {}', gl.VERTEX_SHADER);
      
      expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
      expect(gl.shaderSource).toHaveBeenCalled();
      expect(gl.compileShader).toHaveBeenCalled();
    });

    test('should throw on compilation failure', () => {
      gl.getShaderParameter.mockReturnValue(false);
      gl.getShaderInfoLog.mockReturnValue('Syntax error');
      
      expect(() => {
        shaderManager.compileShader('invalid shader', gl.FRAGMENT_SHADER);
      }).toThrow('Shader compilation error');
    });

    test('should delete shader on compilation failure', () => {
      gl.getShaderParameter.mockReturnValue(false);
      
      try {
        shaderManager.compileShader('invalid', gl.VERTEX_SHADER);
      } catch (e) {
        // Expected
      }
      
      expect(gl.deleteShader).toHaveBeenCalled();
    });

    test('should throw if createShader fails', () => {
      gl.createShader.mockReturnValue(null);
      
      expect(() => {
        shaderManager.compileShader('source', gl.VERTEX_SHADER);
      }).toThrow('Failed to create shader');
    });
  });

  describe('createProgram', () => {
    test('should create and link a program', () => {
      const program = shaderManager.createProgram(
        VERTEX_SHADER_SOURCE,
        FRAGMENT_SHADER_SOURCE
      );
      
      expect(gl.createProgram).toHaveBeenCalled();
      expect(gl.attachShader).toHaveBeenCalledTimes(2);
      expect(gl.linkProgram).toHaveBeenCalled();
    });

    test('should throw on link failure', () => {
      gl.getProgramParameter.mockReturnValue(false);
      gl.getProgramInfoLog.mockReturnValue('Link error');
      
      expect(() => {
        shaderManager.createProgram('vertex', 'fragment');
      }).toThrow('Program link error');
    });

    test('should cache named programs', () => {
      const program1 = shaderManager.createProgram('v', 'f', 'test');
      const program2 = shaderManager.createProgram('v', 'f', 'test');
      
      expect(program1).toBe(program2);
      // Only one program should be created
      expect(gl.createProgram).toHaveBeenCalledTimes(1);
    });

    test('should cleanup on program creation failure', () => {
      gl.createProgram.mockReturnValue(null);
      
      expect(() => {
        shaderManager.createProgram('v', 'f');
      }).toThrow('Failed to create program');
      
      expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUniformLocations', () => {
    test('should get locations for all uniform names', () => {
      const program = {};
      const names = ['u_zoom', 'u_center', 'u_power'];
      
      const locations = shaderManager.getUniformLocations(program, names);
      
      expect(gl.getUniformLocation).toHaveBeenCalledTimes(3);
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'u_zoom');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'u_center');
      expect(gl.getUniformLocation).toHaveBeenCalledWith(program, 'u_power');
    });

    test('should return object with all locations', () => {
      const program = {};
      const names = ['u_zoom', 'u_center'];
      
      const locations = shaderManager.getUniformLocations(program, names);
      
      expect(locations).toHaveProperty('u_zoom');
      expect(locations).toHaveProperty('u_center');
    });
  });

  describe('getAttribLocation', () => {
    test('should call WebGL getAttribLocation', () => {
      const program = {};
      
      shaderManager.getAttribLocation(program, 'position');
      
      expect(gl.getAttribLocation).toHaveBeenCalledWith(program, 'position');
    });
  });

  describe('createMandelbrotProgram', () => {
    test('should create program with default shaders', () => {
      const program = shaderManager.createMandelbrotProgram();
      
      expect(program).toBeDefined();
      expect(gl.shaderSource).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('position')
      );
    });

    test('should cache as "mandelbrot"', () => {
      shaderManager.createMandelbrotProgram();
      
      expect(shaderManager.hasProgram('mandelbrot')).toBe(true);
    });
  });

  describe('getMandelbrotUniforms', () => {
    test('should get all Mandelbrot uniform locations', () => {
      const program = {};
      
      const uniforms = shaderManager.getMandelbrotUniforms(program);
      
      expect(uniforms).toHaveProperty('u_resolution');
      expect(uniforms).toHaveProperty('u_center');
      expect(uniforms).toHaveProperty('u_zoom');
      expect(uniforms).toHaveProperty('u_power');
      expect(uniforms).toHaveProperty('u_maxIter');
      expect(uniforms).toHaveProperty('u_base');
      expect(uniforms).toHaveProperty('u_colorScheme');
      expect(uniforms).toHaveProperty('u_colorOffset');
      expect(uniforms).toHaveProperty('u_burningShip');
      expect(uniforms).toHaveProperty('u_juliaMode');
      expect(uniforms).toHaveProperty('u_juliaC');
    });
  });

  describe('deleteProgram', () => {
    test('should delete program and associated shaders', () => {
      const program = shaderManager.createProgram('v', 'f', 'test');
      
      shaderManager.deleteProgram(program);
      
      expect(gl.deleteProgram).toHaveBeenCalledWith(program);
      expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    });

    test('should remove from cache', () => {
      const program = shaderManager.createProgram('v', 'f', 'test');
      
      expect(shaderManager.hasProgram('test')).toBe(true);
      shaderManager.deleteProgram(program);
      expect(shaderManager.hasProgram('test')).toBe(false);
    });
  });

  describe('dispose', () => {
    test('should clean up all programs', () => {
      shaderManager.createProgram('v', 'f', 'test1');
      shaderManager.createProgram('v', 'f', 'test2');
      
      shaderManager.dispose();
      
      expect(shaderManager.hasProgram('test1')).toBe(false);
      expect(shaderManager.hasProgram('test2')).toBe(false);
    });
  });

  describe('getProgram', () => {
    test('should return cached program', () => {
      const program = shaderManager.createProgram('v', 'f', 'test');
      
      expect(shaderManager.getProgram('test')).toBe(program);
    });

    test('should return null for uncached program', () => {
      expect(shaderManager.getProgram('nonexistent')).toBeNull();
    });
  });

  describe('constants', () => {
    test('VERTEX_SHADER_SOURCE should contain position attribute', () => {
      expect(VERTEX_SHADER_SOURCE).toContain('attribute');
      expect(VERTEX_SHADER_SOURCE).toContain('position');
    });

    test('FRAGMENT_SHADER_SOURCE should contain main function', () => {
      expect(FRAGMENT_SHADER_SOURCE).toContain('void main()');
    });

    test('FRAGMENT_SHADER_SOURCE should contain all uniforms', () => {
      for (const name of UNIFORM_NAMES) {
        expect(FRAGMENT_SHADER_SOURCE).toContain(name);
      }
    });

    test('UNIFORM_NAMES should have expected uniforms', () => {
      expect(UNIFORM_NAMES).toContain('u_resolution');
      expect(UNIFORM_NAMES).toContain('u_center');
      expect(UNIFORM_NAMES).toContain('u_zoom');
      expect(UNIFORM_NAMES).toContain('u_power');
      expect(UNIFORM_NAMES).toContain('u_juliaC');
    });
  });
});
