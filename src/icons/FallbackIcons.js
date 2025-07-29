/**
 * @fileoverview Fallback icon system for HTML diagram library
 * This module provides default geometric shapes and icons when external icons
 * cannot be loaded, ensuring diagrams always have visual representations.
 */

/**
 * Fallback icon provider with default geometric shapes for diagram elements
 * Generates SVG-based fallback icons when primary icons are unavailable
 */
export class FallbackIcons {
  /**
   * Creates a new FallbackIcons instance
   * @param {Object} config - Fallback icon configuration
   * @param {number} config.iconSize - Default icon size in pixels (default: 48)
   * @param {string} config.primaryColor - Primary color for icons (default: #2563eb)
   * @param {string} config.secondaryColor - Secondary color for icons (default: #64748b)
   * @param {number} config.strokeWidth - Stroke width for outlined icons (default: 2)
   */
  constructor(config = {}) {
    this.config = {
      iconSize: 48,
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      strokeWidth: 2,
      ...config
    };

    // Initialize icon templates
    this.iconTemplates = this.createIconTemplates();
  }

  /**
   * Gets a fallback icon for the specified element type
   * @param {string} elementType - Type of diagram element
   * @param {Object} [options] - Icon generation options
   * @param {number} options.size - Custom icon size
   * @param {string} options.color - Custom primary color
   * @param {string} options.style - Icon style ('filled', 'outlined', 'minimal')
   * @returns {string} SVG icon data
   */
  getIcon(elementType, options = {}) {
    const iconOptions = {
      size: this.config.iconSize,
      color: this.config.primaryColor,
      style: 'filled',
      ...options
    };

    // Normalize element type
    const normalizedType = this.normalizeElementType(elementType);
    
    // Get icon template
    const template = this.iconTemplates[normalizedType] || this.iconTemplates.default;
    
    // Generate SVG
    return this.generateSVG(template, iconOptions);
  }

