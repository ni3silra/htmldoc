# Troubleshooting Guide

## Common Issues and Solutions

### Installation and Setup Issues

#### Issue: Library not loading
**Symptoms:** JavaScript errors about DiagramLibrary not being defined

**Solutions:**
1. Ensure the script tag is correctly placed:
   ```html
   <script src="path/to/html-diagram-library.js"></script>
   ```

2. Check that the file path is correct and accessible

3. Verify the script loads before your initialization code:
   ```html
   <script src="html-diagram-library.js"></script>
   <script>
     // Your diagram code here
     const diagram = new DiagramLibrary({...});
   </script>
   ```

4. Check browser console for network errors or CORS issues

#### Issue: CDN loading failures
**Symptoms:** Script fails to load from CDN

**Solutions:**
1. Use a reliable CDN with fallback:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/html-diagram-library@latest/dist/html-diagram-library.min.js"></script>
   <script>
     if (typeof DiagramLibrary === 'undefined') {
       document.write('<script src="./local/html-diagram-library.js"><\/script>');
     }
   </script>
   ```

2. Download and host the library locally for critical applications

### Parsing and Validation Errors

#### Issue: Elements not recognized
**Symptoms:** Diagram appears empty or shows parsing errors

**Solutions:**
1. Check element names are correct:
   ```html
   <!-- Correct -->
   <microservice name="My Service"></microservice>
   
   <!-- Incorrect -->
   <micro-service name="My Service"></micro-service>
   ```

2. Ensure required attributes are present:
   ```html
   <!-- Missing required 'name' attribute -->
   <microservice brand="spring-boot"></microservice>
   
   <!-- Correct -->
   <microservice name="User Service" brand="spring-boot"></microservice>
   ```

3. Validate HTML structure:
   ```html
   <!-- Self-closing tags are fine -->
   <database name="User DB" brand="postgresql" />
   
   <!-- Or use proper closing tags -->
   <database name="User DB" brand="postgresql"></database>
   ```

#### Issue: Connection errors
**Symptoms:** Elements appear but connections are missing

**Solutions:**
1. Verify ID references in connects attribute:
   ```html
   <microservice name="Service A" connects="service-b" id="service-a"></microservice>
   <microservice name="Service B" id="service-b"></microservice>
   ```

2. Check for typos in connection IDs:
   ```html
   <!-- Typo in connects attribute -->
   <microservice connects="user-databse" id="user-service"></microservice>
   <database id="user-database"></database>
   
   <!-- Correct -->
   <microservice connects="user-database" id="user-service"></microservice>
   <database id="user-database"></database>
   ```

3. Ensure connected elements exist:
   ```html
   <!-- This will cause an error - 'missing-service' doesn't exist -->
   <api-gateway connects="user-service,missing-service"></api-gateway>
   <microservice id="user-service"></microservice>
   ```

### Layout and Rendering Issues

#### Issue: Overlapping elements
**Symptoms:** Diagram elements overlap or cluster together

**Solutions:**
1. Adjust force parameters:
   ```javascript
   const diagram = new DiagramLibrary({
     layout: {
       nodeRepulsion: 500,    // Increase to push nodes apart
       linkDistance: 150,     // Increase for more spacing
       forceStrength: 0.3     // Adjust overall force strength
     }
   });
   ```

2. Increase container size:
   ```css
   #diagram-container {
     width: 1200px;
     height: 800px;
   }
   ```

3. For large diagrams, enable performance optimizations:
   ```javascript
   const diagram = new DiagramLibrary({
     performance: {
       maxNodes: 100,
       lazyLoading: true,
       renderThrottle: 32
     }
   });
   ```

#### Issue: Layout not stabilizing
**Symptoms:** Elements keep moving, animation never stops

**Solutions:**
1. Increase iteration limit:
   ```javascript
   const diagram = new DiagramLibrary({
     layout: {
       iterations: 1000,
       stabilizationThreshold: 0.01
     }
   });
   ```

2. Reduce force strength for stability:
   ```javascript
   const diagram = new DiagramLibrary({
     layout: {
       forceStrength: 0.1,
       centerForce: 0.05
     }
   });
   ```

3. Use manual stabilization:
   ```javascript
   diagram.render(htmlContent).then(() => {
     return diagram.stabilizeLayout();
   });
   ```

### Icon and Styling Issues

#### Issue: Icons not displaying
**Symptoms:** Elements show without icons or with placeholder icons

**Solutions:**
1. Check icon configuration:
   ```javascript
   const diagram = new DiagramLibrary({
     icons: {
       iconSources: {
         'spring-boot': '/icons/spring-boot.svg',
         'nodejs': '/icons/nodejs.svg'
       },
       fallbackIcon: 'default-component',
       externalSources: [
         'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/'
       ]
     }
   });
   ```

2. Verify icon file paths and accessibility

3. Enable fallback icons:
   ```javascript
   const diagram = new DiagramLibrary({
     icons: {
       enableFallbacks: true,
       fallbackIcon: 'generic-component'
     }
   });
   ```

4. Check for CORS issues with external icon sources

#### Issue: Styling conflicts
**Symptoms:** Diagram styles conflict with page styles

**Solutions:**
1. Use CSS isolation:
   ```css
   .diagram-container {
     isolation: isolate;
   }
   
   .diagram-container * {
     box-sizing: border-box;
   }
   ```

2. Apply custom theme to override conflicts:
   ```javascript
   const diagram = new DiagramLibrary({
     theme: {
       nodeStyles: {
         microservice: {
           fontFamily: 'Arial, sans-serif',
           fontSize: '12px'
         }
       }
     }
   });
   ```

3. Use CSS specificity:
   ```css
   #my-diagram .diagram-node {
     font-family: Arial !important;
   }
   ```

### Performance Issues

#### Issue: Slow rendering with large diagrams
**Symptoms:** Long loading times, browser freezing

**Solutions:**
1. Enable performance optimizations:
   ```javascript
   const diagram = new DiagramLibrary({
     performance: {
       maxNodes: 50,
       lazyLoading: true,
       renderThrottle: 16,
       enableVirtualization: true
     }
   });
   ```

2. Use progressive rendering:
   ```javascript
   diagram.renderProgressive(htmlContent, {
     batchSize: 10,
     batchDelay: 50
   });
   ```

3. Implement diagram pagination for very large architectures

#### Issue: Memory leaks
**Symptoms:** Browser memory usage increases over time

**Solutions:**
1. Properly destroy diagrams:
   ```javascript
   // When done with diagram
   diagram.destroy();
   ```

2. Remove event listeners:
   ```javascript
   diagram.off('node:click');
   diagram.off('layout:complete');
   ```

3. Clear references:
   ```javascript
   diagram = null;
   ```

### Browser Compatibility Issues

#### Issue: Diagram not working in older browsers
**Symptoms:** JavaScript errors, missing features

**Solutions:**
1. Check browser support requirements:
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

2. Include polyfills for older browsers:
   ```html
   <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
   <script src="html-diagram-library.js"></script>
   ```

3. Use feature detection:
   ```javascript
   if (typeof SVGElement !== 'undefined' && 'classList' in document.createElement('div')) {
     // Browser supports required features
     const diagram = new DiagramLibrary({...});
   } else {
     // Show fallback content
     document.getElementById('diagram').innerHTML = '<p>Browser not supported</p>';
   }
   ```

#### Issue: Touch interactions not working on mobile
**Symptoms:** Zoom/pan doesn't work on tablets/phones

**Solutions:**
1. Enable touch support:
   ```javascript
   const diagram = new DiagramLibrary({
     interaction: {
       enableTouch: true,
       touchSensitivity: 1.5
     }
   });
   ```

2. Add viewport meta tag:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
   ```

