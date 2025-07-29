/**
 * StyleIsolation - Prevents conflicts with existing page styles
 * 
 * This module provides CSS isolation mechanisms to ensure the diagram library
 * styles don't interfere with the host page and vice versa.
 */

/**
 * CSS namespace prefix for all diagram styles
 */
const NAMESPACE_PREFIX = 'html-diagram-lib';

/**
 * Critical CSS properties that need isolation
 */
const CRITICAL_PROPERTIES = [
  'position', 'display', 'width', 'height', 'margin', 'padding',
  'border', 'background', 'color', 'font-family', 'font-size',
  'line-height', 'z-index', 'transform', 'opacity'
];

/**
 * Default styles that should be reset for diagram elements
 */
const RESET_STYLES = {
  margin: '0',
  padding: '0',
  border: 'none',
  background: 'transparent',
  'font-family': 'inherit',
  'font-size': 'inherit',
  'line-height': 'inherit',
  'box-sizing': 'border-box'
};

class StyleIsolation {
  constructor() {
    this.namespace = NAMESPACE_PREFIX;
    this.isolatedContainers = new Set();
    this.styleSheet = null;
    this.originalStyles = new Map();
    this.shadowRootSupported = this._checkShadowDOMSupport();
  }

  /**
   * Initialize style isolation for a container element
   * @param {HTMLElement} container - Container element to isolate
   * @param {Object} options - Isolation options
   * @returns {HTMLElement} Isolated container element
   */
  isolateContainer(container, options = {}) {
    const {
      useShadowDOM = this.shadowRootSupported,
      useNamespacing = true,
      resetStyles = true,
      preventInheritance = true
    } = options;

    let isolatedContainer = container;

    // Try Shadow DOM first if supported and requested
    if (useShadowDOM && this.shadowRootSupported) {
      isolatedContainer = this._createShadowContainer(container);
    } else if (useNamespacing) {
      isolatedContainer = this._createNamespacedContainer(container);
    }

    // Apply style resets
    if (resetStyles) {
      this._applyStyleResets(isolatedContainer);
    }

    // Prevent style inheritance
    if (preventInheritance) {
      this._preventStyleInheritance(isolatedContainer);
    }

    this.isolatedContainers.add(isolatedContainer);
    return isolatedContainer;
  }

  /**
   * Create CSS rules with proper namespacing
   * @param {string} selector - CSS selector
   * @param {Object} styles - Style properties
   * @returns {string} Namespaced CSS rule
   */
  createNamespacedRule(selector, styles) {
    const namespacedSelector = this._namespaceSelector(selector);
    const styleString = Object.entries(styles)
      .map(([prop, value]) => `${prop}: ${value}`)
      .join('; ');
    
    return `${namespacedSelector} { ${styleString} }`;
  }

  /**
   * Add CSS rules to the isolated stylesheet
   * @param {string} cssRules - CSS rules to add
   */
  addIsolatedStyles(cssRules) {
    if (!this.styleSheet) {
      this._createStyleSheet();
    }

    try {
      this.styleSheet.insertRule(cssRules, this.styleSheet.cssRules.length);
    } catch (e) {
      console.warn('Failed to insert CSS rule:', cssRules, e);
    }
  }

  /**
   * Remove style isolation from a container
   * @param {HTMLElement} container - Container to remove isolation from
   */
  removeIsolation(container) {
    if (this.isolatedContainers.has(container)) {
      this._restoreOriginalStyles(container);
      this.isolatedContainers.delete(container);
    }
  }

  /**
   * Clean up all style isolation
   */
  cleanup() {
    // Remove all isolated containers
    for (const container of this.isolatedContainers) {
      this.removeIsolation(container);
    }

    // Remove stylesheet
    if (this.styleSheet && this.styleSheet.ownerNode) {
      this.styleSheet.ownerNode.remove();
      this.styleSheet = null;
    }

    this.isolatedContainers.clear();
    this.originalStyles.clear();
  }

  /**
   * Get the current namespace prefix
   * @returns {string} Namespace prefix
   */
  getNamespace() {
    return this.namespace;
  }

  /**
   * Set a custom namespace prefix
   * @param {string} namespace - New namespace prefix
   */
  setNamespace(namespace) {
    this.namespace = namespace;
  }

  /**
   * Check if Shadow DOM is supported
   * @private
   * @returns {boolean} True if Shadow DOM is supported
   */
  _checkShadowDOMSupport() {
    return 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype;
  }

