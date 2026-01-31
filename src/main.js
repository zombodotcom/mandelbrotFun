/**
 * Main entry point for the Mandelbrot WebGL Explorer
 * Wires together all modules and initializes the application
 */

import { FractalState } from './core/FractalState.js';
import { WebGLRenderer } from './core/WebGLRenderer.js';
import { AnimationController, ANIMATION_TYPES } from './animations/AnimationController.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { InteractionManager } from './ui/InteractionManager.js';

/**
 * MandelbrotApp - Main application class
 */
class MandelbrotApp {
  constructor() {
    this.state = null;
    this.renderer = null;
    this.animController = null;
    this.controlPanel = null;
    this.interactionManager = null;
    this._fpsUpdateInterval = null;
  }

  /**
   * Initializes the application
   * @param {Object} config - Configuration options
   */
  init(config = {}) {
    const {
      canvasId = 'glCanvas',
      width = 1200,
      height = 900
    } = config;

    // Get canvas element
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    // Initialize state
    this.state = new FractalState({
      width,
      height
    });

    // Initialize renderer
    this.renderer = new WebGLRenderer(canvas);
    this.renderer.initialize();

    // Initialize animation controller
    this.animController = new AnimationController(this.state);

    // Gather DOM elements for control panel
    const elements = this._gatherElements();

    // Initialize control panel
    this.controlPanel = new ControlPanel(this.state, this.animController, elements);

    // Initialize interaction manager
    this.interactionManager = new InteractionManager(canvas, this.state);

    // Expose global functions for HTML onclick handlers
    this._exposeGlobalFunctions();

    // Start render loop
    this._startRenderLoop();

    // Initial display update
    this.controlPanel.updateDisplay();

    console.log('Mandelbrot Explorer initialized');
    console.log('WebGL Capabilities:', this.renderer.getCapabilities());
  }

  /**
   * Gathers DOM elements for controls
   * @private
   */
  _gatherElements() {
    return {
      // Sliders
      power: document.getElementById('power'),
      powerValue: document.getElementById('powerValue'),
      maxIter: document.getElementById('maxIter'),
      maxIterValue: document.getElementById('maxIterValue'),
      animSpeed: document.getElementById('animSpeed'),
      animSpeedValue: document.getElementById('animSpeedValue'),

      // Selects
      numberBase: document.getElementById('numberBase'),
      colorScheme: document.getElementById('colorScheme'),

      // Info displays
      infoFormula: document.getElementById('infoFormula'),
      infoBase: document.getElementById('infoBase'),
      infoCenter: document.getElementById('infoCenter'),
      infoZoom: document.getElementById('infoZoom'),
      infoAnim: document.getElementById('infoAnim'),
      fpsCounter: document.getElementById('fpsCounter'),

      // Animation buttons
      btnZoom: document.getElementById('btnZoom'),
      btnRotate: document.getElementById('btnRotate'),
      btnMorph: document.getElementById('btnMorph'),
      btnBase: document.getElementById('btnBase'),
      btnTour: document.getElementById('btnTour'),
      btnJulia: document.getElementById('btnJulia')
    };
  }

  /**
   * Exposes functions globally for HTML onclick handlers
   * @private
   */
  _exposeGlobalFunctions() {
    // Preset loading
    window.loadPreset = (name) => {
      this.controlPanel.loadPreset(name);
    };

    // Reset view
    window.resetView = () => {
      this.controlPanel.resetView();
    };

    // Toggle animations
    window.toggleAnimation = (type) => {
      this.controlPanel.toggleAnimation(type);
    };

    // Stop all animations
    window.stopAllAnimations = () => {
      this.controlPanel.stopAllAnimations();
    };

    // Download image
    window.downloadImage = () => {
      this.renderer.downloadImage(`mandelbrot_${Date.now()}.png`);
    };

    // Share URL
    window.shareURL = () => {
      const params = this.state.toURLParams();
      const url = `${window.location.origin}${window.location.pathname}?v=${params}`;
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          alert('URL copied to clipboard!');
        });
      } else {
        prompt('Copy this URL:', url);
      }
    };
  }

  /**
   * Starts the render loop
   * @private
   */
  _startRenderLoop() {
    const renderFrame = () => {
      this.renderer.render(this.state.getState());
      requestAnimationFrame(renderFrame);
    };

    requestAnimationFrame(renderFrame);

    // Update FPS display periodically
    this._fpsUpdateInterval = setInterval(() => {
      this.controlPanel.updateFPS(this.renderer.getFPS());
    }, 500);
  }

  /**
   * Handles URL parameters for shared views
   */
  handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    const viewState = params.get('v');

    if (viewState) {
      if (this.state.fromURLParams(viewState)) {
        this.controlPanel.syncControls();
        console.log('Loaded view from URL');
      }
    }
  }

  /**
   * Cleans up resources
   */
  dispose() {
    if (this._fpsUpdateInterval) {
      clearInterval(this._fpsUpdateInterval);
    }

    if (this.interactionManager) {
      this.interactionManager.dispose();
    }

    if (this.controlPanel) {
      this.controlPanel.dispose();
    }

    if (this.animController) {
      this.animController.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Create global app instance
const app = new MandelbrotApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
    app.handleURLParams();
  });
} else {
  app.init();
  app.handleURLParams();
}

// Export for testing
export { MandelbrotApp };
