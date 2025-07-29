/**
 * Default theme configuration for HTML Diagram Library
 * Provides colors, fonts, and element appearance definitions
 */

export const DefaultTheme = {
  // Color palette
  colors: {
    // Primary colors for different element types
    microservice: '#4A90E2',
    apiGateway: '#7ED321',
    database: '#F5A623',
    loadBalancer: '#9013FE',
    cache: '#FF6B6B',
    queue: '#50E3C2',
    
    // State colors
    primary: '#4A90E2',
    secondary: '#7ED321',
    success: '#7ED321',
    warning: '#F5A623',
    error: '#D0021B',
    info: '#4A90E2',
    
    // Neutral colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    border: '#E1E5E9',
    text: '#2C3E50',
    textSecondary: '#6C757D',
    textMuted: '#ADB5BD',
    
    // Connection colors
    connection: '#6C757D',
    connectionHover: '#495057',
    hierarchy: '#ADB5BD',
    
    // Interactive states
    hover: '#E3F2FD',
    selected: '#BBDEFB',
    focus: '#2196F3'
  },
  
  // Typography
  fonts: {
    primary: {
      family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      sizes: {
        xs: '10px',
        sm: '12px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        xxl: '20px'
      },
      weights: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    monospace: {
      family: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    }
  },
  
  // Node styling
  nodeStyles: {
    default: {
      width: 120,
      height: 80,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#E1E5E9',
      backgroundColor: '#FFFFFF',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowBlur: 4,
      shadowOffset: { x: 0, y: 2 }
    },
    
    microservice: {
      backgroundColor: '#E3F2FD',
      borderColor: '#4A90E2',
      iconColor: '#4A90E2'
    },
    
    'api-gateway': {
      backgroundColor: '#F1F8E9',
      borderColor: '#7ED321',
      iconColor: '#7ED321'
    },
    
    database: {
      backgroundColor: '#FFF8E1',
      borderColor: '#F5A623',
      iconColor: '#F5A623',
      shape: 'cylinder'
    },
    
    'load-balancer': {
      backgroundColor: '#F3E5F5',
      borderColor: '#9013FE',
      iconColor: '#9013FE'
    },
    
    cache: {
      backgroundColor: '#FFEBEE',
      borderColor: '#FF6B6B',
      iconColor: '#FF6B6B'
    },
    
    queue: {
      backgroundColor: '#E0F2F1',
      borderColor: '#50E3C2',
      iconColor: '#50E3C2'
    }
  },
  
  // Edge styling
  edgeStyles: {
    default: {
      strokeWidth: 2,
      strokeColor: '#6C757D',
      strokeDasharray: 'none',
      markerEnd: 'url(#arrowhead)',
      opacity: 0.8
    },
    
    connection: {
      strokeColor: '#6C757D',
      strokeWidth: 2,
      markerEnd: 'url(#arrowhead)'
    },
    
    hierarchy: {
      strokeColor: '#ADB5BD',
      strokeWidth: 1,
      strokeDasharray: '5,5',
      markerEnd: 'none'
    },
    
    bidirectional: {
      strokeColor: '#495057',
      strokeWidth: 2,
      markerEnd: 'url(#arrowhead)',
      markerStart: 'url(#arrowhead)'
    }
  },
  
  // Icon styling
  iconStyles: {
    size: {
      sm: 16,
      md: 24,
      lg: 32,
      xl: 40
    },
    
    default: {
      size: 24,
      color: '#6C757D',
      opacity: 1
    }
  },
  
  // Animation settings
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500
    },
    
    easing: {
      ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
      easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)'
    },
    
    transitions: {
      position: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
      color: 'all 0.15s ease',
      opacity: 'opacity 0.15s ease',
      transform: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
    }
  },
  
  // Layout spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  // Interactive states
  states: {
    hover: {
      opacity: 0.8,
      transform: 'scale(1.02)',
      shadowBlur: 8,
      shadowOffset: { x: 0, y: 4 }
    },
    
    selected: {
      borderWidth: 3,
      shadowBlur: 12,
      shadowColor: 'rgba(66, 150, 243, 0.3)'
    },
    
    focus: {
      outline: '2px solid #2196F3',
      outlineOffset: 2
    },
    
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  
  // Tooltip styling
  tooltip: {
    backgroundColor: 'rgba(33, 37, 41, 0.9)',
    color: '#FFFFFF',
    fontSize: '12px',
    padding: '8px 12px',
    borderRadius: 4,
    maxWidth: 200,
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  }
};

export default DefaultTheme;