/**
 * BookmarkManager - Manages saved view bookmarks with LocalStorage persistence
 */

const STORAGE_KEY = 'mandelbrot_bookmarks';

/**
 * BookmarkManager class
 * Handles saving, loading, and managing user bookmarks
 */
export class BookmarkManager {
  /**
   * Creates a new BookmarkManager
   * @param {FractalState} state - The fractal state
   */
  constructor(state) {
    if (!state) {
      throw new Error('FractalState is required');
    }
    
    this._state = state;
    this._bookmarks = [];
    this._listeners = new Set();
    
    // Load bookmarks from storage
    this._loadFromStorage();
  }

  /**
   * Gets all bookmarks
   * @returns {Array} Array of bookmark objects
   */
  getBookmarks() {
    return [...this._bookmarks];
  }

  /**
   * Gets a bookmark by ID
   * @param {string} id - Bookmark ID
   * @returns {Object|null} Bookmark or null
   */
  getBookmark(id) {
    return this._bookmarks.find(b => b.id === id) || null;
  }

  /**
   * Saves current view as a bookmark
   * @param {string} name - Bookmark name
   * @param {string} description - Optional description
   * @returns {Object} The created bookmark
   */
  saveBookmark(name, description = '') {
    const state = this._state.getState();
    
    const bookmark = {
      id: this._generateId(),
      name: name || `Bookmark ${this._bookmarks.length + 1}`,
      description,
      createdAt: new Date().toISOString(),
      // Save view parameters
      centerX: state.centerX,
      centerY: state.centerY,
      zoom: state.zoom,
      power: state.power,
      maxIter: state.maxIter,
      colorScheme: state.colorScheme,
      coloringMode: state.coloringMode,
      numberBase: state.numberBase,
      burningShip: state.burningShip,
      juliaMode: state.juliaMode,
      juliaC: state.juliaC ? [...state.juliaC] : null
    };
    
    this._bookmarks.push(bookmark);
    this._saveToStorage();
    this._notifyListeners();
    
    return bookmark;
  }

  /**
   * Loads a bookmark (applies its settings to state)
   * @param {string} id - Bookmark ID
   * @returns {boolean} True if loaded successfully
   */
  loadBookmark(id) {
    const bookmark = this.getBookmark(id);
    
    if (!bookmark) {
      return false;
    }
    
    this._state.update({
      centerX: bookmark.centerX,
      centerY: bookmark.centerY,
      zoom: bookmark.zoom,
      power: bookmark.power,
      maxIter: bookmark.maxIter,
      colorScheme: bookmark.colorScheme,
      coloringMode: bookmark.coloringMode || 0,
      numberBase: bookmark.numberBase,
      burningShip: bookmark.burningShip,
      juliaMode: bookmark.juliaMode,
      juliaC: bookmark.juliaC
    });
    
    return true;
  }

  /**
   * Deletes a bookmark
   * @param {string} id - Bookmark ID
   * @returns {boolean} True if deleted
   */
  deleteBookmark(id) {
    const index = this._bookmarks.findIndex(b => b.id === id);
    
    if (index === -1) {
      return false;
    }
    
    this._bookmarks.splice(index, 1);
    this._saveToStorage();
    this._notifyListeners();
    
    return true;
  }

  /**
   * Renames a bookmark
   * @param {string} id - Bookmark ID
   * @param {string} newName - New name
   * @returns {boolean} True if renamed
   */
  renameBookmark(id, newName) {
    const bookmark = this.getBookmark(id);
    
    if (!bookmark) {
      return false;
    }
    
    bookmark.name = newName;
    this._saveToStorage();
    this._notifyListeners();
    
    return true;
  }

