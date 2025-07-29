/**
 * Browser Compatibility Module
 * Handles browser detection, feature testing, and CSS normalization
 * for consistent diagram rendering across different browsers
 */

/**
 * Browser compatibility utility class for cross-browser support
 * Provides browser detection, feature testing, and normalization methods
 */
class BrowserCompat {
  constructor() {
    this.browserInfo = this.detectBrowser();
    this.features = this.detectFeatures();
  }

  /**
   * Detects the current browser and version
   * Uses user agent parsing with fallback detection methods
   * @returns {Object} Browser information including name, version, and engine
   */
  detectBrowser() {
    // Check if we're in a browser environment
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return {
        name: 'unknown',
        version: '0',
        engine: 'unknown',
        isSupported: false
      };
    }

    const userAgent = navigator.userAgent;
    const browserInfo = {
      name: 'unknown',
      version: '0',
      engine: 'unknown',
      isSupported: false
    };

    // Chrome detection (must come before Safari due to shared WebKit)
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserInfo.name = 'chrome';
      browserInfo.version = match ? match[1] : '0';
      browserInfo.engine = 'blink';
      browserInfo.isSupported = parseInt(browserInfo.version) >= 90;
    }
    // Edge detection (Chromium-based)
    else if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      browserInfo.name = 'edge';
      browserInfo.version = match ? match[1] : '0';
      browserInfo.engine = 'blink';
      browserInfo.isSupported = parseInt(browserInfo.version) >= 90;
    }
    // Firefox detection
    else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserInfo.name = 'firefox';
      browserInfo.version = match ? match[1] : '0';
      browserInfo.engine = 'gecko';
      browserInfo.isSupported = parseInt(browserInfo.version) >= 88;
    }
    // Safari detection
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      browserInfo.name = 'safari';
      browserInfo.version = match ? match[1] : '0';
      browserInfo.engine = 'webkit';
      browserInfo.isSupported = parseInt(browserInfo.version) >= 14;
    }

    return browserInfo;
  }

  /**
   * Detects browser features and capabilities
   * Tests for SVG support, CSS features, and JavaScript APIs
   * @returns {Object} Feature support matrix
   */
  detectFeatures() {
    const features = {
      svg: this.testSVGSupport(),
      css: this.testCSSFeatures(),
      javascript: this.testJavaScriptFeatures(),
      events: this.testEventSupport()
    };

    return features;
  }

  /**
   * Tests SVG rendering capabilities
   * Checks for basic SVG support and advanced features
   * @returns {Object} SVG feature support
   */
  testSVGSupport() {
    if (typeof document === 'undefined') {
      return { basic: false, animations: false, filters: false, foreignObject: false };
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svgSupport = {
      basic: !!(svg && svg.createSVGRect),
      animations: typeof SVGAnimateElement !== 'undefined',
      filters: typeof SVGFilterElement !== 'undefined',
      foreignObject: typeof SVGForeignObjectElement !== 'undefined'
    };

    return svgSupport;
  }

  /**
   * Tests CSS feature support
   * Checks for modern CSS features used in diagram styling
   * @returns {Object} CSS feature support
   */
  testCSSFeatures() {
    if (typeof document === 'undefined') {
      return { flexbox: false, grid: false, transforms: false, transitions: false, animations: false, customProperties: false, calc: false };
    }

    const testElement = document.createElement('div');
    const style = testElement.style;

    return {
      flexbox: 'flex' in style,
      grid: 'grid' in style,
      transforms: 'transform' in style,
      transitions: 'transition' in style,
      animations: 'animation' in style,
      customProperties: (typeof CSS !== 'undefined' && CSS && CSS.supports) ? CSS.supports('--test', '0') : false,
      calc: (typeof CSS !== 'undefined' && CSS && CSS.supports) ? CSS.supports('width', 'calc(100% - 10px)') : false
    };
  }

  /**
   * Tests JavaScript API support
   * Checks for modern JavaScript features and APIs
   * @returns {Object} JavaScript feature support
   */
  testJavaScriptFeatures() {
    return {
      es6: typeof Symbol !== 'undefined',
      promises: typeof Promise !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
      intersectionObserver: typeof IntersectionObserver !== 'undefined',
      resizeObserver: typeof ResizeObserver !== 'undefined'
    };
  }

  /**
   * Tests event handling capabilities
   * Checks for touch events and pointer events support
   * @returns {Object} Event support matrix
   */
  testEventSupport() {
    if (typeof window === 'undefined') {
      return { touch: false, pointer: false, wheel: false, passive: false };
    }

    return {
      touch: 'ontouchstart' in window,
      pointer: 'onpointerdown' in window,
      wheel: 'onwheel' in window,
      passive: this.testPassiveEventSupport()
    };
  }

  /**
   * Tests passive event listener support
   * Uses feature detection to avoid errors in older browsers
   * @returns {boolean} Whether passive events are supported
   */
  testPassiveEventSupport() {
    let passiveSupported = false;
    try {
      const options = {
        get passive() {
          passiveSupported = true;
          return false;
        }
      };
      window.addEventListener('test', null, options);
      window.removeEventListener('test', null, options);
    } catch (err) {
      passiveSupported = false;
    }
    return passiveSupported;
  }

  /**
   * Normalizes browser-specific CSS and behavior differences
   * Applies consistent styling and fixes browser quirks
   * @param {HTMLElement} container - The container element to normalize
   */
  normalizeBrowser(container) {
    if (!container) return;

    // Apply base CSS normalization
    this.applyCSSNormalization(container);

    // Apply browser-specific fixes
    this.applyBrowserSpecificFixes(container);

    // Normalize event handling
    this.normalizeEventHandling(container);
  }

  /**
   * Applies CSS normalization for consistent styling
   * Handles box-sizing, font rendering, and layout differences
   * @param {HTMLElement} container - Container to apply normalization to
   */
  applyCSSNormalization(container) {
    const styles = {
      // Consistent box model
      'box-sizing': 'border-box',
      
      // Font rendering consistency
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale',
      'text-rendering': 'optimizeLegibility',
      
      // Prevent text selection on diagram elements
      '-webkit-user-select': 'none',
      '-moz-user-select': 'none',
      '-ms-user-select': 'none',
      'user-select': 'none',
      
      // Consistent positioning context
      'position': 'relative',
      
      // Prevent unwanted margins/padding
      'margin': '0',
      'padding': '0'
    };

    Object.assign(container.style, styles);

    // Apply normalization to all child SVG elements
    const svgElements = container.querySelectorAll('svg');
    svgElements.forEach(svg => {
      svg.style.display = 'block';
      svg.style.maxWidth = '100%';
      svg.style.height = 'auto';
    });
  }

  /**
   * Applies browser-specific fixes and workarounds
   * Handles known issues in different browsers
   * @param {HTMLElement} container - Container to apply fixes to
   */
  applyBrowserSpecificFixes(container) {
    const { name, version } = this.browserInfo;

    switch (name) {
      case 'safari':
        this.applySafariFixes(container);
        break;
      case 'firefox':
        this.applyFirefoxFixes(container);
        break;
      case 'edge':
        this.applyEdgeFixes(container);
        break;
      case 'chrome':
        this.applyChromeFixes(container);
        break;
    }
  }

  /**
   * Applies Safari-specific fixes
   * Handles SVG rendering and transform issues
   * @param {HTMLElement} container - Container element
   */
  applySafariFixes(container) {
    // Fix Safari SVG scaling issues
    const svgElements = container.querySelectorAll('svg');
    svgElements.forEach(svg => {
      svg.style.webkitTransform = 'translateZ(0)';
      svg.style.webkitBackfaceVisibility = 'hidden';
    });

    // Fix Safari flexbox issues
    container.style.webkitFlexShrink = '0';
  }

  /**
   * Applies Firefox-specific fixes
   * Handles animation and rendering differences
   * @param {HTMLElement} container - Container element
   */
  applyFirefoxFixes(container) {
    // Fix Firefox SVG animation issues
    container.style.willChange = 'transform';
    
    // Improve Firefox rendering performance
    const svgElements = container.querySelectorAll('svg');
    svgElements.forEach(svg => {
      svg.style.shapeRendering = 'geometricPrecision';
    });
  }

  /**
   * Applies Edge-specific fixes
   * Handles legacy Edge compatibility issues
   * @param {HTMLElement} container - Container element
   */
  applyEdgeFixes(container) {
    // Fix Edge SVG viewBox issues
    const svgElements = container.querySelectorAll('svg');
    svgElements.forEach(svg => {
      if (svg.getAttribute('viewBox')) {
        svg.style.width = '100%';
        svg.style.height = '100%';
      }
    });
  }

  /**
   * Applies Chrome-specific fixes
   * Handles Chrome rendering optimizations
   * @param {HTMLElement} container - Container element
   */
  applyChromeFixes(container) {
    // Optimize Chrome rendering
    container.style.transform = 'translateZ(0)';
    container.style.backfaceVisibility = 'hidden';
  }

  /**
   * Normalizes event handling across browsers
   * Ensures consistent event behavior and performance
   * @param {HTMLElement} container - Container element
   */
  normalizeEventHandling(container) {
    // Disable context menu on diagram elements
    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Normalize touch events for mobile compatibility
    if (this.features.events.touch) {
      container.style.touchAction = 'manipulation';
    }

    // Prevent drag and drop interference
    container.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Gets browser information
   * @returns {Object} Current browser information
   */
  getBrowserInfo() {
    return { ...this.browserInfo };
  }

  /**
   * Gets feature support information
   * @returns {Object} Feature support matrix
   */
  getFeatures() {
    return { ...this.features };
  }

  /**
   * Checks if the current browser is supported
   * @returns {boolean} Whether the browser meets minimum requirements
   */
  isSupported() {
    return this.browserInfo.isSupported;
  }

  /**
   * Gets a list of unsupported features
   * @returns {Array} List of unsupported feature names
   */
  getUnsupportedFeatures() {
    const unsupported = [];
    
    if (!this.features.svg.basic) unsupported.push('SVG rendering');
    if (!this.features.css.transforms) unsupported.push('CSS transforms');
    if (!this.features.css.transitions) unsupported.push('CSS transitions');
    if (!this.features.javascript.es6) unsupported.push('ES6 features');
    if (!this.features.javascript.requestAnimationFrame) unsupported.push('Animation frame API');

    return unsupported;
  }
}

export default BrowserCompat;