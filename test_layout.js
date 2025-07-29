// Quick test to verify the layout engine functionality
import { LayoutEngine } from './src/layout/LayoutEngine.js';
import { ForceConfig } from './src/layout/ForceConfig.js';

// Test data
const testGraphData = {
  nodes: [
    { id: 'node1', type: 'microservice', label: 'API Service', size: { width: 60, height: 40 } },
    { id: 'node2', type: 'database', label: 'Database', size: { width: 50, height: 50 } },
    { id: 'node3', type: 'api-gateway', label: 'Gateway', size: { width: 70, height: 35 } }
  ],
  edges: [
    { id: 'edge1', source: 'node1', target: 'node2', type: 'connection' },
    { id: 'edge2', source: 'node3', target: 'node1', type: 'connection' }
  ]
};

async function testLayoutEngine() {
  console.log('Testing Layout Engine...');
  
  try {
    // Test ForceConfig
    const config = new ForceConfig();
    console.log('✓ ForceConfig created successfully');
    console.log('Default config:', config.getConfig());
    
    // Test preset application
    config.applyPreset('small');
    console.log('✓ Preset applied successfully');
    
    // Test LayoutEngine
    const engine = new LayoutEngine(config.getConfig());
    console.log('✓ LayoutEngine created successfully');
    
    // Test layout calculation
    console.log('Calculating layout...');
    const result = await engine.calculateLayout(testGraphData);
    
    console.log('✓ Layout calculation completed');
    console.log('Result summary:');
    console.log(`- Nodes positioned: ${result.nodes.length}`);
    console.log(`- Edges processed: ${result.edges.length}`);
    console.log(`- Converged: ${result.converged}`);
    console.log(`- Iterations: ${result.iterations}`);
    console.log(`- Bounds: ${result.bounds.width}x${result.bounds.height}`);
    
    // Verify node positions are set
    for (const node of result.nodes) {
      if (typeof node.x !== 'number' || typeof node.y !== 'number') {
        throw new Error(`Node ${node.id} missing valid position`);
      }
    }
    console.log('✓ All nodes have valid positions');
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testLayoutEngine();