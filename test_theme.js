/**
 * Simple test to verify theme module functionality
 */

import { ThemeManager, DefaultTheme, validateTheme } from './src/themes/index.js';

// Test 1: ThemeManager initialization
console.log('Testing ThemeManager initialization...');
try {
  const themeManager = new ThemeManager();
  console.log('✓ ThemeManager created successfully');
  console.log('✓ Default theme loaded:', themeManager.getTheme().colors.primary);
} catch (error) {
  console.error('✗ ThemeManager initialization failed:', error.message);
}

// Test 2: Theme validation
console.log('\nTesting theme validation...');
try {
  const validationResult = validateTheme(DefaultTheme);
  if (validationResult.isValid) {
    console.log('✓ Default theme validation passed');
  } else {
    console.error('✗ Default theme validation failed:', validationResult.errors);
  }
} catch (error) {
  console.error('✗ Theme validation error:', error.message);
}

// Test 3: Custom theme application
console.log('\nTesting custom theme application...');
try {
  const customTheme = {
    colors: {
      primary: '#ff0000',
      background: '#f0f0f0',
      text: '#333333',
      border: '#cccccc'
    },
    nodeStyles: {
      default: {
        width: 120,
        height: 80,
        borderRadius: 8,
        borderWidth: 2,
        backgroundColor: '#ffffff'
      },
      microservice: {
        backgroundColor: '#ffe0e0',
        borderColor: '#ff0000'
      }
    }
  };
  
  const themeManager = new ThemeManager();
  themeManager.setTheme(customTheme);
  const appliedTheme = themeManager.getTheme();
  
  if (appliedTheme.colors.primary === '#ff0000') {
    console.log('✓ Custom theme applied successfully');
  } else {
    console.error('✗ Custom theme not applied correctly');
  }
} catch (error) {
  console.error('✗ Custom theme application failed:', error.message);
}

// Test 4: Node and edge style retrieval
console.log('\nTesting style retrieval...');
try {
  const themeManager = new ThemeManager();
  const nodeStyle = themeManager.getNodeStyle('microservice');
  const edgeStyle = themeManager.getEdgeStyle('connection');
  
  if (nodeStyle && edgeStyle) {
    console.log('✓ Style retrieval working');
    console.log('  - Microservice background:', nodeStyle.backgroundColor);
    console.log('  - Connection stroke:', edgeStyle.strokeColor);
  } else {
    console.error('✗ Style retrieval failed');
  }
} catch (error) {
  console.error('✗ Style retrieval error:', error.message);
}

console.log('\nTheme module test completed!');