/**
 * Browser Support Module
 * Provides compatibility matrix, version checking, and support validation
 * for the HTML Diagram Library across different browsers and versions
 */

/**
 * Browser support utility class for compatibility checking
 * Maintains compatibility matrix and provides support validation methods
 */
class BrowserSupport {
  constructor() {
    this.supportMatrix = this.initializeSupportMatrix();
    this.featureRequirements = this.initializeFeatureRequirements();
  }

  /**
   * Initializes the browser support compatibility matrix
   * Defines minimum supported versions for each browser
   * @returns {Object} Browser support matrix with version requirements
   */
  initializeSupportMatrix() {
    return {
      chrome: {
        name: 'Google Chrome',
        minVersion: 90,
        engine: 'blink',
        features: {
          svg: 4,
          es6: 51,
          flexbox: 29,
          grid: 57,
          customProperties: 49,
          intersectionObserver: 51,
          resizeObserver: 64,
          fetch: 42,
          promises: 32,
          requestAnimationFrame: 24
        },
        notes: 'Full support for all diagram features'
      },
      firefox: {
        name: 'Mozilla Firefox',
        minVersion: 88,
        engine: 'gecko',
        features: {
          svg: 3,
          es6: 45,
          flexbox: 28,
          grid: 52,
          customProperties: 31,
          intersectionObserver: 55,
          resizeObserver: 69,
          fetch: 39,
          promises: 29,
          requestAnimationFrame: 23
        },
        notes: 'Full support with minor rendering differences'
      },
      safari: {
        name: 'Safari',
        minVersion: 14,
        engine: 'webkit',
        features: {
          svg: 3.2,
          es6: 10,
          flexbox: 9,
          grid: 10.1,
          customProperties: 9.1,
          intersectionObserver: 12.1,
          resizeObserver: 13.1,
          fetch: 10.1,
          promises: 8,
          requestAnimationFrame: 6
        },
        notes: 'Requires webkit prefixes for some features'
      },
      edge: {
        name: 'Microsoft Edge',
        minVersion: 90,
        engine: 'blink',
        features: {
          svg: 12,
          es6: 14,
          flexbox: 12,
          grid: 16,
          customProperties: 15,
          intersectionObserver: 15,
          resizeObserver: 79,
          fetch: 14,
          promises: 12,
          requestAnimationFrame: 12
        },
        notes: 'Chromium-based Edge has full support'
      },
      // Legacy browsers with limited support
      ie: {
        name: 'Internet Explorer',
        minVersion: null, // Not supported
        engine: 'trident',
        features: {},
        notes: 'Not supported - requires modern browser'
      },
      edgeLegacy: {
        name: 'Microsoft Edge Legacy',
        minVersion: null, // Not supported
        engine: 'edgehtml',
        features: {},
        notes: 'Legacy Edge not supported - upgrade to Chromium Edge'
      }
    };
  }

  /**
   * Initializes feature requirements for the diagram library
   * Defines which features are required vs optional
   * @returns {Object} Feature requirements matrix
   */
  initializeFeatureRequirements() {
    return {
      required: {
        svg: 'SVG rendering support',
        es6: 'ES6 JavaScript features',
        requestAnimationFrame: 'Animation frame API',
        promises: 'Promise support',
        fetch: 'Fetch API or XMLHttpRequest'
      },
      recommended: {
        flexbox: 'CSS Flexbox for layout',
        customProperties: 'CSS custom properties',
        intersectionObserver: 'Intersection Observer API',
        resizeObserver: 'Resize Observer API'
      },
      optional: {
        grid: 'CSS Grid Layout',
        webgl: 'WebGL for advanced rendering',
        webworkers: 'Web Workers for performance'
      }
    };
  }

