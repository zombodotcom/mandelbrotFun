/**
 * FractalState - Centralized state management for the Mandelbrot explorer
 * Implements the observer pattern for reactive UI updates
 */

/**
 * Default state values
 */
export const DEFAULT_STATE = {
  // Viewport
  centerX: -0.5,
  centerY: 0.0,
  zoom: 1.0,
  
  // Fractal parameters
  power: 2.0,
  maxIter: 256,
  
  // Visualization
  numberBase: 10,
  colorScheme: 3, // Matrix
  colorOffset: 0.0,
  
  // Fractal variants
  burningShip: false,
  juliaMode: false,
  juliaC: [-0.4, 0.6],
  
  // Canvas dimensions
  width: 1200,
  height: 900
};

/**
 * Creates a deep clone of an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * FractalState class
 * Manages application state with immutable updates and observer pattern
 */
export class FractalState {
  /**
   * Creates a new FractalState instance
   * @param {Object} initialState - Initial state values (merged with defaults)
   */
  constructor(initialState = {}) {
    this._state = { ...deepClone(DEFAULT_STATE), ...deepClone(initialState) };
    this._listeners = new Set();
    this._history = [];
    this._historyIndex = -1;
    this._maxHistorySize = 50;
  }

  /**
   * Gets the current state (returns a frozen copy for immutability)
   * @returns {Object} Current state
   */
  getState() {
    return Object.freeze(deepClone(this._state));
  }

  /**
   * Gets a specific state property
   * @param {string} key - Property name
   * @returns {*} Property value
   */
  get(key) {
    const value = this._state[key];
    return Array.isArray(value) ? [...value] : value;
  }

  /**
   * Updates state with new values
   * @param {Object} changes - Object with properties to update
   * @param {Object} options - Update options
   * @param {boolean} options.silent - If true, don't notify listeners
   * @param {boolean} options.addToHistory - If true, add to undo history
   * @returns {Object} The new state
   */
  update(changes, options = {}) {
    const { silent = false, addToHistory = false } = options;
    
    // Validate changes
    const validatedChanges = this._validateChanges(changes);
    
    // Check if anything actually changed
    const hasChanges = Object.keys(validatedChanges).some(key => {
      const oldVal = this._state[key];
      const newVal = validatedChanges[key];
      
      if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        return oldVal.length !== newVal.length || 
               oldVal.some((v, i) => v !== newVal[i]);
      }
      return oldVal !== newVal;
    });
    
    if (!hasChanges) {
      return this.getState();
    }
    
    // Save to history if requested
    if (addToHistory) {
      this._pushHistory();
    }
    
    // Apply changes immutably
    this._state = {
      ...this._state,
      ...deepClone(validatedChanges)
    };
    
    // Notify listeners
    if (!silent) {
      this._notifyListeners(validatedChanges);
    }
    