  /**
   * Create a Shadow DOM container for complete isolation
   * @private
   * @param {HTMLElement} container - Original container
   * @returns {HTMLElement} Shadow root container
   */
  _createShadowContainer(container) {
    try {
      const shadowRoot = container.attachShadow({ mode: 'closed' });
      
      // Create wrapper div inside shadow root
      const wrapper = document.createElement('div');
      wrapper.className = `${this.namespace}-shadow-wrapper`;
      shadowRoot.appendChild(wrapper);

      // Add base styles to shadow root
      this._addShadowStyles(shadowRoot);

      return wrapper;
    } catch (e) {
      console.warn('Failed to create Shadow DOM container, falling back to namespacing:', e);
      return this._createNamespacedContainer(container);
    }
  }

  /**
   * Create a namespaced container
   * @private
   * @param {HTMLElement} container - Original container
   * @returns {HTMLElement} Namespaced container
   */
  _createNamespacedContainer(container) {
    // Add namespace class to container
    container.classList.add(`${this.namespace}-container`);
    
    // Create wrapper div for additional isolation
    const wrapper = document.createElement('div');
    wrapper.className = `${this.namespace}-wrapper`;
    
    // Move container contents to wrapper
    while (container.firstChild) {
      wrapper.appendChild(container.firstChild);
    }
    
    container.appendChild(wrapper);
    return wrapper;
  }

  /**
   * Apply style resets to prevent inheritance
   * @private
   * @param {HTMLElement} container - Container to apply resets to
   */
  _applyStyleResets(container) {
    // Store original styles for restoration
    const originalStyles = {};
    for (const prop of CRITICAL_PROPERTIES) {
      originalStyles[prop] = container.style[prop];
    }
    this.originalStyles.set(container, originalStyles);

    // Apply reset styles
    Object.assign(container.style, RESET_STYLES);
    
    // Set container-specific styles
    container.style.position = 'relative';
    container.style.display = 'block';
    container.style.isolation = 'isolate'; // Create new stacking context
  }

  /**
   * Prevent style inheritance from parent elements
   * @private
   * @param {HTMLElement} container - Container to protect
   */
  _preventStyleInheritance(container) {
    // Create CSS rule to reset inherited properties
    const inheritanceResetRule = this.createNamespacedRule('*', {
      'all': 'unset',
      'display': 'revert',
      'box-sizing': 'border-box'
    });

    this.addIsolatedStyles(inheritanceResetRule);

    // Add specific resets for common problematic properties
    const specificResets = this.createNamespacedRule('*, *::before, *::after', {
      'margin': '0',
      'padding': '0',
      'border': '0',
      'font-size': '100%',
      'font': 'inherit',
      'vertical-align': 'baseline'
    });

    this.addIsolatedStyles(specificResets);
  }

  /**
   * Add styles to Shadow DOM
   * @private
   * @param {ShadowRoot} shadowRoot - Shadow root to add styles to
   */
  _addShadowStyles(shadowRoot) {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        position: relative;
        isolation: isolate;
      }
      
      * {
        box-sizing: border-box;
      }
      
      .${this.namespace}-shadow-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
      }
    `;
    shadowRoot.appendChild(style);
  }

  /**
   * Create the isolated stylesheet
   * @private
   */
  _createStyleSheet() {
    const style = document.createElement('style');
    style.setAttribute('data-html-diagram-lib', 'isolated-styles');
    document.head.appendChild(style);
    this.styleSheet = style.sheet;
  }

  /**
   * Add namespace to CSS selector
   * @private
   * @param {string} selector - Original selector
   * @returns {string} Namespaced selector
   */
  _namespaceSelector(selector) {
    // Handle complex selectors
    if (selector.includes(',')) {
      return selector
        .split(',')
        .map(s => this._namespaceSelector(s.trim()))
        .join(', ');
    }

    // Add namespace prefix
    if (selector.startsWith(':')) {
      // Pseudo-selectors
      return `.${this.namespace}-container ${selector}`;
    } else if (selector.includes(' ')) {
      // Descendant selectors
      return `.${this.namespace}-container ${selector}`;
    } else {
      // Simple selectors
      return `.${this.namespace}-container .${selector}`;
    }
  }

  /**
   * Restore original styles to a container
   * @private
   * @param {HTMLElement} container - Container to restore
   */
  _restoreOriginalStyles(container) {
    const originalStyles = this.originalStyles.get(container);
    if (originalStyles) {
      Object.assign(container.style, originalStyles);
      this.originalStyles.delete(container);
    }

    // Remove namespace classes
    container.classList.remove(`${this.namespace}-container`);
    container.classList.remove(`${this.namespace}-wrapper`);
  }
}

// Export singleton instance
const styleIsolation = new StyleIsolation();

export { styleIsolation, NAMESPACE_PREFIX };
export default StyleIsolation;