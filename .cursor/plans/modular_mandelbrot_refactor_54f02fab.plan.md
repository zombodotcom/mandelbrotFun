---
name: Modular Mandelbrot Refactor
overview: Transform the monolithic HTML file into a modular, testable ES6 architecture with Jest testing, separating concerns into WebGL rendering, state management, UI controls, and fractal computation logic.
todos:
  - id: setup
    content: Create project structure, package.json, jest.config.js, and README
    status: completed
  - id: math
    content: Extract pure math functions into ComplexMath.js and ColorSchemes.js with tests
    status: completed
  - id: state
    content: Create FractalState class for state management with tests
    status: completed
  - id: shaders
    content: Create ShaderManager class with shader compilation logic and tests
    status: completed
  - id: renderer
    content: Build WebGLRenderer class abstracting all WebGL operations with tests
    status: completed
  - id: animations
    content: Create AnimationController and presets module with tests
    status: completed
  - id: ui
    content: Build ControlPanel and InteractionManager classes with tests
    status: completed
  - id: integration
    content: Create main.js entry point wiring all modules together
    status: completed
  - id: html_css
    content: Split HTML and CSS into separate files, update imports
    status: completed
  - id: test_suite
    content: Run full test suite, verify coverage, add integration tests
    status: completed
isProject: false
---

# Modular Mandelbrot WebGL Refactor

## Architecture Overview

We'll transform the current 869-line monolithic HTML file into a clean, testable module-based architecture following these principles:

- **Separation of Concerns**: WebGL rendering, fractal math, state management, UI, and animations in separate modules
- **Dependency Injection**: Easy to mock dependencies for testing
- **Pure Functions**: Fractal calculations and utilities as testable pure functions
- **Event-Driven**: Loose coupling between UI and rendering engine

## File Structure

```
mandelbrotFun/
├── src/
│   ├── index.html              # Entry point (minimal)
│   ├── styles/
│   │   └── main.css            # All styling
│   ├── core/
│   │   ├── WebGLRenderer.js    # WebGL abstraction layer
│   │   ├── ShaderManager.js    # Shader compilation & management
│   │   └── FractalState.js     # Centralized state management
│   ├── math/
│   │   ├── ComplexMath.js      # Complex number operations
│   │   └── ColorSchemes.js     # Color palette calculations
│   ├── ui/
│   │   ├── ControlPanel.js     # UI controls management
│   │   └── InteractionManager.js # Mouse/touch input handling
│   ├── animations/
│   │   ├── AnimationController.js # Animation orchestration
│   │   └── presets.js          # Preset configurations
│   └── main.js                 # Application entry point
├── tests/
│   ├── core/
│   │   ├── WebGLRenderer.test.js
│   │   ├── ShaderManager.test.js
│   │   └── FractalState.test.js
│   ├── math/
│   │   ├── ComplexMath.test.js
│   │   └── ColorSchemes.test.js
│   └── ui/
│       └── ControlPanel.test.js
├── package.json
├── jest.config.js
└── README.md
```

## Key Modules

### 1. **WebGLRenderer.js** - GPU Rendering Engine

Encapsulates all WebGL operations:

```javascript
class WebGLRenderer {
  constructor(canvas, shaderManager);
  render(state);              // Renders current fractal state
  updateUniforms(state);      // Updates shader uniforms
  getFPS();                   // Returns current FPS
}
```

**Testable**: Can mock canvas context, verify uniform updates without GPU

### 2. **ShaderManager.js** - Shader Lifecycle

Handles shader compilation and program linking:

```javascript
class ShaderManager {
  compileShader(source, type);
  createProgram(vertexSrc, fragmentSrc);
  getUniformLocations(program, names);
}
```

**Testable**: Mock WebGL context to verify shader compilation logic

### 3. **FractalState.js** - State Management

Single source of truth for all fractal parameters:

```javascript
class FractalState {
  constructor(initialState);
  update(changes);            // Immutable state updates
  getState();                 // Returns current state
  reset();                    // Reset to defaults
  subscribe(listener);        // Observer pattern for UI updates
}
```

**Testable**: Pure JavaScript object, no WebGL dependencies

### 4. **ComplexMath.js** - Pure Math Functions

```javascript
export function complexPower(z, n);
export function mandelbrotIteration(c, maxIter, power);
export function screenToComplex(pixel, state);
```

**Testable**: Pure functions, easy to unit test with known inputs/outputs

### 5. **ColorSchemes.js** - Color Calculations

```javascript
export function hsl2rgb(h, s, l);
export function getColorScheme(name, iterations, base);
export const COLOR_SCHEMES = { rainbow, fire, ice, matrix, ... };
```

**Testable**: Pure functions returning RGB values

### 6. **ControlPanel.js** - UI Binding

Manages DOM interactions:

```javascript
class ControlPanel {
  constructor(state, eventBus);
  bindControls();             // Wire up event listeners
  updateDisplay();            // Sync UI with state
}
```

**Testable**: Mock DOM elements and verify event handling

### 7. **AnimationController.js** - Animation System

```javascript
class AnimationController {
  constructor(state);
  start(type, speed);         // Start specific animation
  stop(type);                 // Stop animation
  stopAll();                  // Stop all animations
}
```

**Testable**: Mock timers, verify state changes over time

## Testing Strategy

### Unit Tests (90% coverage target)

- **Math modules**: Test complex power calculations, color conversions with known values
- **State management**: Test immutability, updates, subscriptions
- **Shader manager**: Mock WebGL context, verify shader compilation errors handled
- **Animation controller**: Test animation timing, state transitions

### Integration Tests

- **Renderer + State**: Verify state changes trigger re-renders
- **UI + State**: Verify control changes update state correctly
- **Animation + State**: Verify animations modify state over time

### Test Utilities

Create mock factories:

- `createMockGLContext()` - Mock WebGL context for rendering tests
- `createMockCanvas()` - Mock canvas element
- `createTestState()` - Predefined test states

## Key Improvements

1. **Modularity**: Each module has single responsibility, easy to understand and modify
2. **Testability**: Pure functions, dependency injection, mockable interfaces
3. **Maintainability**: Clear separation makes adding features easier
4. **Performance**: No change - still GPU-accelerated WebGL
5. **Debugging**: Smaller modules easier to debug, state changes traceable
6. **Extensibility**: Easy to add new color schemes, animations, fractal types

## Migration Approach

1. Extract shader strings into ShaderManager
2. Create FractalState from global variables
3. Build WebGLRenderer wrapping existing WebGL code
4. Extract pure math functions to ComplexMath
5. Create ControlPanel from existing event listeners
6. Build AnimationController from animation code
7. Wire everything together in main.js
8. Write tests for each module
9. Update index.html to load modules

## Testing Setup

```javascript
// package.json dependencies
{
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0",
  "canvas": "^2.11.2",  // For Node.js canvas mocking
  "gl": "^6.0.2"         // For WebGL mocking
}
```

## Backward Compatibility

The refactored version will have identical features and UI - just better organized internally. Users won't notice any difference except potentially better performance from optimized rendering loop.