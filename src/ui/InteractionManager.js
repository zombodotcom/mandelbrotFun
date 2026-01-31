/**
 * InteractionManager - Handles mouse/touch input for canvas interaction
 */

/**
 * InteractionManager class
 * Manages pan, zoom, and click interactions on the fractal canvas
 */
export class InteractionManager {
  /**
   * Creates a new InteractionManager
   * @param {HTMLCanvasElement} canvas - The canvas element to attach to
   * @param {FractalState} state - The fractal state to modify
   * @param {Object} options - Configuration options
   */
  constructor(canvas, state, options = {}) {
    if (!canvas) {
      throw new Error('Canvas element is required');
    }
    if (!state) {
      throw new Error('FractalState is required');
    }
    
    this._canvas = canvas;
    this._state = state;
    
    this._options = {
      zoomFactor: 2,
      wheelZoomFactor: 1.1,
      enablePan: true,
      enableZoom: true,
      enableClick: true,
      enableTouch: true,
      ...options
    };
    
    // Interaction state
    this._isDragging = false;
    this._lastMouseX = 0;
    this._lastMouseY = 0;
    this._dragStartX = 0;
    this._dragStartY = 0;
    
    // Touch state
    this._lastTouchDistance = 0;
    this._touchStartTime = 0;
    
    // Bound handlers for cleanup
    this._boundHandlers = {};
    
    // Attach event listeners
    this._attachListeners();
  }

  /**
   * Attaches all event listeners
   * @private
   */
  _attachListeners() {
    const handlers = this._boundHandlers;
    
    // Mouse events
    handlers.mousedown = this._onMouseDown.bind(this);
    handlers.mousemove = this._onMouseMove.bind(this);
    handlers.mouseup = this._onMouseUp.bind(this);
    handlers.mouseleave = this._onMouseLeave.bind(this);
    handlers.wheel = this._onWheel.bind(this);
    handlers.click = this._onClick.bind(this);
    
    this._canvas.addEventListener('mousedown', handlers.mousedown);
    this._canvas.addEventListener('mousemove', handlers.mousemove);
    this._canvas.addEventListener('mouseup', handlers.mouseup);
    this._canvas.addEventListener('mouseleave', handlers.mouseleave);
    this._canvas.addEventListener('wheel', handlers.wheel, { passive: false });
    this._canvas.addEventListener('click', handlers.click);
    
    // Touch events
    if (this._options.enableTouch) {
      handlers.touchstart = this._onTouchStart.bind(this);
      handlers.touchmove = this._onTouchMove.bind(this);
      handlers.touchend = this._onTouchEnd.bind(this);
      
      this._canvas.addEventListener('touchstart', handlers.touchstart, { passive: false });
      this._canvas.addEventListener('touchmove', handlers.touchmove, { passive: false });
      this._canvas.addEventListener('touchend', handlers.touchend);
    }
  }

  /**
   * Removes all event listeners
   * @private
   */
  _detachListeners() {
    const handlers = this._boundHandlers;
    
    this._canvas.removeEventListener('mousedown', handlers.mousedown);
    this._canvas.removeEventListener('mousemove', handlers.mousemove);
    this._canvas.removeEventListener('mouseup', handlers.mouseup);
    this._canvas.removeEventListener('mouseleave', handlers.mouseleave);
    this._canvas.removeEventListener('wheel', handlers.wheel);
    this._canvas.removeEventListener('click', handlers.click);
    
    if (this._options.enableTouch) {
      this._canvas.removeEventListener('touchstart', handlers.touchstart);
      this._canvas.removeEventListener('touchmove', handlers.touchmove);
      this._canvas.removeEventListener('touchend', handlers.touchend);
    }
  }

