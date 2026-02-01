/**
 * Main entry point for the Mandelbrot WebGL Explorer
 * Wires together all modules and initializes the application
 */

import { FractalState } from './core/FractalState.js';
import { WebGLRenderer } from './core/WebGLRenderer.js';
import { AnimationController, ANIMATION_TYPES } from './animations/AnimationController.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { InteractionManager } from './ui/InteractionManager.js';
import { BookmarkManager } from './ui/BookmarkManager.js';
import { PRESETS } from './animations/presets.js';

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
    this.bookmarkManager = null;
    this._fpsUpdateInterval = null;
    this._locationLabel = null;
  }

  /**
   * Initializes the application
   * @param {Object} config - Configuration options
   */
  init(config = {}) {
    const { canvasId = 'glCanvas' } = config;

    // Get canvas element
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    // Size canvas to viewport (container is fullscreen)
    const container = canvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Initialize state with canvas dimensions
    this.state = new FractalState({ width, height });

    // Handle window resize
    window.addEventListener('resize', () => this._resizeCanvas());

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

    // Initialize bookmark manager
    this.bookmarkManager = new BookmarkManager(this.state);
    this._setupBookmarkUI();

    // Setup location label
    this._locationLabel = document.getElementById('locationLabel');
    this._setupLocationLabels();

    // Expose global functions for HTML onclick handlers
    this._exposeGlobalFunctions();

    // Controls overlay toggle
    this._setupControlsToggle();

    // Start render loop
    this._startRenderLoop();

    // Initial display update
    this.controlPanel.updateDisplay();

    console.log('Mandelbrot Explorer initialized');
    console.log('WebGL Capabilities:', this.renderer.getCapabilities());
  }

  /**
   * Resizes canvas to fill viewport and updates state
   * @private
   */
  _resizeCanvas() {
    const canvas = this.renderer?.getCanvas();
    if (!canvas || !this.state) return;

    const container = canvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      this.state.update({ width, height });
      this.renderer.resize(width, height);
    }
  }

  /**
   * Sets up bookmark UI and event handlers
   * @private
   */
  _setupBookmarkUI() {
    this._updateBookmarkList();
    
    // Subscribe to bookmark changes
    this.bookmarkManager.subscribe(() => {
      this._updateBookmarkList();
    });
  }

  /**
   * Updates the bookmark list in the UI
   * @private
   */
  _updateBookmarkList() {
    const listEl = document.getElementById('bookmarkList');
    if (!listEl) return;

    const bookmarks = this.bookmarkManager.getBookmarks();

    if (bookmarks.length === 0) {
      listEl.innerHTML = '<div class="help-text">No bookmarks saved yet</div>';
      return;
    }

    listEl.innerHTML = bookmarks.map(b => `
      <div class="bookmark-item" data-id="${b.id}">
        <span class="bookmark-item-name" onclick="loadBookmark('${b.id}')">${this._escapeHtml(b.name)}</span>
        <span class="bookmark-item-delete" onclick="deleteBookmark('${b.id}')">&times;</span>
      </div>
    `).join('');
  }

  /**
   * Escapes HTML special characters
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sets up location label display for famous coordinates
   * @private
   */
  _setupLocationLabels() {
    // Subscribe to state changes to check for famous locations
    this.state.subscribe((state, changedKeys) => {
      if (changedKeys.includes('centerX') || changedKeys.includes('centerY') || changedKeys.includes('zoom')) {
        this._checkLocationLabel(state);
      }
    });
  }

  /**
   * Checks if current location matches a famous preset and shows label
   * @private
   */
  _checkLocationLabel(state) {
    if (!this._locationLabel) return;

    const threshold = 0.001 / Math.max(1, state.zoom * 0.1);
    
    // Check against all presets
    for (const [key, preset] of Object.entries(PRESETS)) {
      const dx = Math.abs(state.centerX - preset.centerX);
      const dy = Math.abs(state.centerY - preset.centerY);
      
      if (dx < threshold && dy < threshold) {
        this._showLocationLabel(preset.name);
        return;
      }
    }
    
    // Also check animation controller's current zoom target
    const zoomTarget = this.animController.getCurrentZoomTargetName?.();
    if (zoomTarget && this.animController.isRunning(ANIMATION_TYPES.ZOOM)) {
      this._showLocationLabel(zoomTarget);
      return;
    }
    
    this._hideLocationLabel();
  }

  /**
   * Shows the location label
   * @private
   */
  _showLocationLabel(name) {
    if (!this._locationLabel) return;
    this._locationLabel.textContent = name;
    this._locationLabel.classList.add('visible');
  }

  /**
   * Hides the location label
   * @private
   */
  _hideLocationLabel() {
    if (!this._locationLabel) return;
    this._locationLabel.classList.remove('visible');
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
      coloringMode: document.getElementById('coloringMode'),
      qualityPreset: document.getElementById('qualityPreset'),
      autoScale: document.getElementById('autoScale'),

      // Info displays
      infoFormula: document.getElementById('infoFormula'),
      infoBase: document.getElementById('infoBase'),
      infoCenterX: document.getElementById('infoCenterX'),
      infoCenterY: document.getElementById('infoCenterY'),
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
      const url = this.bookmarkManager.createShareURL();
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          alert('URL copied to clipboard!');
        });
      } else {
        prompt('Copy this URL:', url);
      }
    };

    // Bookmark functions
    window.saveBookmark = () => {
      const nameInput = document.getElementById('bookmarkName');
      const name = nameInput?.value.trim() || '';
      this.bookmarkManager.saveBookmark(name);
      if (nameInput) nameInput.value = '';
    };

    window.loadBookmark = (id) => {
      this.bookmarkManager.loadBookmark(id);
    };

    window.deleteBookmark = (id) => {
      if (confirm('Delete this bookmark?')) {
        this.bookmarkManager.deleteBookmark(id);
      }
    };

    window.exportBookmarks = () => {
      const json = this.bookmarkManager.exportBookmarks();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mandelbrot_bookmarks.json';
      a.click();
      URL.revokeObjectURL(url);
    };

    window.importBookmarks = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const count = this.bookmarkManager.importBookmarks(event.target.result);
            alert(`Imported ${count} bookmarks`);
          };
          reader.readAsText(file);
        }
      };
      input.click();
    };

    // Copy coordinates
    window.copyCoordinates = () => {
      const state = this.state.getState();
      const coords = `Center: (${state.centerX}, ${state.centerY})\nZoom: ${state.zoom.toExponential(4)}`;
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(coords).then(() => {
          alert('Coordinates copied!');
        });
      } else {
        prompt('Copy coordinates:', coords);
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
    // Try new format first
    if (this.bookmarkManager.loadFromURL()) {
      this.controlPanel.syncControls();
      console.log('Loaded view from URL');
      return;
    }

    // Fall back to old format
    const params = new URLSearchParams(window.location.search);
    const viewState = params.get('v');

    if (viewState) {
      if (this.state.fromURLParams(viewState)) {
        this.controlPanel.syncControls();
        console.log('Loaded view from URL (legacy format)');
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
