/**
 * Theme configuration validation for HTML Diagram Library
 * Validates theme objects and provides helpful error messages
 */

/**
 * Validates a complete theme configuration object
 * @param {Object} theme - Theme configuration to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateTheme(theme) {
  const errors = [];
  const warnings = [];
  
  if (!theme || typeof theme !== 'object') {
    return {
      isValid: false,
      errors: ['Theme must be a valid object'],
      warnings: []
    };
  }
  
  // Validate colors section
  if (theme.colors) {
    const colorErrors = validateColors(theme.colors);
    errors.push(...colorErrors);
  } else {
    warnings.push('No colors section found in theme');
  }
  
  // Validate fonts section
  if (theme.fonts) {
    const fontErrors = validateFonts(theme.fonts);
    errors.push(...fontErrors);
  } else {
    warnings.push('No fonts section found in theme');
  }
  
  // Validate nodeStyles section
  if (theme.nodeStyles) {
    const nodeStyleErrors = validateNodeStyles(theme.nodeStyles);
    errors.push(...nodeStyleErrors);
  } else {
    warnings.push('No nodeStyles section found in theme');
  }
  
  // Validate edgeStyles section
  if (theme.edgeStyles) {
    const edgeStyleErrors = validateEdgeStyles(theme.edgeStyles);
    errors.push(...edgeStyleErrors);
  } else {
    warnings.push('No edgeStyles section found in theme');
  }
  
  // Validate animations section
  if (theme.animations) {
    const animationErrors = validateAnimations(theme.animations);
    errors.push(...animationErrors);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates color definitions in theme
 * @param {Object} colors - Colors object to validate
 * @returns {Array} Array of error messages
 */
function validateColors(colors) {
  const errors = [];
  const requiredColors = ['primary', 'background', 'text', 'border'];
  
  requiredColors.forEach(colorKey => {
    if (!colors[colorKey]) {
      errors.push(`Required color '${colorKey}' is missing`);
    } else if (!isValidColor(colors[colorKey])) {
      errors.push(`Invalid color value for '${colorKey}': ${colors[colorKey]}`);
    }
  });
  
  // Validate all color values
  Object.entries(colors).forEach(([key, value]) => {
    if (!isValidColor(value)) {
      errors.push(`Invalid color value for '${key}': ${value}`);
    }
  });
  
  return errors;
}

/**
 * Validates font definitions in theme
 * @param {Object} fonts - Fonts object to validate
 * @returns {Array} Array of error messages
 */
function validateFonts(fonts) {
  const errors = [];
  
  if (fonts.primary) {
    if (!fonts.primary.family || typeof fonts.primary.family !== 'string') {
      errors.push('Primary font family must be a string');
    }
    
    if (fonts.primary.sizes) {
      Object.entries(fonts.primary.sizes).forEach(([size, value]) => {
        if (!isValidSize(value)) {
          errors.push(`Invalid font size for '${size}': ${value}`);
        }
      });
    }
    
    if (fonts.primary.weights) {
      Object.entries(fonts.primary.weights).forEach(([weight, value]) => {
        if (!isValidFontWeight(value)) {
          errors.push(`Invalid font weight for '${weight}': ${value}`);
        }
      });
    }
  }
  
  return errors;
}

/**
 * Validates node style definitions in theme
 * @param {Object} nodeStyles - Node styles object to validate
 * @returns {Array} Array of error messages
 */
function validateNodeStyles(nodeStyles) {
  const errors = [];
  
  if (!nodeStyles.default) {
    errors.push('Default node style is required');
  } else {
    const defaultErrors = validateNodeStyle(nodeStyles.default, 'default');
    errors.push(...defaultErrors);
  }
  
  // Validate other node styles
  Object.entries(nodeStyles).forEach(([styleKey, style]) => {
    if (styleKey !== 'default') {
      const styleErrors = validateNodeStyle(style, styleKey);
      errors.push(...styleErrors);
    }
  });
  
  return errors;
}

/**
 * Validates a single node style object
 * @param {Object} style - Node style to validate
 * @param {string} styleName - Name of the style for error messages
 * @returns {Array} Array of error messages
 */
function validateNodeStyle(style, styleName) {
  const errors = [];
  
  if (style.width !== undefined && (!isValidSize(style.width) && typeof style.width !== 'number')) {
    errors.push(`Invalid width for node style '${styleName}': ${style.width}`);
  }
  
  if (style.height !== undefined && (!isValidSize(style.height) && typeof style.height !== 'number')) {
    errors.push(`Invalid height for node style '${styleName}': ${style.height}`);
  }
  
  if (style.borderRadius !== undefined && (!isValidSize(style.borderRadius) && typeof style.borderRadius !== 'number')) {
    errors.push(`Invalid borderRadius for node style '${styleName}': ${style.borderRadius}`);
  }
  
  if (style.borderWidth !== undefined && typeof style.borderWidth !== 'number') {
    errors.push(`Invalid borderWidth for node style '${styleName}': ${style.borderWidth}`);
  }
  
  if (style.borderColor !== undefined && !isValidColor(style.borderColor)) {
    errors.push(`Invalid borderColor for node style '${styleName}': ${style.borderColor}`);
  }
  
  if (style.backgroundColor !== undefined && !isValidColor(style.backgroundColor)) {
    errors.push(`Invalid backgroundColor for node style '${styleName}': ${style.backgroundColor}`);
  }
  
  return errors;
}