  /**
   * Gets canvas-relative coordinates from an event
   * @private
   */
  _getEventCoords(event) {
    const rect = this._canvas.getBoundingClientRect();
    const scaleX = this._canvas.width / rect.width;
    const scaleY = this._canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  /**
   * Handles mouse down event
   * @private
   */
  _onMouseDown(event) {
    if (!this._options.enablePan) return;
    
    this._isDragging = true;
    this._lastMouseX = event.clientX;
    this._lastMouseY = event.clientY;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    
    this._canvas.style.cursor = 'grabbing';
  }

  /**
   * Handles mouse move event
   * @private
   */
  _onMouseMove(event) {
    if (!this._isDragging) return;
    
    const dx = event.clientX - this._lastMouseX;
    const dy = event.clientY - this._lastMouseY;
    
    this._state.pan(dx, dy);
    
    this._lastMouseX = event.clientX;
    this._lastMouseY = event.clientY;
  }

  /**
   * Handles mouse up event
   * @private
   */
  _onMouseUp(event) {
    this._isDragging = false;
    this._canvas.style.cursor = 'crosshair';
  }

  /**
   * Handles mouse leave event
   * @private
   */
  _onMouseLeave(event) {
    if (this._isDragging) {
      this._isDragging = false;
      this._canvas.style.cursor = 'crosshair';
    }
  }

  /**
   * Handles wheel event for zooming
   * @private
   */
  _onWheel(event) {
    if (!this._options.enableZoom) return;
    
    event.preventDefault();
    
    const coords = this._getEventCoords(event);
    const factor = event.deltaY > 0 
      ? 1 / this._options.wheelZoomFactor 
      : this._options.wheelZoomFactor;
    
    this._state.zoomAt(coords.x, coords.y, factor);
  }

  /**
   * Handles click event for zoom-to-point
   * @private
   */
  _onClick(event) {
    if (!this._options.enableClick) return;
    
    // Ignore if we just dragged
    const dragDistance = Math.sqrt(
      Math.pow(event.clientX - this._dragStartX, 2) +
      Math.pow(event.clientY - this._dragStartY, 2)
    );
    
    if (dragDistance > 5) return;
    
    const coords = this._getEventCoords(event);
    const factor = event.shiftKey 
      ? 1 / this._options.zoomFactor 
      : this._options.zoomFactor;
    
    this._state.zoomAt(coords.x, coords.y, factor);
  }

  /**
   * Handles touch start event
   * @private
   */
  _onTouchStart(event) {
    event.preventDefault();
    
    this._touchStartTime = Date.now();
    
    if (event.touches.length === 1) {
      // Single touch - pan
      const touch = event.touches[0];
      this._isDragging = true;
      this._lastMouseX = touch.clientX;
      this._lastMouseY = touch.clientY;
      this._dragStartX = touch.clientX;
      this._dragStartY = touch.clientY;
    } else if (event.touches.length === 2) {
      // Two touches - pinch zoom
      this._isDragging = false;
      this._lastTouchDistance = this._getTouchDistance(event.touches);
    }
  }

  /**
   * Handles touch move event
   * @private
   */
  _onTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1 && this._isDragging) {
      // Pan
      const touch = event.touches[0];
      const dx = touch.clientX - this._lastMouseX;
      const dy = touch.clientY - this._lastMouseY;
      
      this._state.pan(dx, dy);
      
      this._lastMouseX = touch.clientX;
      this._lastMouseY = touch.clientY;
    } else if (event.touches.length === 2) {
      // Pinch zoom
      const distance = this._getTouchDistance(event.touches);
      const center = this._getTouchCenter(event.touches);
      
      if (this._lastTouchDistance > 0) {
        const factor = distance / this._lastTouchDistance;
        
        const rect = this._canvas.getBoundingClientRect();
        const scaleX = this._canvas.width / rect.width;
        const scaleY = this._canvas.height / rect.height;
        
        this._state.zoomAt(
          (center.x - rect.left) * scaleX,
          (center.y - rect.top) * scaleY,
          factor
        );
      }
      
      this._lastTouchDistance = distance;
    }
  }

  /**
   * Handles touch end event
   * @private
   */
  _onTouchEnd(event) {
    const touchDuration = Date.now() - this._touchStartTime;
    
    // Detect tap (short touch without much movement)
    if (this._isDragging && touchDuration < 200) {
      const dragDistance = Math.sqrt(
        Math.pow(this._lastMouseX - this._dragStartX, 2) +
        Math.pow(this._lastMouseY - this._dragStartY, 2)
      );
      
      if (dragDistance < 10) {
        // It's a tap - zoom in
        const rect = this._canvas.getBoundingClientRect();
        const scaleX = this._canvas.width / rect.width;
        const scaleY = this._canvas.height / rect.height;
        
        this._state.zoomAt(
          (this._dragStartX - rect.left) * scaleX,
          (this._dragStartY - rect.top) * scaleY,
          this._options.zoomFactor
        );
      }
    }
    
    this._isDragging = false;
    this._lastTouchDistance = 0;
  }

  /**
   * Calculates distance between two touches
   * @private
   */
  _getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculates center point between two touches
   * @private
   */
  _getTouchCenter(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }

  /**
   * Checks if currently dragging
   * @returns {boolean}
   */
  isDragging() {
    return this._isDragging;
  }

  /**
   * Updates options
   * @param {Object} options - New options to merge
   */
  setOptions(options) {
    this._options = { ...this._options, ...options };
  }

  /**
   * Gets current options
   * @returns {Object}
   */
  getOptions() {
    return { ...this._options };
  }

  /**
   * Cleans up event listeners
   */
  dispose() {
    this._detachListeners();
    this._boundHandlers = {};
  }
}
