/**
 * ControlPanel - Manages UI controls and bindings
 */

import { PRESETS, getPreset, ANIMATION_TYPES } from '../animations/presets.js';
import { COLOR_SCHEME_NAMES, NUMBER_BASE_NAMES } from '../math/ColorSchemes.js';

/**
 * ControlPanel class
 * Binds UI controls to fractal state and animation controller
 */
export class ControlPanel {
  /**
   * Creates a new ControlPanel
   * @param {FractalState} state - The fractal state
   * @param {AnimationController} animationController - Animation controller
   * @param {Object} elements - DOM elements for controls
   */
  constructor(state, animationController, elements = {}) {
    if (!state) {
      throw new Error('FractalState is required');
    }
    
    this._state = state;
    this._animController = animationController;
    this._elements = elements;
    
    // Track subscriptions for cleanup
    this._unsubscribers = [];
    
    // Bind controls if elements provided
    if (Object.keys(elements).length > 0) {
      this.bindControls();
    }
  }

  /**
   * Sets the DOM elements for controls
   * @param {Object} elements - Map of control IDs to DOM elements
   */
  setElements(elements) {
    this._elements = elements;
  }

  /**
   * Binds all control event listeners
   */
  bindControls() {
    const e = this._elements;
    
    // Power slider
    if (e.power) {
      this._bindSlider(e.power, 'power', (val) => parseFloat(val), e.powerValue);
    }
    
    // Max iterations slider
    if (e.maxIter) {
      this._bindSlider(e.maxIter, 'maxIter', (val) => parseInt(val), e.maxIterValue);
    }
    
    // Number base select
    if (e.numberBase) {
      this._bindSelect(e.numberBase, 'numberBase', (val) => parseInt(val));
    }
    
    // Color scheme select
    if (e.colorScheme) {
      this._bindSelect(e.colorScheme, 'colorScheme', (val) => parseInt(val));
    }
    
    // Coloring mode select
    if (e.coloringMode) {
      this._bindSelect(e.coloringMode, 'coloringMode', (val) => parseInt(val));
    }
    
    // Quality preset select
    if (e.qualityPreset) {
      e.qualityPreset.addEventListener('change', (event) => {
        this._applyQualityPreset(event.target.value);
      });
    }
    
    // Auto-scale iterations toggle
    if (e.autoScale) {
      e.autoScale.addEventListener('change', (event) => {
        this._state.update({ autoScaleIterations: event.target.value === '1' });
      });
    }
    
    // Animation speed slider
    if (e.animSpeed && this._animController) {
      e.animSpeed.addEventListener('input', (event) => {
        const speed = parseInt(event.target.value);
        this._animController.setSpeed(speed);
        if (e.animSpeedValue) {
          e.animSpeedValue.textContent = speed;
        }
      });
    }
    
    // Subscribe to state changes to update display
    const unsubState = this._state.subscribe((newState, changedKeys) => {
      this.updateDisplay(changedKeys);
    });
    this._unsubscribers.push(unsubState);
    
    // Subscribe to animation changes
    if (this._animController) {
      const unsubAnim = this._animController.subscribe((running) => {
        this._updateAnimationButtons(running);
      });
      this._unsubscribers.push(unsubAnim);
    }
  }

  /**
   * Binds a slider to a state property
   * @private
   */
  _bindSlider(slider, property, transform, valueDisplay) {
    slider.addEventListener('input', (event) => {
      const value = transform(event.target.value);
      this._state.update({ [property]: value });
      
      if (valueDisplay) {
        valueDisplay.textContent = this._formatValue(property, value);
      }
    });
  }

  /**
   * Binds a select to a state property
   * @private
   */
  _bindSelect(select, property, transform) {
    select.addEventListener('change', (event) => {
      const value = transform(event.target.value);
      this._state.update({ [property]: value });
    });
  }

  /**
   * Formats a value for display
   * @private
   */
  _formatValue(property, value) {
    switch (property) {
      case 'power':
        return value.toFixed(1);
      case 'zoom':
        return this._formatZoom(value);
      case 'centerX':
      case 'centerY':
        return this._formatCoordinate(value);
      default:
        return String(value);
    }
  }

  /**
   * Formats a coordinate with appropriate precision
   * @private
   */
  _formatCoordinate(value) {
    const absValue = Math.abs(value);
    
    if (absValue < 0.000001 && absValue !== 0) {
      return value.toExponential(6);
    } else if (absValue < 1) {
      return value.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
    } else {
      return value.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
    }
  }

  /**
   * Formats zoom level with readable suffix
   * @private
   */
  _formatZoom(zoom) {
    if (zoom >= 1e12) {
      return (zoom / 1e12).toFixed(2) + ' trillion x';
    } else if (zoom >= 1e9) {
      return (zoom / 1e9).toFixed(2) + ' billion x';
    } else if (zoom >= 1e6) {
      return (zoom / 1e6).toFixed(2) + ' million x';
    } else if (zoom >= 1e3) {
      return (zoom / 1e3).toFixed(2) + 'K x';
    } else if (zoom >= 1) {
      return zoom.toFixed(1) + 'x';
    } else {
      return zoom.toFixed(2) + 'x';
    }
  }

  /**
   * Loads a preset configuration
   * @param {string} presetName - Name of the preset to load
   */
  loadPreset(presetName) {
    const preset = getPreset(presetName);
    
    if (preset) {
      this._state.applyPreset(preset);
      this.syncControls();
    }
  }