    return this.getState();
  }

  /**
   * Validates and constrains state changes
   * @private
   */
  _validateChanges(changes) {
    const validated = { ...changes };
    
    // Constrain power to valid range
    if (validated.power !== undefined) {
      validated.power = Math.max(1, Math.min(12, validated.power));
    }
    
    // Constrain maxIter to valid range
    if (validated.maxIter !== undefined) {
      validated.maxIter = Math.max(10, Math.min(10000, Math.floor(validated.maxIter)));
    }
    
    // Constrain zoom to prevent precision issues
    if (validated.zoom !== undefined) {
      validated.zoom = Math.max(0.1, Math.min(1e15, validated.zoom));
    }
    
    // Constrain numberBase
    if (validated.numberBase !== undefined) {
      validated.numberBase = Math.max(2, Math.min(60, Math.floor(validated.numberBase)));
    }
    
    // Constrain colorScheme
    if (validated.colorScheme !== undefined) {
      validated.colorScheme = Math.max(0, Math.min(7, Math.floor(validated.colorScheme)));
    }
    
    // Wrap colorOffset
    if (validated.colorOffset !== undefined) {
      validated.colorOffset = ((validated.colorOffset % 100) + 100) % 100;
    }
    
    // Ensure juliaC is array of length 2
    if (validated.juliaC !== undefined) {
      if (!Array.isArray(validated.juliaC) || validated.juliaC.length !== 2) {
        delete validated.juliaC;
      }
    }
    
    return validated;
  }

  /**
   * Resets state to default values
   * @param {Object} options - Reset options
   * @returns {Object} The new state
   */
  reset(options = {}) {
    return this.update(DEFAULT_STATE, options);
  }

  /**
   * Subscribes a listener to state changes
   * @param {Function} listener - Callback function(newState, changedKeys)
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    this._listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * Notifies all listeners of state change
   * @private
   */
  _notifyListeners(changedKeys) {
    const state = this.getState();
    const keys = Object.keys(changedKeys);
    
    this._listeners.forEach(listener => {
      try {
        listener(state, keys);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Pushes current state to history
   * @private
   */
  _pushHistory() {
    // Truncate any forward history
    this._history = this._history.slice(0, this._historyIndex + 1);
    
    // Add current state
    this._history.push(deepClone(this._state));
    this._historyIndex = this._history.length - 1;
    
    // Limit history size
    if (this._history.length > this._maxHistorySize) {
      this._history.shift();
      this._historyIndex--;
    }
  }

  /**
   * Undoes the last state change
   * @returns {boolean} True if undo was successful
   */
  undo() {
    if (this._historyIndex < 0) {
      return false;
    }
    
    this._state = deepClone(this._history[this._historyIndex]);
    this._historyIndex--;
    this._notifyListeners(this._state);
    return true;
  }

  /**
   * Checks if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this._historyIndex >= 0;
  }

  /**
   * Applies a preset configuration
   * @param {Object} preset - Preset configuration object
   * @param {Object} options - Update options
   * @returns {Object} The new state
   */
  applyPreset(preset, options = {}) {
    return this.update(preset, { ...options, addToHistory: true });
  }

  /**
   * Gets the viewport configuration for coordinate conversions
   * @returns {Object} Viewport object with width, height, centerX, centerY, zoom
   */
  getViewport() {
    return {
      width: this._state.width,
      height: this._state.height,
      centerX: this._state.centerX,
      centerY: this._state.centerY,
      zoom: this._state.zoom
    };
  }

  /**
   * Zooms at a specific screen coordinate
   * @param {number} px - Screen x coordinate
   * @param {number} py - Screen y coordinate
   * @param {number} factor - Zoom factor (>1 to zoom in, <1 to zoom out)
   * @param {Object} options - Update options
   */
  zoomAt(px, py, factor, options = {}) {
    const { width, height, centerX, centerY, zoom } = this._state;
    const aspectRatio = width / height;
    
    // Convert screen to complex coordinates
    const normalizedX = (px / width - 0.5) * 2;
    const normalizedY = (py / height - 0.5) * 2;
    const scale = 2.0 / zoom;
    
    const clickX = centerX + normalizedX * aspectRatio * scale;
    const clickY = centerY - normalizedY * scale;
    
    // New center moves toward click point
    const newZoom = zoom * factor;
    const t = 1 - 1/factor; // How much to move toward click point
    const newCenterX = centerX + (clickX - centerX) * t;
    const newCenterY = centerY + (clickY - centerY) * t;
    
    this.update({
      centerX: newCenterX,
      centerY: newCenterY,
      zoom: newZoom
    }, options);
  }

  /**
   * Pans the view by screen pixels
   * @param {number} dx - Delta x in pixels
   * @param {number} dy - Delta y in pixels
   * @param {Object} options - Update options
   */
  pan(dx, dy, options = {}) {
    const { width, height, centerX, centerY, zoom } = this._state;
    
    const scale = 4.0 / (zoom * Math.min(width, height));
    
    this.update({
      centerX: centerX - dx * scale,
      centerY: centerY + dy * scale
    }, options);
  }

  /**
   * Serializes state to JSON string
   * @returns {string} JSON representation
   */
  toJSON() {
    return JSON.stringify(this._state);
  }

  /**
   * Creates a FractalState from JSON string
   * @param {string} json - JSON string
   * @returns {FractalState} New FractalState instance
   */
  static fromJSON(json) {
    try {
      const state = JSON.parse(json);
      return new FractalState(state);
    } catch (error) {
      console.error('Failed to parse state JSON:', error);
      return new FractalState();
    }
  }

  /**
   * Creates a URL-safe representation of the current view
   * @returns {string} Base64-encoded state
   */
  toURLParams() {
    const viewState = {
      x: this._state.centerX,
      y: this._state.centerY,
      z: this._state.zoom,
      p: this._state.power,
      i: this._state.maxIter,
      b: this._state.numberBase,
      c: this._state.colorScheme
    };
    
    if (this._state.burningShip) viewState.bs = 1;
    if (this._state.juliaMode) {
      viewState.jm = 1;
      viewState.jx = this._state.juliaC[0];
      viewState.jy = this._state.juliaC[1];
    }
    
    return btoa(JSON.stringify(viewState));
  }

  /**
   * Restores state from URL parameters
   * @param {string} encoded - Base64-encoded state
   * @returns {boolean} True if successful
   */
  fromURLParams(encoded) {
    try {
      const viewState = JSON.parse(atob(encoded));
      
      this.update({
        centerX: viewState.x ?? this._state.centerX,
        centerY: viewState.y ?? this._state.centerY,
        zoom: viewState.z ?? this._state.zoom,
        power: viewState.p ?? this._state.power,
        maxIter: viewState.i ?? this._state.maxIter,
        numberBase: viewState.b ?? this._state.numberBase,
        colorScheme: viewState.c ?? this._state.colorScheme,
        burningShip: !!viewState.bs,
        juliaMode: !!viewState.jm,
        juliaC: viewState.jm ? [viewState.jx, viewState.jy] : this._state.juliaC
      });
      
      return true;
    } catch (error) {
      console.error('Failed to parse URL params:', error);
      return false;
    }
  }
}
