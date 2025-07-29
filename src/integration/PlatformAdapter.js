/**
 * PlatformAdapter - Handles restricted environment compatibility
 * 
 * This module provides platform-specific adaptations and initialization
 * methods for different documentation platforms, with special focus on
 * Content Security Policy compliance and namespace isolation.
 */

import { platformDetector, PLATFORMS } from './PlatformDetector.js';
import { styleIsolation } from './StyleIsolation.js';

/**
 * CSP-compliant event handler registry
 */
const CSP_EVENT_HANDLERS = new Map();

/**
 * Platform-specific initialization strategies
 */
const PLATFORM_STRATEGIES = {
  [PLATFORMS.CONFLUENCE]: {
    requiresCSPCompliance: true,
    requiresNamespacing: true,
    requiresSandboxing: true,
    maxComplexity: 50,
    allowedFeatures: ['basic-rendering', 'static-interaction']
  },
  [PLATFORMS.NOTION]: {
    requiresCSPCompliance: false,
    requiresNamespacing: true,
    requiresSandboxing: false,
    maxComplexity: 100,
    allowedFeatures: ['basic-rendering', 'animations', 'interaction']
  },
  [PLATFORMS.GITBOOK]: {
    requiresCSPCompliance: false,
    requiresNamespacing: false,
    requiresSandboxing: false,
    maxComplexity: 200,
    allowedFeatures: ['full-features']
  },
  [PLATFORMS.GENERIC]: {
    requiresCSPCompliance: false,
    requiresNamespacing: false,
    requiresSandboxing: false,
    maxComplexity: 200,
    allowedFeatures: ['full-features']
  }
};

class PlatformAdapter {
  constructor() {
    this.currentPlatform = null;
    this.platformStrategy = null;
    this.isInitialized = false;
    this.cspCompliant = false;
    this.adaptedContainers = new Set();
  }

