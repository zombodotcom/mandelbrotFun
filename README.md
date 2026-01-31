# Mandelbrot WebGL Explorer

GPU-accelerated Mandelbrot fractal explorer with real-time animations and multiple visualization modes.

## Features

- **WebGL GPU Rendering**: 60+ FPS real-time fractal rendering
- **Variable Power**: Explore z^n + c for any power n (2-12)
- **Number Base Visualization**: Color banding based on different number bases (binary, decimal, dozenal, etc.)
- **Multiple Color Schemes**: Rainbow, fire, ice, matrix, and more
- **Animations**: Auto-zoom, color cycling, power morphing, Julia set morphing
- **Interactive**: Pan, zoom, and explore with mouse/touch

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm start
```

Then open `http://localhost:3000` in your browser.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Project Structure

```
src/
├── index.html              # Entry point
├── styles/
│   └── main.css            # All styling
├── core/
│   ├── WebGLRenderer.js    # WebGL abstraction layer
│   ├── ShaderManager.js    # Shader compilation & management
│   └── FractalState.js     # Centralized state management
├── math/
│   ├── ComplexMath.js      # Complex number operations
│   └── ColorSchemes.js     # Color palette calculations
├── ui/
│   ├── ControlPanel.js     # UI controls management
│   └── InteractionManager.js # Mouse/touch input handling
├── animations/
│   ├── AnimationController.js # Animation orchestration
│   └── presets.js          # Preset configurations
└── main.js                 # Application entry point

tests/
├── core/
├── math/
├── ui/
└── setup.js                # Test setup and mocks
```

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **State Management**: `FractalState` provides a single source of truth with observer pattern
- **Rendering**: `WebGLRenderer` and `ShaderManager` handle all GPU operations
- **Math**: Pure functions for complex number operations and color calculations
- **UI**: `ControlPanel` and `InteractionManager` handle user input
- **Animations**: `AnimationController` orchestrates all animation types

## Controls

- **Click**: Zoom in at point
- **Shift+Click**: Zoom out
- **Drag**: Pan around
- **Mouse Wheel**: Zoom in/out

## License

MIT
