/**
 * @fileoverview Centralized event management for diagram interactions
 * This module provides a unified system for handling all user interaction events
 * including mouse, touch, and keyboard events with proper cleanup and delegation.
 */

/**
 * Centralized event handler manager for diagram interactions
 * Provides a clean interface for registering, managing, and cleaning up event listeners
 * with support for event delegation and proper memory management.
 */
export class EventHandlers {
  /**
   * Initialize the event handler manager
   * @param {SVGElement} svgElement - The main SVG element for the diagram
   * @param {InteractionConfig} config - Configuration for interaction behavior
   */
  constructor(svgElement, config = {}) {
    /** @type {SVGElement} */
    this.svgElement = svgElement;
    
    /** @type {InteractionConfig} */
    this.config = {
      enableZoom: true,
      enablePan: true,
      enableTooltips: true,
      enableSelection: true,
      enableKeyboardNav: true,
      ...config
    };
    
    /** @type {Map<string, Set<Function>>} */
    this.eventListeners = new Map();
    
    /** @type {Map<string, Function>} */
    this.boundHandlers = new Map();
    
    /** @type {boolean} */
    this.isInitialized = false;
    
    /** @type {AbortController} */
    this.abortController = new AbortController();
    
    this.initialize();
  }
  
  /**
   * Initialize event handlers and set up event delegation
   * @private
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }
    
    // Set up event delegation for common events
    this.setupEventDelegation();
    
    // Set up keyboard navigation if enabled
    if (this.config.enableKeyboardNav) {
      this.setupKeyboardHandlers();
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Set up event delegation for mouse and touch events
   * @private
   */
  setupEventDelegation() {
    const events = [
      'click',
      'dblclick',
      'mousedown',
      'mouseup',
      'mousemove',
      'mouseenter',
      'mouseleave',
      'wheel',
      'touchstart',
      'touchmove',
      'touchend'
    ];
    
    events.forEach(eventType => {
      const handler = this.createDelegatedHandler(eventType);
      this.boundHandlers.set(eventType, handler);
      
      this.svgElement.addEventListener(eventType, handler, {
        passive: eventType.startsWith('touch') || eventType === 'wheel',
        signal: this.abortController.signal
      });
    });
  }
  
  /**
   * Set up keyboard event handlers for navigation
   * @private
   */
  setupKeyboardHandlers() {
    const keyHandler = this.createKeyboardHandler();
    this.boundHandlers.set('keydown', keyHandler);
    
    // Keyboard events need to be on document or a focusable element
    document.addEventListener('keydown', keyHandler, {
      signal: this.abortController.signal
    });
    
    // Make SVG focusable for keyboard events
    this.svgElement.setAttribute('tabindex', '0');
  }
  
  /**
   * Create a delegated event handler for a specific event type
   * @param {string} eventType - The type of event to handle
   * @returns {Function} The delegated event handler
   * @private
   */
  createDelegatedHandler(eventType) {
    return (event) => {
      // Find the closest node or edge element
      const target = this.findInteractiveTarget(event.target);
      
      if (target) {
        // Enhance event with diagram-specific information
        const enhancedEvent = this.enhanceEvent(event, target);
        
        // Dispatch to registered handlers
        this.dispatchEvent(eventType, enhancedEvent);
      } else if (eventType === 'click' || eventType === 'mousedown') {
        // Handle background clicks for deselection
        this.dispatchEvent(`background-${eventType}`, event);
      }
      
      // Always dispatch raw events for zoom/pan functionality
      this.dispatchEvent(`raw-${eventType}`, event);
    };
  }
  
  /**
   * Create keyboard event handler
   * @returns {Function} The keyboard event handler
   * @private
   */
  createKeyboardHandler() {
    return (event) => {
      // Only handle keyboard events when SVG is focused or contains focus
      if (!this.svgElement.contains(document.activeElement) && 
          document.activeElement !== this.svgElement) {
        return;
      }
      
      const enhancedEvent = {
        ...event,
        diagramTarget: document.activeElement,
        isKeyboardNavigation: true
      };
      
      this.dispatchEvent('keydown', enhancedEvent);
    };
  }
  