  /**
   * Initialize the platform adapter
   * @param {Object} options - Initialization options
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(options = {}) {
    try {
      // Detect current platform
      this.currentPlatform = platformDetector.detectPlatform();
      this.platformStrategy = PLATFORM_STRATEGIES[this.currentPlatform] || PLATFORM_STRATEGIES[PLATFORMS.GENERIC];

      // Validate CSP compliance if required
      if (this.platformStrategy.requiresCSPCompliance) {
        const cspValidation = await this.validateCSP();
        if (!cspValidation.isCompliant) {
          console.warn('CSP compliance issues detected:', cspValidation.violations);
        }
        this.cspCompliant = cspValidation.isCompliant;
      }

      // Apply platform-specific configurations
      const config = this._buildPlatformConfig(options);
      
      this.isInitialized = true;
      
      return {
        success: true,
        platform: this.currentPlatform,
        config,
        cspCompliant: this.cspCompliant,
        features: this.platformStrategy.allowedFeatures
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        platform: this.currentPlatform
      };
    }
  }

  /**
   * Initialize specifically for Confluence with CSP compliance and namespace isolation
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Confluence-specific options
   * @returns {Promise<Object>} Initialization result
   */
  async initializeInConfluence(container, options = {}) {
    if (!container) {
      throw new Error('Container element is required for Confluence initialization');
    }

    try {
      // Ensure we're in Confluence
      if (!platformDetector.isPlatform(PLATFORMS.CONFLUENCE)) {
        console.warn('initializeInConfluence called but Confluence not detected');
      }

      // Validate CSP compliance
      const cspValidation = await this.validateCSP();
      if (!cspValidation.isCompliant) {
        throw new Error(`CSP compliance required for Confluence: ${cspValidation.violations.join(', ')}`);
      }

      // Apply namespace isolation
      const isolatedContainer = styleIsolation.isolateContainer(container, {
        useShadowDOM: false, // Confluence often blocks Shadow DOM
        useNamespacing: true,
        resetStyles: true,
        preventInheritance: true
      });

      // Set up CSP-compliant event handling
      this._setupCSPCompliantEvents(isolatedContainer);

      // Apply Confluence-specific restrictions
      const confluenceConfig = {
        maxNodes: 50,
        animationsEnabled: false,
        interactionEnabled: true,
        externalIconsEnabled: false,
        namespace: `confluence-${Date.now()}` // Unique namespace per instance
      };

      // Store adapted container
      this.adaptedContainers.add(isolatedContainer);

      return {
        success: true,
        container: isolatedContainer,
        config: confluenceConfig,
        cspCompliant: true,
        restrictions: {
          maxComplexity: 50,
          noAnimations: true,
          noExternalResources: true,
          namespaceRequired: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        container: null
      };
    }
  }

  /**
   * Validate Content Security Policy compliance
   * @returns {Promise<Object>} CSP validation result
   */
  async validateCSP() {
    const violations = [];
    const warnings = [];

    try {
      // Test inline script execution (should be blocked by CSP)
      await this._testInlineScripts(violations);
      
      // Test external resource loading
      await this._testExternalResources(violations, warnings);
      
      // Test eval usage (should be blocked by CSP)
      await this._testEvalUsage(violations);
      
      // Test unsafe inline styles
      await this._testInlineStyles(violations, warnings);

      return {
        isCompliant: violations.length === 0,
        violations,
        warnings,
        recommendations: this._getCSPRecommendations(violations)
      };
    } catch (error) {
      return {
        isCompliant: false,
        violations: [`CSP validation failed: ${error.message}`],
        warnings: [],
        recommendations: ['Ensure CSP headers are properly configured']
      };
    }
  }

  /**
   * Get platform-specific configuration
   * @returns {Object} Platform configuration
   */
  getPlatformConfig() {
    if (!this.isInitialized) {
      throw new Error('PlatformAdapter must be initialized before getting config');
    }
    return this._buildPlatformConfig();
  }

  /**
   * Check if a feature is allowed on the current platform
   * @param {string} feature - Feature to check
   * @returns {boolean} True if feature is allowed
   */
  isFeatureAllowed(feature) {
    if (!this.platformStrategy) {
      return true; // Allow all features if no strategy defined
    }
    
    const allowedFeatures = this.platformStrategy.allowedFeatures;
    return allowedFeatures.includes('full-features') || allowedFeatures.includes(feature);
  }

  /**
   * Clean up platform adaptations
   */
  cleanup() {
    // Clean up isolated containers
    for (const container of this.adaptedContainers) {
      styleIsolation.removeIsolation(container);
    }
    this.adaptedContainers.clear();

    // Clean up CSP event handlers
    CSP_EVENT_HANDLERS.clear();

    // Reset state
    this.isInitialized = false;
    this.cspCompliant = false;
  }

  /**
   * Build platform-specific configuration
   * @private
   * @param {Object} userOptions - User-provided options
   * @returns {Object} Platform configuration
   */
  _buildPlatformConfig(userOptions = {}) {
    const platformConfig = platformDetector.getPlatformConfig();
    const strategyConfig = this.platformStrategy || {};

    return {
      // Platform detection results
      platform: this.currentPlatform,
      
      // Style isolation settings
      useNamespacing: strategyConfig.requiresNamespacing || platformConfig.useNamespacing,
      useShadowDOM: !strategyConfig.requiresSandboxing && this._supportsShadowDOM(),
      
      // Performance settings
      maxNodes: Math.min(
        strategyConfig.maxComplexity || 200,
        platformConfig.maxNodes || 200,
        userOptions.maxNodes || 200
      ),
      
      // Feature flags
      animationsEnabled: this.isFeatureAllowed('animations') && 
                        (platformConfig.animationsEnabled !== false),
      interactionEnabled: this.isFeatureAllowed('interaction'),
      externalResourcesEnabled: !strategyConfig.requiresCSPCompliance,
      
      // CSP compliance
      cspCompliant: this.cspCompliant,
      requiresCSPCompliance: strategyConfig.requiresCSPCompliance || false,
      
      // Namespace configuration
      namespace: userOptions.namespace || `html-diagram-${this.currentPlatform}-${Date.now()}`,
      
      // Override with user options
      ...userOptions
    };
  }

  /**
   * Set up CSP-compliant event handling
   * @private
   * @param {HTMLElement} container - Container element
   */
  _setupCSPCompliantEvents(container) {
    // Use event delegation instead of inline handlers
    const eventHandler = (event) => {
      const target = event.target;
      const handlerName = target.getAttribute('data-diagram-handler');
      
      if (handlerName && CSP_EVENT_HANDLERS.has(handlerName)) {
        const handler = CSP_EVENT_HANDLERS.get(handlerName);
        handler(event);
      }
    };

    // Add delegated event listeners
    container.addEventListener('click', eventHandler);
    container.addEventListener('mouseover', eventHandler);
    container.addEventListener('mouseout', eventHandler);
  }

  /**
   * Test inline script execution for CSP compliance
   * @private
   * @param {Array} violations - Violations array to populate
   */
  async _testInlineScripts(violations) {
    return new Promise((resolve) => {
      try {
        const script = document.createElement('script');
        script.textContent = 'window.__cspTestInline = true;';
        
        script.onerror = () => {
          // Good - inline scripts are blocked
          resolve();
        };
        
        script.onload = () => {
          if (window.__cspTestInline) {
            violations.push('Inline scripts are allowed (CSP violation)');
            delete window.__cspTestInline;
          }
          resolve();
        };
        
        document.head.appendChild(script);
        document.head.removeChild(script);
      } catch (error) {
        // Good - inline scripts are blocked
        resolve();
      }
    });
  }

  /**
   * Test external resource loading
   * @private
   * @param {Array} violations - Violations array
   * @param {Array} warnings - Warnings array
   */
  async _testExternalResources(violations, warnings) {
    // Test if we can load external images (common CSP restriction)
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        warnings.push('External images are allowed - consider restricting for security');
        resolve();
      };
      img.onerror = () => {
        violations.push('External resources are blocked by CSP');
        resolve();
      };
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    });
  }

  /**
   * Test eval usage for CSP compliance
   * @private
   * @param {Array} violations - Violations array
   */
  async _testEvalUsage(violations) {
    try {
      eval('1 + 1'); // This should be blocked by CSP
      violations.push('eval() is allowed (CSP violation)');
    } catch (error) {
      // Good - eval is blocked
    }
  }

  /**
   * Test inline styles for CSP compliance
   * @private
   * @param {Array} violations - Violations array
   * @param {Array} warnings - Warnings array
   */
  async _testInlineStyles(violations, warnings) {
    try {
      const div = document.createElement('div');
      div.style.cssText = 'color: red;';
      
      if (div.style.color === 'red') {
        warnings.push('Inline styles are allowed - consider using CSP style-src restrictions');
      }
    } catch (error) {
      violations.push('Inline styles are blocked by CSP');
    }
  }

  /**
   * Get CSP compliance recommendations
   * @private
   * @param {Array} violations - CSP violations
   * @returns {Array} Recommendations
   */
  _getCSPRecommendations(violations) {
    const recommendations = [];
    
    if (violations.some(v => v.includes('inline scripts'))) {
      recommendations.push('Use external script files or nonce-based CSP for scripts');
    }
    
    if (violations.some(v => v.includes('external resources'))) {
      recommendations.push('Configure CSP to allow necessary external resources');
    }
    
    if (violations.some(v => v.includes('eval'))) {
      recommendations.push('Avoid eval() usage, use safer alternatives');
    }
    
    return recommendations;
  }

  /**
   * Check if Shadow DOM is supported
   * @private
   * @returns {boolean} True if Shadow DOM is supported
   */
  _supportsShadowDOM() {
    return 'attachShadow' in Element.prototype;
  }
}

/**
 * Register a CSP-compliant event handler
 * @param {string} name - Handler name
 * @param {Function} handler - Event handler function
 */
export function registerCSPHandler(name, handler) {
  CSP_EVENT_HANDLERS.set(name, handler);
}

/**
 * Unregister a CSP-compliant event handler
 * @param {string} name - Handler name
 */
export function unregisterCSPHandler(name) {
  CSP_EVENT_HANDLERS.delete(name);
}

// Export singleton instance
const platformAdapter = new PlatformAdapter();

export { platformAdapter, PLATFORMS };
export default PlatformAdapter;