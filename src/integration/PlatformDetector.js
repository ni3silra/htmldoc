/**
 * PlatformDetector - Identifies the current documentation platform environment
 * 
 * This module detects which documentation platform the library is running in
 * to enable platform-specific optimizations and compatibility measures.
 */

/**
 * Supported documentation platforms
 */
const PLATFORMS = {
  CONFLUENCE: 'confluence',
  NOTION: 'notion',
  GITBOOK: 'gitbook',
  DOCUSAURUS: 'docusaurus',
  MKDOCS: 'mkdocs',
  SPHINX: 'sphinx',
  GENERIC: 'generic'
};

/**
 * Platform detection patterns and methods
 */
const DETECTION_PATTERNS = {
  [PLATFORMS.CONFLUENCE]: {
    selectors: ['#com-atlassian-confluence', '.confluence-content', 'meta[name="confluence-version"]'],
    globals: ['AJS', 'Confluence'],
    userAgent: /confluence/i,
    url: /\/confluence\//i
  },
  [PLATFORMS.NOTION]: {
    selectors: ['.notion-page-content', '.notion-app'],
    globals: ['notion'],
    userAgent: /notion/i,
    url: /notion\.so/i
  },
  [PLATFORMS.GITBOOK]: {
    selectors: ['.gitbook-root', '.gb-main'],
    globals: ['gitbook'],
    userAgent: /gitbook/i,
    url: /gitbook\.io/i
  },
  [PLATFORMS.DOCUSAURUS]: {
    selectors: ['[data-theme="light"]', '[data-theme="dark"]', '.docusaurus'],
    globals: ['docusaurus'],
    userAgent: /docusaurus/i,
    url: /\/docs\//i
  },
  [PLATFORMS.MKDOCS]: {
    selectors: ['.md-container', '.md-main'],
    globals: ['mkdocs'],
    userAgent: /mkdocs/i,
    url: /\/site\//i
  },
  [PLATFORMS.SPHINX]: {
    selectors: ['.sphinxsidebar', '.document'],
    globals: ['sphinx'],
    userAgent: /sphinx/i,
    url: /\/docs\//i
  }
};

class PlatformDetector {
  constructor() {
    this.detectedPlatform = null;
    this.platformFeatures = {};
    this.detectionCache = new Map();
  }

  /**
   * Detect the current documentation platform
   * @returns {string} The detected platform identifier
   */
  detectPlatform() {
    if (this.detectedPlatform) {
      return this.detectedPlatform;
    }

    // Check cache first
    const cacheKey = this._generateCacheKey();
    if (this.detectionCache.has(cacheKey)) {
      this.detectedPlatform = this.detectionCache.get(cacheKey);
      return this.detectedPlatform;
    }

    // Perform detection
    for (const [platform, patterns] of Object.entries(DETECTION_PATTERNS)) {
      if (this._matchesPlatform(patterns)) {
        this.detectedPlatform = platform;
        this._detectPlatformFeatures(platform);
        this.detectionCache.set(cacheKey, platform);
        return platform;
      }
    }

    // Default to generic if no specific platform detected
    this.detectedPlatform = PLATFORMS.GENERIC;
    this.detectionCache.set(cacheKey, PLATFORMS.GENERIC);
    return PLATFORMS.GENERIC;
  }

  /**
   * Check if running in a specific platform
   * @param {string} platform - Platform to check for
   * @returns {boolean} True if running in the specified platform
   */
  isPlatform(platform) {
    return this.detectPlatform() === platform;
  }

  /**
   * Get platform-specific features and capabilities
   * @returns {Object} Platform features object
   */
  getPlatformFeatures() {
    if (!this.detectedPlatform) {
      this.detectPlatform();
    }
    return this.platformFeatures;
  }

  /**
   * Check if the platform supports a specific feature
   * @param {string} feature - Feature to check for
   * @returns {boolean} True if feature is supported
   */
  supportsFeature(feature) {
    const features = this.getPlatformFeatures();
    return features[feature] === true;
  }