/**
 * Validates edge style definitions in theme
 * @param {Object} edgeStyles - Edge styles object to validate
 * @returns {Array} Array of error messages
 */
function validateEdgeStyles(edgeStyles) {
  const errors = [];
  
  if (!edgeStyles.default) {
    errors.push('Default edge style is required');
  } else {
    const defaultErrors = validateEdgeStyle(edgeStyles.default, 'default');
    errors.push(...defaultErrors);
  }
  
  // Validate other edge styles
  Object.entries(edgeStyles).forEach(([styleKey, style]) => {
    if (styleKey !== 'default') {
      const styleErrors = validateEdgeStyle(style, styleKey);
      errors.push(...styleErrors);
    }
  });
  
  return errors;
}

/**
 * Validates a single edge style object
 * @param {Object} style - Edge style to validate
 * @param {string} styleName - Name of the style for error messages
 * @returns {Array} Array of error messages
 */
function validateEdgeStyle(style, styleName) {
  const errors = [];
  
  if (style.strokeWidth !== undefined && typeof style.strokeWidth !== 'number') {
    errors.push(`Invalid strokeWidth for edge style '${styleName}': ${style.strokeWidth}`);
  }
  
  if (style.strokeColor !== undefined && !isValidColor(style.strokeColor)) {
    errors.push(`Invalid strokeColor for edge style '${styleName}': ${style.strokeColor}`);
  }
  
  if (style.opacity !== undefined && (typeof style.opacity !== 'number' || style.opacity < 0 || style.opacity > 1)) {
    errors.push(`Invalid opacity for edge style '${styleName}': ${style.opacity}`);
  }
  
  return errors;
}

/**
 * Validates animation definitions in theme
 * @param {Object} animations - Animations object to validate
 * @returns {Array} Array of error messages
 */
function validateAnimations(animations) {
  const errors = [];
  
  if (animations.duration) {
    Object.entries(animations.duration).forEach(([key, value]) => {
      if (typeof value !== 'number' || value < 0) {
        errors.push(`Invalid animation duration for '${key}': ${value}`);
      }
    });
  }
  
  if (animations.easing) {
    Object.entries(animations.easing).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        errors.push(`Invalid easing function for '${key}': ${value}`);
      }
    });
  }
  
  return errors;
}

/**
 * Validates if a string is a valid CSS color
 * @param {string} color - Color string to validate
 * @returns {boolean} True if valid color
 */
function isValidColor(color) {
  if (typeof color !== 'string') return false;
  
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) return true;
  
  // Check for rgb/rgba colors
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) return true;
  
  // Check for hsl/hsla colors
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/.test(color)) return true;
  
  // Check for named colors (basic validation)
  const namedColors = [
    'transparent', 'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink',
    'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy', 'teal', 'silver', 'maroon'
  ];
  
  return namedColors.includes(color.toLowerCase());
}

/**
 * Validates if a string is a valid CSS size
 * @param {string|number} size - Size value to validate
 * @returns {boolean} True if valid size
 */
function isValidSize(size) {
  if (typeof size === 'number') return size >= 0;
  if (typeof size !== 'string') return false;
  
  // Check for valid CSS units
  return /^\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch)$/.test(size);
}

/**
 * Validates if a value is a valid font weight
 * @param {string|number} weight - Font weight to validate
 * @returns {boolean} True if valid font weight
 */
function isValidFontWeight(weight) {
  if (typeof weight === 'number') {
    return weight >= 100 && weight <= 900 && weight % 100 === 0;
  }
  
  if (typeof weight === 'string') {
    const validWeights = ['normal', 'bold', 'bolder', 'lighter'];
    return validWeights.includes(weight.toLowerCase());
  }
  
  return false;
}

/**
 * Merges a custom theme with the default theme
 * @param {Object} defaultTheme - Default theme object
 * @param {Object} customTheme - Custom theme overrides
 * @returns {Object} Merged theme object
 */
export function mergeThemes(defaultTheme, customTheme) {
  if (!customTheme) return defaultTheme;
  
  const merged = JSON.parse(JSON.stringify(defaultTheme)); // Deep clone
  
  // Deep merge function
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  deepMerge(merged, customTheme);
  return merged;
}

export default {
  validateTheme,
  mergeThemes
};