  /**
   * Find the closest interactive target element (node or edge)
   * @param {Element} element - The clicked element
   * @returns {Element|null} The interactive target or null
   * @private
   */
  findInteractiveTarget(element) {
    // Walk up the DOM tree to find a node or edge element
    let current = element;
    
    while (current && current !== this.svgElement) {
      if (current.classList && (
        current.classList.contains('diagram-node') ||
        current.classList.contains('diagram-edge') ||
        current.classList.contains('diagram-label')
      )) {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }
  
  /**
   * Enhance event with diagram-specific information
   * @param {Event} event - The original event
   * @param {Element} target - The interactive target element
   * @returns {Object} Enhanced event object
   * @private
   */
  enhanceEvent(event, target) {
    const nodeId = target.getAttribute('data-node-id');
    const edgeId = target.getAttribute('data-edge-id');
    const elementType = target.classList.contains('diagram-node') ? 'node' : 'edge';
    
    return {
      ...event,
      diagramTarget: target,
      nodeId,
      edgeId,
      elementType,
      isNode: elementType === 'node',
      isEdge: elementType === 'edge'
    };
  }
  
  /**
   * Dispatch event to all registered handlers
   * @param {string} eventType - The event type
   * @param {Object} event - The event object
   * @private
   */
  dispatchEvent(eventType, event) {
    const handlers = this.eventListeners.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }
  
  /**
   * Register an event handler for a specific event type
   * @param {string} eventType - The event type to listen for
   * @param {Function} handler - The handler function
   * @returns {Function} Cleanup function to remove the handler
   */
  on(eventType, handler) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType).add(handler);
    
    // Return cleanup function
    return () => this.off(eventType, handler);
  }
  
  /**
   * Remove an event handler
   * @param {string} eventType - The event type
   * @param {Function} handler - The handler function to remove
   */
  off(eventType, handler) {
    const handlers = this.eventListeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }
  
  /**
   * Register a one-time event handler
   * @param {string} eventType - The event type to listen for
   * @param {Function} handler - The handler function
   * @returns {Function} Cleanup function to remove the handler
   */
  once(eventType, handler) {
    const onceHandler = (event) => {
      handler(event);
      this.off(eventType, onceHandler);
    };
    
    return this.on(eventType, onceHandler);
  }
  
  /**
   * Remove all event handlers for a specific event type
   * @param {string} eventType - The event type to clear
   */
  removeAllListeners(eventType) {
    if (eventType) {
      this.eventListeners.delete(eventType);
    } else {
      this.eventListeners.clear();
    }
  }
  
  /**
   * Get the current mouse/touch position relative to the SVG element
   * @param {Event} event - The mouse or touch event
   * @returns {Object} Position object with x and y coordinates
   */
  getRelativePosition(event) {
    const rect = this.svgElement.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0;
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }
  
  /**
   * Get the SVG coordinate position from a mouse/touch event
   * @param {Event} event - The mouse or touch event
   * @returns {Object} SVG coordinate position
   */
  getSVGPosition(event) {
    const relativePos = this.getRelativePosition(event);
    const svgPoint = this.svgElement.createSVGPoint();
    svgPoint.x = relativePos.x;
    svgPoint.y = relativePos.y;
    
    // Transform to SVG coordinate system
    const ctm = this.svgElement.getScreenCTM();
    if (ctm) {
      const transformedPoint = svgPoint.matrixTransform(ctm.inverse());
      return {
        x: transformedPoint.x,
        y: transformedPoint.y
      };
    }
    
    return relativePos;
  }
  
  /**
   * Check if an event is a touch event
   * @param {Event} event - The event to check
   * @returns {boolean} True if it's a touch event
   */
  isTouchEvent(event) {
    return event.type.startsWith('touch');
  }
  
  /**
   * Prevent default behavior and stop propagation for an event
   * @param {Event} event - The event to prevent
   */
  preventDefault(event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  /**
   * Throttle function calls to improve performance
   * @param {Function} func - The function to throttle
   * @param {number} delay - The throttle delay in milliseconds
   * @returns {Function} The throttled function
   */
  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return (...args) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }
  
  /**
   * Debounce function calls to reduce frequency
   * @param {Function} func - The function to debounce
   * @param {number} delay - The debounce delay in milliseconds
   * @returns {Function} The debounced function
   */
  debounce(func, delay) {
    let timeoutId;
    
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
  /**
   * Clean up all event listeners and resources
   */
  destroy() {
    // Abort all event listeners
    this.abortController.abort();
    
    // Clear all registered handlers
    this.eventListeners.clear();
    this.boundHandlers.clear();
    
    // Remove focusable attribute
    this.svgElement.removeAttribute('tabindex');
    
    this.isInitialized = false;
  }
}

export default EventHandlers;