  /**
   * Exports all bookmarks as JSON string
   * @returns {string} JSON string of bookmarks
   */
  exportBookmarks() {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks: this._bookmarks
    }, null, 2);
  }

  /**
   * Imports bookmarks from JSON string
   * @param {string} jsonStr - JSON string to import
   * @param {boolean} replace - If true, replaces existing bookmarks
   * @returns {number} Number of bookmarks imported
   */
  importBookmarks(jsonStr, replace = false) {
    try {
      const data = JSON.parse(jsonStr);
      
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        throw new Error('Invalid bookmark format');
      }
      
      // Validate bookmarks
      const validBookmarks = data.bookmarks.filter(b => 
        b.centerX !== undefined && 
        b.centerY !== undefined && 
        b.zoom !== undefined
      );
      
      // Assign new IDs to avoid conflicts
      validBookmarks.forEach(b => {
        b.id = this._generateId();
        b.importedAt = new Date().toISOString();
      });
      
      if (replace) {
        this._bookmarks = validBookmarks;
      } else {
        this._bookmarks.push(...validBookmarks);
      }
      
      this._saveToStorage();
      this._notifyListeners();
      
      return validBookmarks.length;
    } catch (e) {
      console.error('Failed to import bookmarks:', e);
      return 0;
    }
  }

  /**
   * Clears all bookmarks
   */
  clearAll() {
    this._bookmarks = [];
    this._saveToStorage();
    this._notifyListeners();
  }

  /**
   * Subscribes to bookmark changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Gets the number of bookmarks
   * @returns {number}
   */
  get count() {
    return this._bookmarks.length;
  }

  /**
   * Generates a unique ID
   * @private
   */
  _generateId() {
    return 'bm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Loads bookmarks from LocalStorage
   * @private
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this._bookmarks = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load bookmarks from storage:', e);
      this._bookmarks = [];
    }
  }

  /**
   * Saves bookmarks to LocalStorage
   * @private
   */
  _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._bookmarks));
    } catch (e) {
      console.error('Failed to save bookmarks to storage:', e);
    }
  }

  /**
   * Notifies all listeners of changes
   * @private
   */
  _notifyListeners() {
    const bookmarks = this.getBookmarks();
    this._listeners.forEach(listener => {
      try {
        listener(bookmarks);
      } catch (e) {
        console.error('Bookmark listener error:', e);
      }
    });
  }

  /**
   * Creates a shareable URL for the current view
   * @returns {string} Shareable URL
   */
  createShareURL() {
    const state = this._state.getState();
    const params = new URLSearchParams({
      x: state.centerX.toFixed(15),
      y: state.centerY.toFixed(15),
      z: state.zoom.toExponential(6),
      p: state.power.toFixed(2),
      i: state.maxIter,
      c: state.colorScheme,
      b: state.numberBase
    });
    
    if (state.burningShip) params.set('bs', '1');
    if (state.juliaMode) {
      params.set('jm', '1');
      params.set('jx', state.juliaC[0].toFixed(10));
      params.set('jy', state.juliaC[1].toFixed(10));
    }
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  /**
   * Loads view from URL parameters
   * @returns {boolean} True if parameters were found and applied
   */
  loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (!params.has('x') || !params.has('y')) {
      return false;
    }
    
    const updates = {};
    
    if (params.has('x')) updates.centerX = parseFloat(params.get('x'));
    if (params.has('y')) updates.centerY = parseFloat(params.get('y'));
    if (params.has('z')) updates.zoom = parseFloat(params.get('z'));
    if (params.has('p')) updates.power = parseFloat(params.get('p'));
    if (params.has('i')) updates.maxIter = parseInt(params.get('i'));
    if (params.has('c')) updates.colorScheme = parseInt(params.get('c'));
    if (params.has('b')) updates.numberBase = parseInt(params.get('b'));
    if (params.has('bs')) updates.burningShip = params.get('bs') === '1';
    if (params.has('jm')) {
      updates.juliaMode = params.get('jm') === '1';
      if (params.has('jx') && params.has('jy')) {
        updates.juliaC = [parseFloat(params.get('jx')), parseFloat(params.get('jy'))];
      }
    }
    
    this._state.update(updates);
    return true;
  }
}