  /**
   * Checks if a browser version meets minimum requirements
   * @param {string} browserName - Name of the browser (chrome, firefox, safari, edge)
   * @param {string|number} version - Browser version to check
   * @returns {Object} Support status with details
   */
  checkBrowserSupport(browserName, version) {
    const browser = this.supportMatrix[browserName.toLowerCase()];
    
    if (!browser) {
      return {
        supported: false,
        reason: 'Unknown browser',
        recommendation: 'Use Chrome, Firefox, Safari, or Edge'
      };
    }

    if (browser.minVersion === null) {
      return {
        supported: false,
        reason: `${browser.name} is not supported`,
        recommendation: browser.notes
      };
    }

    const versionNumber = parseInt(version);
    const isSupported = versionNumber >= browser.minVersion;

    return {
      supported: isSupported,
      browserName: browser.name,
      minVersion: browser.minVersion,
      currentVersion: versionNumber,
      reason: isSupported ? 'Browser meets requirements' : 'Browser version too old',
      recommendation: isSupported ? 
        browser.notes : 
        `Update ${browser.name} to version ${browser.minVersion} or higher`,
      features: browser.features
    };
  }

  /**
   * Validates feature support for the current browser
   * @param {Object} browserFeatures - Feature detection results
   * @returns {Object} Feature validation results
   */
  validateFeatureSupport(browserFeatures) {
    const results = {
      canRun: true,
      missingRequired: [],
      missingRecommended: [],
      warnings: [],
      recommendations: []
    };

    // Check required features
    Object.keys(this.featureRequirements.required).forEach(feature => {
      if (!this.hasFeatureSupport(browserFeatures, feature)) {
        results.missingRequired.push({
          feature,
          description: this.featureRequirements.required[feature]
        });
        results.canRun = false;
      }
    });

    // Check recommended features
    Object.keys(this.featureRequirements.recommended).forEach(feature => {
      if (!this.hasFeatureSupport(browserFeatures, feature)) {
        results.missingRecommended.push({
          feature,
          description: this.featureRequirements.recommended[feature]
        });
        results.warnings.push(`Missing recommended feature: ${feature}`);
      }
    });

    // Generate recommendations
    if (results.missingRequired.length > 0) {
      results.recommendations.push('Update to a modern browser version');
    }
    
    if (results.missingRecommended.length > 0) {
      results.recommendations.push('Some features may have reduced functionality');
    }

    return results;
  }

  /**
   * Checks if a specific feature is supported
   * @param {Object} browserFeatures - Feature detection results
   * @param {string} featureName - Name of the feature to check
   * @returns {boolean} Whether the feature is supported
   */
  hasFeatureSupport(browserFeatures, featureName) {
    switch (featureName) {
      case 'svg':
        return browserFeatures.svg && browserFeatures.svg.basic;
      case 'es6':
        return browserFeatures.javascript && browserFeatures.javascript.es6;
      case 'requestAnimationFrame':
        return browserFeatures.javascript && browserFeatures.javascript.requestAnimationFrame;
      case 'promises':
        return browserFeatures.javascript && browserFeatures.javascript.promises;
      case 'fetch':
        return browserFeatures.javascript && browserFeatures.javascript.fetch;
      case 'flexbox':
        return browserFeatures.css && browserFeatures.css.flexbox;
      case 'customProperties':
        return browserFeatures.css && browserFeatures.css.customProperties;
      case 'intersectionObserver':
        return browserFeatures.javascript && browserFeatures.javascript.intersectionObserver;
      case 'resizeObserver':
        return browserFeatures.javascript && browserFeatures.javascript.resizeObserver;
      case 'grid':
        return browserFeatures.css && browserFeatures.css.grid;
      default:
        return false;
    }
  }

  /**
   * Gets the complete support matrix
   * @returns {Object} Full browser support matrix
   */
  getSupportMatrix() {
    return { ...this.supportMatrix };
  }

  /**
   * Gets feature requirements
   * @returns {Object} Feature requirements matrix
   */
  getFeatureRequirements() {
    return { ...this.featureRequirements };
  }