  /**
   * Creates icon templates for different element types
   * @returns {Object} Object containing icon templates
   */
  createIconTemplates() {
    return {
      // Microservice icon - hexagon with gear
      microservice: {
        type: 'composite',
        elements: [
          {
            type: 'polygon',
            points: '24,4 40,14 40,34 24,44 8,34 8,14',
            fill: true,
            stroke: true
          },
          {
            type: 'circle',
            cx: 24,
            cy: 24,
            r: 8,
            fill: false,
            stroke: true
          },
          {
            type: 'path',
            d: 'M20,20 L28,20 M20,28 L28,28 M20,24 L28,24',
            fill: false,
            stroke: true
          }
        ]
      },

      // API Gateway icon - diamond with arrows
      'api-gateway': {
        type: 'composite',
        elements: [
          {
            type: 'polygon',
            points: '24,8 40,24 24,40 8,24',
            fill: true,
            stroke: true
          },
          {
            type: 'path',
            d: 'M16,24 L32,24 M28,20 L32,24 L28,28',
            fill: false,
            stroke: true,
            strokeWidth: 2
          }
        ]
      },

      // Database icon - cylinder
      database: {
        type: 'composite',
        elements: [
          {
            type: 'ellipse',
            cx: 24,
            cy: 12,
            rx: 16,
            ry: 4,
            fill: true,
            stroke: true
          },
          {
            type: 'rect',
            x: 8,
            y: 12,
            width: 32,
            height: 24,
            fill: true,
            stroke: false
          },
          {
            type: 'path',
            d: 'M8,12 L8,36 Q8,40 24,40 Q40,40 40,36 L40,12',
            fill: false,
            stroke: true
          },
          {
            type: 'ellipse',
            cx: 24,
            cy: 20,
            rx: 16,
            ry: 4,
            fill: false,
            stroke: true
          },
          {
            type: 'ellipse',
            cx: 24,
            cy: 28,
            rx: 16,
            ry: 4,
            fill: false,
            stroke: true
          }
        ]
      },

      // Cache icon - lightning bolt in circle
      cache: {
        type: 'composite',
        elements: [
          {
            type: 'circle',
            cx: 24,
            cy: 24,
            r: 18,
            fill: true,
            stroke: true
          },
          {
            type: 'path',
            d: 'M18,14 L30,14 L22,24 L30,24 L18,34 L26,24 L18,24 Z',
            fill: true,
            stroke: false,
            fillColor: 'white'
          }
        ]
      },

      // Queue icon - parallel lines with arrow
      queue: {
        type: 'composite',
        elements: [
          {
            type: 'rect',
            x: 8,
            y: 16,
            width: 32,
            height: 16,
            fill: true,
            stroke: true,
            rx: 2
          },
          {
            type: 'path',
            d: 'M12,20 L20,20 M12,24 L20,24 M12,28 L20,28',
            fill: false,
            stroke: true,
            strokeColor: 'white'
          },
          {
            type: 'path',
            d: 'M28,24 L36,24 M32,20 L36,24 L32,28',
            fill: false,
            stroke: true,
            strokeColor: 'white'
          }
        ]
      },

      // Storage icon - folder
      storage: {
        type: 'composite',
        elements: [
          {
            type: 'path',
            d: 'M8,12 L8,36 Q8,40 12,40 L36,40 Q40,40 40,36 L40,16 Q40,12 36,12 L20,12 L16,8 L12,8 Q8,8 8,12 Z',
            fill: true,
            stroke: true
          },
          {
            type: 'path',
            d: 'M8,16 L40,16',
            fill: false,
            stroke: true
          }
        ]
      },

      // CDN icon - globe with network
      cdn: {
        type: 'composite',
        elements: [
          {
            type: 'circle',
            cx: 24,
            cy: 24,
            r: 18,
            fill: false,
            stroke: true
          },
          {
            type: 'path',
            d: 'M6,24 L42,24 M24,6 Q30,24 24,42 Q18,24 24,6',
            fill: false,
            stroke: true
          },
          {
            type: 'circle',
            cx: 24,
            cy: 24,
            r: 3,
            fill: true,
            stroke: false
          }
        ]
      },

      // Load Balancer icon - distribution symbol
      loadbalancer: {
        type: 'composite',
        elements: [
          {
            type: 'rect',
            x: 20,
            y: 8,
            width: 8,
            height: 8,
            fill: true,
            stroke: true
          },
          {
            type: 'circle',
            cx: 12,
            cy: 32,
            r: 4,
            fill: true,
            stroke: true
          },
          {
            type: 'circle',
            cx: 24,
            cy: 40,
            r: 4,
            fill: true,
            stroke: true
          },
          {
            type: 'circle',
            cx: 36,
            cy: 32,
            r: 4,
            fill: true,
            stroke: true
          },
          {
            type: 'path',
            d: 'M24,16 L12,28 M24,16 L24,36 M24,16 L36,28',
            fill: false,
            stroke: true
          }
        ]
      },

      // Monitoring icon - chart/graph
      monitoring: {
        type: 'composite',
        elements: [
          {
            type: 'rect',
            x: 8,
            y: 8,
            width: 32,
            height: 32,
            fill: false,
            stroke: true,
            rx: 2
          },
          {
            type: 'path',
            d: 'M12,32 L16,28 L20,30 L24,24 L28,26 L32,20 L36,22',
            fill: false,
            stroke: true,
            strokeWidth: 2
          },
          {
            type: 'circle',
            cx: 16,
            cy: 28,
            r: 2,
            fill: true,
            stroke: false
          },
          {
            type: 'circle',
            cx: 24,
            cy: 24,
            r: 2,
            fill: true,
            stroke: false
          },
          {
            type: 'circle',
            cx: 32,
            cy: 20,
            r: 2,
            fill: true,
            stroke: false
          }
        ]
      },

      // Logging icon - document with lines
      logging: {
        type: 'composite',
        elements: [
          {
            type: 'rect',
            x: 12,
            y: 8,
            width: 24,
            height: 32,
            fill: true,
            stroke: true,
            rx: 2
          },
          {
            type: 'path',
            d: 'M16,16 L32,16 M16,20 L32,20 M16,24 L28,24 M16,28 L30,28 M16,32 L26,32',
            fill: false,
            stroke: true,
            strokeColor: 'white'
          }
        ]
      },

      // Default icon - simple rectangle
      default: {
        type: 'composite',
        elements: [
          {
            type: 'rect',
            x: 8,
            y: 8,
            width: 32,
            height: 32,
            fill: true,
            stroke: true,
            rx: 4
          },
          {
            type: 'circle',
            cx: 24,
            cy: 24,
            r: 8,
            fill: false,
            stroke: true,
            strokeColor: 'white'
          }
        ]
      }
    };
  }

