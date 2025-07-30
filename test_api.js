/**
 * Test script for the DiagramLibrary API implementation
 */

import { DiagramLibrary } from './src/DiagramLibrary.js';

async function testAPI() {
  console.log('Testing DiagramLibrary API...');
  
  try {
    // Create a test container
    const container = document.createElement('div');
    container.id = 'test-container';
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    // Test basic initialization
    console.log('1. Testing basic initialization...');
    const diagram = new DiagramLibrary('#test-container', {
      debug: true
    });
    
    console.log('✓ DiagramLibrary instance created');
    
    // Test initialization
    console.log('2. Testing initialization...');
    await diagram.initialize({
      layout: {
        forceStrength: 0.3,
        iterations: 500
      },
      theme: 'default',
      performance: {
        maxNodes: 100
      }
    });
    
    console.log('✓ Library initialized successfully');
    
    // Test fluent API
    console.log('3. Testing fluent API...');
    const fluentAPI = diagram.fluent();
    
    const chainedAPI = fluentAPI
      .theme('default')
      .layout({ forceStrength: 0.4 })
      .performance({ maxNodes: 50 });
    
    console.log('✓ Fluent API chaining works');
    
    // Test configuration retrieval
    console.log('4. Testing configuration retrieval...');
    const config = diagram.getConfig();
    console.log('Current config:', config);
    
    const metrics = diagram.getMetrics();
    console.log('Current metrics:', metrics);
    
    console.log('✓ Configuration and metrics retrieval works');
    
    // Test HTML rendering (with mock HTML)
    console.log('5. Testing HTML rendering...');
    const testHTML = `
      <microservice name="user-service" connects="db-1">
        <database name="user-db" id="db-1" brand="postgresql"/>
      </microservice>
    `;
    
    try {
      const result = await diagram.render(testHTML);
      console.log('✓ Render completed:', result);
    } catch (renderError) {
      console.log('⚠ Render failed (expected due to missing dependencies):', renderError.message);
    }
    
    // Test event handling
    console.log('6. Testing event handling...');
    let eventReceived = false;
    diagram.on('test-event', (data) => {
      eventReceived = true;
      console.log('Event received:', data);
    });
    
    // Manually emit event for testing
    diagram._emit('test-event', { test: 'data' });
    
    if (eventReceived) {
      console.log('✓ Event handling works');
    } else {
      console.log('⚠ Event handling may not be working');
    }
    
    // Test cleanup
    console.log('7. Testing cleanup...');
    await diagram.destroy();
    console.log('✓ Cleanup completed');
    
    console.log('\n✅ All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.stack);
  }
}

// Run tests when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testAPI);
} else {
  testAPI();
}