3. Handle touch events properly:
   ```javascript
   diagram.on('touch:start', (event) => {
     event.preventDefault();
   });
   ```

### Documentation Platform Integration Issues

#### Issue: Diagram not working in Confluence
**Symptoms:** Blank space where diagram should appear

**Solutions:**
1. Use HTML macro in Confluence:
   ```html
   <div id="architecture-diagram" style="width: 100%; height: 600px;">
     <!-- Your diagram HTML here -->
   </div>
   <script src="https://cdn.example.com/html-diagram-library.js"></script>
   <script>
     // Initialization code
   </script>
   ```

2. Check Content Security Policy (CSP) restrictions

3. Use inline scripts if external scripts are blocked:
   ```html
   <script>
     // Inline the entire library if needed
   </script>
   ```

#### Issue: Styles not applying in documentation platforms
**Symptoms:** Diagram appears unstyled or with wrong colors

**Solutions:**
1. Use inline styles:
   ```javascript
   const diagram = new DiagramLibrary({
     theme: {
       inlineStyles: true,
       nodeStyles: {
         microservice: {
           fill: '#4CAF50 !important'
         }
       }
     }
   });
   ```

2. Increase CSS specificity:
   ```css
   .confluence-content .diagram-node {
     fill: #4CAF50 !important;
   }
   ```

## Debugging Tips

### Enable Debug Mode
```javascript
const diagram = new DiagramLibrary({
  debug: true,
  logging: {
    level: 'debug',
    showTimings: true
  }
});
```

### Check Console Output
Look for these types of messages:
- Parse errors: Invalid HTML or missing attributes
- Layout warnings: Performance or convergence issues
- Render errors: SVG generation or icon loading failures

### Validate Configuration
```javascript
// Check if configuration is valid
diagram.validateConfig().then(result => {
  if (!result.isValid) {
    console.error('Configuration errors:', result.errors);
  }
});
```

### Export Debug Information
```javascript
// Get detailed diagram state for debugging
const debugInfo = diagram.getDebugInfo();
console.log('Nodes:', debugInfo.nodes);
console.log('Edges:', debugInfo.edges);
console.log('Layout state:', debugInfo.layout);
```

## Getting Help

### Community Resources
- GitHub Issues: Report bugs and request features
- Stack Overflow: Tag questions with `html-diagram-library`
- Documentation: Check the API reference for detailed information

### Reporting Issues
When reporting issues, please include:
1. Browser version and operating system
2. Library version
3. Minimal HTML example that reproduces the issue
4. Console error messages
5. Expected vs actual behavior

### Performance Profiling
Use browser dev tools to profile performance:
1. Open Chrome DevTools
2. Go to Performance tab
3. Record while rendering diagram
4. Look for long-running tasks or memory leaks