  /**
   * Generates SVG markup from icon template
   * @param {Object} template - Icon template
   * @param {Object} options - Generation options
   * @returns {string} SVG markup
   */
  generateSVG(template, options) {
    const { size, color, style } = options;
    const strokeColor = style === 'minimal' ? color : this.config.secondaryColor;
    const fillColor = style === 'outlined' ? 'none' : color;

    let svgContent = '';

    for (const element of template.elements) {
      const elementFill = element.fillColor || (element.fill ? fillColor : 'none');
      const elementStroke = element.strokeColor || (element.stroke ? strokeColor : 'none');
      const elementStrokeWidth = element.strokeWidth || this.config.strokeWidth;

      switch (element.type) {
        case 'rect':
          svgContent += `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="${elementFill}" stroke="${elementStroke}" stroke-width="${elementStrokeWidth}"`;
          if (element.rx) svgContent += ` rx="${element.rx}"`;
          svgContent += '/>';
          break;

        case 'circle':
          svgContent += `<circle cx="${element.cx}" cy="${element.cy}" r="${element.r}" fill="${elementFill}" stroke="${elementStroke}" stroke-width="${elementStrokeWidth}"/>`;
          break;

        case 'ellipse':
          svgContent += `<ellipse cx="${element.cx}" cy="${element.cy}" rx="${element.rx}" ry="${element.ry}" fill="${elementFill}" stroke="${elementStroke}" stroke-width="${elementStrokeWidth}"/>`;
          break;

        case 'polygon':
          svgContent += `<polygon points="${element.points}" fill="${elementFill}" stroke="${elementStroke}" stroke-width="${elementStrokeWidth}"/>`;
          break;

        case 'path':
          svgContent += `<path d="${element.d}" fill="${elementFill}" stroke="${elementStroke}" stroke-width="${elementStrokeWidth}"/>`;
          break;
      }
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      ${svgContent}
    </svg>`;
  }

  /**
   * Normalizes element type for consistent icon lookup
   * @param {string} elementType - Original element type
   * @returns {string} Normalized element type
   */
  normalizeElementType(elementType) {
    if (!elementType) return 'default';
    
    const normalized = elementType.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Handle common variations
    const variations = {
      'apigateway': 'api-gateway',
      'gateway': 'api-gateway',
      'db': 'database',
      'postgres': 'database',
      'mysql': 'database',
      'mongodb': 'database',
      'redis': 'cache',
      'memcached': 'cache',
      'rabbitmq': 'queue',
      'kafka': 'queue',
      'sqs': 'queue',
      's3': 'storage',
      'blob': 'storage',
      'cloudfront': 'cdn',
      'cloudflare': 'cdn',
      'nginx': 'loadbalancer',
      'haproxy': 'loadbalancer',
      'grafana': 'monitoring',
      'prometheus': 'monitoring',
      'datadog': 'monitoring',
      'elk': 'logging',
      'splunk': 'logging',
      'service': 'microservice',
      'app': 'microservice',
      'application': 'microservice'
    };

    return variations[normalized] || normalized;
  }

  /**
   * Gets all available fallback icon types
   * @returns {string[]} Array of available icon types
   */
  getAvailableTypes() {
    return Object.keys(this.iconTemplates);
  }

  /**
   * Updates fallback icon configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Adds a custom fallback icon template
   * @param {string} elementType - Element type for the icon
   * @param {Object} template - Icon template definition
   */
  addCustomIcon(elementType, template) {
    const normalizedType = this.normalizeElementType(elementType);
    this.iconTemplates[normalizedType] = template;
  }

  /**
   * Generates a simple geometric shape as fallback
   * @param {string} shape - Shape type ('circle', 'square', 'triangle', 'diamond')
   * @param {Object} options - Generation options
   * @returns {string} SVG markup
   */
  generateSimpleShape(shape, options = {}) {
    const { size = this.config.iconSize, color = this.config.primaryColor } = options;
    
    const templates = {
      circle: {
        type: 'composite',
        elements: [{
          type: 'circle',
          cx: 24,
          cy: 24,
          r: 16,
          fill: true,
          stroke: true
        }]
      },
      square: {
        type: 'composite',
        elements: [{
          type: 'rect',
          x: 8,
          y: 8,
          width: 32,
          height: 32,
          fill: true,
          stroke: true,
          rx: 4
        }]
      },
      triangle: {
        type: 'composite',
        elements: [{
          type: 'polygon',
          points: '24,8 40,36 8,36',
          fill: true,
          stroke: true
        }]
      },
      diamond: {
        type: 'composite',
        elements: [{
          type: 'polygon',
          points: '24,8 40,24 24,40 8,24',
          fill: true,
          stroke: true
        }]
      }
    };

    const template = templates[shape] || templates.circle;
    return this.generateSVG(template, { size, color, style: 'filled' });
  }

  /**
   * Creates a text-based fallback icon
   * @param {string} text - Text to display (usually first letter of element type)
   * @param {Object} options - Generation options
   * @returns {string} SVG markup with text
   */
  generateTextIcon(text, options = {}) {
    const { 
      size = this.config.iconSize, 
      color = this.config.primaryColor,
      textColor = 'white',
      fontSize = 18
    } = options;
    
    const displayText = text.charAt(0).toUpperCase();
    
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" fill="${color}" stroke="${this.config.secondaryColor}" stroke-width="2"/>
      <text x="24" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}">${displayText}</text>
    </svg>`;
  }
}

export default FallbackIcons;