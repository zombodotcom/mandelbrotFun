/**
 * AnimationController - Orchestrates all fractal animations
 */

import { TOUR_STOPS, NUMBER_BASES, ANIMATION_TYPES, interpolatePresets } from './presets.js';

/**
 * AnimationController class
 * Manages animation state and timing for the fractal explorer
 */
export class AnimationController {
  /**
   * Creates a new AnimationController
   * @param {FractalState} state - The fractal state to animate
   */
  constructor(state) {
    if (!state) {
      throw new Error('FractalState is required');
    }
    
    this._state = state;
    this._animations = new Map();
    this._speed = 5; // 1-10 scale
    this._listeners = new Set();
  }

  /**
   * Sets the animation speed
   * @param {number} speed - Speed from 1-10
   */
  setSpeed(speed) {
    this._speed = Math.max(1, Math.min(10, speed));
  }

  /**
   * Gets the current animation speed
   * @returns {number}
   */
  getSpeed() {
    return this._speed;
  }

  /**
   * Checks if a specific animation is running
   * @param {string} type - Animation type
   * @returns {boolean}
   */
  isRunning(type) {
    return this._animations.has(type);
  }

  /**
   * Gets all running animation types
   * @returns {string[]}
   */
  getRunningAnimations() {
    return Array.from(this._animations.keys());
  }

  /**
   * Starts an animation
   * @param {string} type - Animation type from ANIMATION_TYPES
   * @returns {boolean} True if started, false if already running
   */
  start(type) {
    if (this._animations.has(type)) {
      return false;
    }
    
    let animation;
    
    switch (type) {
      case ANIMATION_TYPES.ZOOM:
        animation = this._createZoomAnimation();
        break;
      case ANIMATION_TYPES.COLOR_CYCLE:
        animation = this._createColorCycleAnimation();
        break;
      case ANIMATION_TYPES.POWER_MORPH:
        animation = this._createPowerMorphAnimation();
        break;
      case ANIMATION_TYPES.BASE_CYCLE:
        animation = this._createBaseCycleAnimation();
        break;
      case ANIMATION_TYPES.TOUR:
        animation = this._createTourAnimation();
        break;
      case ANIMATION_TYPES.JULIA_MORPH:
        animation = this._createJuliaMorphAnimation();
        break;
      default:
        console.warn(`Unknown animation type: ${type}`);
        return false;
    }
    
    this._animations.set(type, animation);
    this._notifyListeners();
    return true;
  }

  /**
   * Stops an animation
   * @param {string} type - Animation type
   * @returns {boolean} True if stopped, false if not running
   */
  stop(type) {
    const animation = this._animations.get(type);
    
    if (!animation) {
      return false;
    }
    
    if (animation.intervalId) {
      clearInterval(animation.intervalId);
    }
    
    // Run cleanup if defined
    if (animation.cleanup) {
      animation.cleanup();
    }
    
    this._animations.delete(type);
    this._notifyListeners();
    return true;
  }

  /**
   * Stops all animations
   */
  stopAll() {
    for (const type of this._animations.keys()) {
      this.stop(type);
    }
  }

  /**
   * Toggles an animation on/off
   * @param {string} type - Animation type
   * @returns {boolean} True if now running, false if stopped
   */
  toggle(type) {
    if (this.isRunning(type)) {
      this.stop(type);
      return false;
    } else {
      this.start(type);
      return true;
    }
  }

  /**
   * Subscribes to animation state changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notifies listeners of animation state change
   * @private
   */
  _notifyListeners() {
    const running = this.getRunningAnimations();
    this._listeners.forEach(listener => {
      try {
        listener(running);
      } catch (e) {
        console.error('Animation listener error:', e);
      }
    });
  }

  /**
   * Creates zoom animation
   * @private
   */
  _createZoomAnimation() {
    let direction = 1;
    
    const intervalId = setInterval(() => {
      const currentZoom = this._state.get('zoom');
      const newZoom = currentZoom * (1 + 0.02 * direction);
      
      // Reverse direction at limits
      if (newZoom > 10000) direction = -1;
      if (newZoom < 0.5) direction = 1;
      
      this._state.update({ zoom: newZoom });
    }, 50 / this._speed);
    
    return { intervalId, direction };
  }

  /**
   * Creates color cycle animation
   * @private
   */
  _createColorCycleAnimation() {
    const intervalId = setInterval(() => {
      const offset = this._state.get('colorOffset');
      this._state.update({ 
        colorOffset: (offset + this._speed * 0.5) % 100 
      });
    }, 50);
    
    return { intervalId };
  }

  /**
   * Creates power morph animation
   * @private
   */
  _createPowerMorphAnimation() {
    let direction = 1;
    
    const intervalId = setInterval(() => {
      const power = this._state.get('power');
      const newPower = power + 0.05 * direction;
      
      // Reverse direction at limits
      if (newPower > 8) direction = -1;
      if (newPower < 2) direction = 1;
      
      this._state.update({ power: newPower });
    }, 100 / this._speed);
    
    return { intervalId, direction };
  }

  /**
   * Creates base cycle animation
   * @private
   */
  _createBaseCycleAnimation() {
    let baseIndex = NUMBER_BASES.indexOf(this._state.get('numberBase'));
    if (baseIndex === -1) baseIndex = 0;
    
    const intervalId = setInterval(() => {
      baseIndex = (baseIndex + 1) % NUMBER_BASES.length;
      this._state.update({ numberBase: NUMBER_BASES[baseIndex] });
    }, 1000 / this._speed);
    
    return { intervalId, baseIndex };
  }

  /**
   * Creates tour animation
   * @private
   */
  _createTourAnimation() {
    let stopIndex = 0;
    let startTime = performance.now();
    let fromState = this._state.getState();
    
    const intervalId = setInterval(() => {
      const now = performance.now();
      const stop = TOUR_STOPS[stopIndex];
      const elapsed = now - startTime;
      const duration = stop.duration / this._speed;
      
      if (elapsed >= duration) {
        // Move to next stop
        stopIndex = (stopIndex + 1) % TOUR_STOPS.length;
        startTime = now;
        fromState = this._state.getState();
      } else {
        // Interpolate to current stop
        const t = elapsed / duration;
        const interpolated = interpolatePresets(
          fromState,
          { 
            centerX: stop.centerX, 
            centerY: stop.centerY, 
            zoom: stop.zoom,
            power: fromState.power,
            burningShip: false,
            juliaMode: false
          },
          t
        );
        
        this._state.update({
          centerX: interpolated.centerX,
          centerY: interpolated.centerY,
          zoom: interpolated.zoom
        });
      }
    }, 16); // ~60fps
    
    return { intervalId, stopIndex };
  }

  /**
   * Creates Julia morphing animation
   * @private
   */
  _createJuliaMorphAnimation() {
    let angle = 0;
    
    // Enable Julia mode
    this._state.update({ juliaMode: true });
    
    const intervalId = setInterval(() => {
      angle += 0.01 * this._speed;
      
      // Orbit around origin in complex plane
      const radius = 0.7885;
      const juliaC = [
        radius * Math.cos(angle),
        radius * Math.sin(angle)
      ];
      
      this._state.update({ juliaC });
    }, 50);
    
    return {
      intervalId,
      angle,
      cleanup: () => {
        // Optionally disable Julia mode when stopping
        // this._state.update({ juliaMode: false });
      }
    };
  }

  /**
   * Cleans up all resources
   */
  dispose() {
    this.stopAll();
    this._listeners.clear();
  }
}

// Re-export animation types for convenience
export { ANIMATION_TYPES };