  /**
   * Resets the view to default
   */
  resetView() {
    this._state.reset();
    this.syncControls();
    
    if (this._animController) {
      this._animController.stopAll();
    }
  }

  /**
   * Toggles an animation
   * @param {string} type - Animation type
   * @returns {boolean} Whether animation is now running
   */
  toggleAnimation(type) {
    if (!this._animController) return false;
    return this._animController.toggle(type);
  }

  /**
   * Stops all animations
   */
  stopAllAnimations() {
    if (this._animController) {
      this._animController.stopAll();
    }
  }

  /**
   * Applies a quality preset
   * @param {string} preset - Quality preset name
   */
  _applyQualityPreset(preset) {
    const presets = {
      draft: { maxIter: 100 },
      normal: { maxIter: 256 },
      high: { maxIter: 500 },
      ultra: { maxIter: 1000 }
    };
    
    const settings = presets[preset];
    if (settings) {
      this._state.update({ 
        qualityPreset: preset,
        maxIter: settings.maxIter 
      });
      this.syncControls();
    }
  }

  /**
   * Syncs control values with current state
   */
  syncControls() {
    const state = this._state.getState();
    const e = this._elements;
    
    if (e.power) {
      e.power.value = state.power;
      if (e.powerValue) {
        e.powerValue.textContent = state.power.toFixed(1);
      }
    }
    
    if (e.maxIter) {
      e.maxIter.value = state.maxIter;
      if (e.maxIterValue) {
        e.maxIterValue.textContent = state.maxIter;
      }
    }
    
    if (e.numberBase) {
      e.numberBase.value = state.numberBase;
    }
    
    if (e.colorScheme) {
      e.colorScheme.value = state.colorScheme;
    }
  }

  /**
   * Updates display elements based on changed keys
   * @param {string[]} changedKeys - Keys that changed
   */
  updateDisplay(changedKeys = null) {
    const state = this._state.getState();
    const e = this._elements;
    
    // Update info displays
    if (e.infoFormula) {
      e.infoFormula.textContent = `z^${state.power.toFixed(1)} + c`;
    }
    
    if (e.infoBase) {
      const baseName = NUMBER_BASE_NAMES[state.numberBase] || `Base-${state.numberBase}`;
      e.infoBase.textContent = `${state.numberBase} (${baseName})`;
    }
    
    if (e.infoCenterX) {
      e.infoCenterX.textContent = this._formatCoordinate(state.centerX);
    }
    
    if (e.infoCenterY) {
      e.infoCenterY.textContent = this._formatCoordinate(state.centerY);
    }
    
    // Legacy support for combined infoCenter
    if (e.infoCenter) {
      e.infoCenter.textContent = `(${this._formatCoordinate(state.centerX)}, ${this._formatCoordinate(state.centerY)})`;
    }
    
    if (e.infoZoom) {
      e.infoZoom.textContent = this._formatZoom(state.zoom);
    }
    
    // Sync sliders if they changed externally (e.g., from animation)
    if (changedKeys) {
      if (changedKeys.includes('power') && e.power) {
        e.power.value = state.power;
        if (e.powerValue) {
          e.powerValue.textContent = state.power.toFixed(1);
        }
      }
      
      if (changedKeys.includes('numberBase') && e.numberBase) {
        e.numberBase.value = state.numberBase;
      }
    }
  }

  /**
   * Updates animation button states
   * @private
   */
  _updateAnimationButtons(running) {
    const e = this._elements;
    
    const buttonMap = {
      [ANIMATION_TYPES.ZOOM]: e.btnZoom,
      [ANIMATION_TYPES.COLOR_CYCLE]: e.btnRotate,
      [ANIMATION_TYPES.POWER_MORPH]: e.btnMorph,
      [ANIMATION_TYPES.BASE_CYCLE]: e.btnBase,
      [ANIMATION_TYPES.TOUR]: e.btnTour,
      [ANIMATION_TYPES.JULIA_MORPH]: e.btnJulia
    };
    
    for (const [type, button] of Object.entries(buttonMap)) {
      if (button) {
        if (running.includes(type)) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      }
    }
    
    // Update info display
    if (e.infoAnim) {
      e.infoAnim.textContent = running.length > 0 ? running.join(', ') : 'None';
    }
  }

  /**
   * Updates FPS display
   * @param {number} fps - Current FPS
   */
  updateFPS(fps) {
    if (this._elements.fpsCounter) {
      this._elements.fpsCounter.textContent = fps;
    }
  }

  /**
   * Creates preset buttons
   * @param {HTMLElement} container - Container for buttons
   * @param {Function} onClick - Click handler
   */
  createPresetButtons(container, onClick) {
    for (const [id, preset] of Object.entries(PRESETS)) {
      const button = document.createElement('button');
      button.textContent = preset.name;
      button.title = preset.description;
      button.addEventListener('click', () => {
        this.loadPreset(id);
        if (onClick) onClick(id);
      });
      container.appendChild(button);
    }
  }

  /**
   * Gets all elements
   * @returns {Object}
   */
  getElements() {
    return { ...this._elements };
  }

  /**
   * Cleans up subscriptions
   */
  dispose() {
    for (const unsubscribe of this._unsubscribers) {
      unsubscribe();
    }
    this._unsubscribers = [];
  }
}