  /**
   * Gets a list of supported browsers
   * @returns {Array} List of supported browser information
   */
  getSupportedBrowsers() {
    return Object.keys(this.supportMatrix)
      .filter(key => this.supportMatrix[key].minVersion !== null)
      .map(key => ({
        key,
        name: this.supportMatrix[key].name,
        minVersion: this.supportMatrix[key].minVersion,
        engine: this.supportMatrix[key].engine,
        notes: this.supportMatrix[key].notes
      }));
  }

  /**
   * Gets a list of unsupported browsers
   * @returns {Array} List of unsupported browser information
   */
  getUnsupportedBrowsers() {
    return Object.keys(this.supportMatrix)
      .filter(key => this.supportMatrix[key].minVersion === null)
      .map(key => ({
        key,
        name: this.supportMatrix[key].name,
        reason: this.supportMatrix[key].notes
      }));
  }

  /**
   * Generates a compatibility report for a given browser
   * @param {string} browserName - Browser name
   * @param {string|number} version - Browser version
   * @param {Object} features - Feature detection results
   * @returns {Object} Comprehensive compatibility report
   */
  generateCompatibilityReport(browserName, version, features) {
    const browserSupport = this.checkBrowserSupport(browserName, version);
    const featureValidation = this.validateFeatureSupport(features);

    return {
      browser: {
        name: browserName,
        version: version,
        supported: browserSupport.supported,
        recommendation: browserSupport.recommendation
      },
      features: featureValidation,
      overall: {
        compatible: browserSupport.supported && featureValidation.canRun,
        confidence: this.calculateCompatibilityConfidence(browserSupport, featureValidation),
        recommendations: [
          ...browserSupport.recommendation ? [browserSupport.recommendation] : [],
          ...featureValidation.recommendations
        ]
      },
      details: {
        requiredFeatures: this.featureRequirements.required,
        recommendedFeatures: this.featureRequirements.recommended,
        browserFeatures: browserSupport.features || {}
      }
    };
  }

  /**
   * Calculates compatibility confidence score
   * @param {Object} browserSupport - Browser support results
   * @param {Object} featureValidation - Feature validation results
   * @returns {number} Confidence score from 0 to 100
   */
  calculateCompatibilityConfidence(browserSupport, featureValidation) {
    let score = 0;

    // Browser support contributes 60% of confidence
    if (browserSupport.supported) {
      score += 60;
    }

    // Required features contribute 30% of confidence
    if (featureValidation.canRun) {
      score += 30;
    }

    // Recommended features contribute 10% of confidence
    const totalRecommended = Object.keys(this.featureRequirements.recommended).length;
    const missingRecommended = featureValidation.missingRecommended.length;
    const recommendedScore = ((totalRecommended - missingRecommended) / totalRecommended) * 10;
    score += recommendedScore;

    return Math.round(score);
  }

  /**
   * Provides upgrade recommendations for unsupported browsers
   * @param {string} browserName - Current browser name
   * @param {string|number} version - Current browser version
   * @returns {Object} Upgrade recommendations
   */
  getUpgradeRecommendations(browserName, version) {
    const browserSupport = this.checkBrowserSupport(browserName, version);
    
    if (browserSupport.supported) {
      return {
        needsUpgrade: false,
        message: 'Your browser is supported'
      };
    }

    const supportedBrowsers = this.getSupportedBrowsers();
    
    return {
      needsUpgrade: true,
      currentBrowser: browserName,
      currentVersion: version,
      message: browserSupport.reason,
      recommendations: [
        {
          type: 'upgrade',
          message: browserSupport.recommendation
        },
        {
          type: 'alternatives',
          message: 'Or switch to a supported browser:',
          browsers: supportedBrowsers.map(browser => 
            `${browser.name} ${browser.minVersion}+`
          )
        }
      ]
    };
  }
}

export default BrowserSupport;