  /**
   * Get platform-specific configuration recommendations
   * @returns {Object} Configuration object
   */
  getPlatformConfig() {
    const platform = this.detectPlatform();
    
    const configs = {
      [PLATFORMS.CONFLUENCE]: {
        useNamespacing: true,
        restrictedCSP: true,
        sandboxed: true,
        maxNodes: 50,
        animationsEnabled: false
      },
      [PLATFORMS.NOTION]: {
        useNamespacing: true,
        restrictedCSP: false,
        sandboxed: false,
        maxNodes: 100,
        animationsEnabled: true
      },
      [PLATFORMS.GITBOOK]: {
        useNamespacing: false,
        restrictedCSP: false,
        sandboxed: false,
        maxNodes: 200,
        animationsEnabled: true
      },
      [PLATFORMS.DOCUSAURUS]: {
        useNamespacing: false,
        restrictedCSP: false,
        sandboxed: false,
        maxNodes: 200,
        animationsEnabled: true
      },
      [PLATFORMS.GENERIC]: {
        useNamespacing: false,
        restrictedCSP: false,
        sandboxed: false,
        maxNodes: 200,
        animationsEnabled: true
      }
    };

    return configs[platform] || configs[PLATFORMS.GENERIC];
  }

  /**
   * Check if a platform pattern matches the current environment
   * @private
   * @param {Object} patterns - Platform detection patterns
   * @returns {boolean} True if patterns match
   */
  _matchesPlatform(patterns) {
    let score = 0;
    let totalChecks = 0;

    // Check DOM selectors
    if (patterns.selectors) {
      totalChecks++;
      for (const selector of patterns.selectors) {
        if (document.querySelector(selector)) {
          score++;
          break;
        }
      }
    }

    // Check global variables
    if (patterns.globals) {
      totalChecks++;
      for (const global of patterns.globals) {
        if (typeof window[global] !== 'undefined') {
          score++;
          break;
        }
      }
    }

    // Check user agent
    if (patterns.userAgent) {
      totalChecks++;
      if (patterns.userAgent.test(navigator.userAgent)) {
        score++;
      }
    }

    // Check URL patterns
    if (patterns.url) {
      totalChecks++;
      if (patterns.url.test(window.location.href)) {
        score++;
      }
    }

    // Require at least 50% match confidence
    return totalChecks > 0 && (score / totalChecks) >= 0.5;
  }

  /**
   * Detect platform-specific features
   * @private
   * @param {string} platform - Detected platform
   */
  _detectPlatformFeatures(platform) {
    this.platformFeatures = {
      hasCSP: this._hasContentSecurityPolicy(),
      hasSandbox: this._isSandboxed(),
      hasNamespacing: this._needsNamespacing(platform),
      supportsAnimations: this._supportsAnimations(),
      supportsInteraction: this._supportsInteraction(),
      maxComplexity: this._getMaxComplexity(platform)
    };
  }

  /**
   * Generate cache key for detection results
   * @private
   * @returns {string} Cache key
   */
  _generateCacheKey() {
    return `${window.location.hostname}:${document.title}:${navigator.userAgent.slice(0, 50)}`;
  }

  /**
   * Check if Content Security Policy is active
   * @private
   * @returns {boolean} True if CSP is detected
   */
  _hasContentSecurityPolicy() {
    // Check for CSP meta tag
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) return true;

    // Check for CSP header (limited detection from client-side)
    try {
      // Attempt to create inline script - will fail if CSP blocks it
      const script = document.createElement('script');
      script.textContent = '// CSP test';
      document.head.appendChild(script);
      document.head.removeChild(script);
      return false;
    } catch (e) {
      return true;
    }
  }

  /**
   * Check if running in sandboxed environment
   * @private
   * @returns {boolean} True if sandboxed
   */
  _isSandboxed() {
    try {
      return window.top !== window.self;
    } catch (e) {
      return true; // Cross-origin frame
    }
  }

  /**
   * Check if platform needs CSS namespacing
   * @private
   * @param {string} platform - Platform identifier
   * @returns {boolean} True if namespacing needed
   */
  _needsNamespacing(platform) {
    return [PLATFORMS.CONFLUENCE, PLATFORMS.NOTION].includes(platform);
  }

  /**
   * Check if animations are supported/recommended
   * @private
   * @returns {boolean} True if animations supported
   */
  _supportsAnimations() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if interactive features are supported
   * @private
   * @returns {boolean} True if interaction supported
   */
  _supportsInteraction() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get maximum recommended complexity for platform
   * @private
   * @param {string} platform - Platform identifier
   * @returns {number} Maximum node count
   */
  _getMaxComplexity(platform) {
    const limits = {
      [PLATFORMS.CONFLUENCE]: 50,
      [PLATFORMS.NOTION]: 100,
      [PLATFORMS.GITBOOK]: 200,
      [PLATFORMS.DOCUSAURUS]: 200,
      [PLATFORMS.GENERIC]: 200
    };
    return limits[platform] || 200;
  }
}

// Export singleton instance
const platformDetector = new PlatformDetector();

export { platformDetector, PLATFORMS };
export default PlatformDetector;