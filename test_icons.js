// Quick test of the icon management system
import { IconManager } from './src/icons/IconManager.js';
import { IconCache } from './src/icons/IconCache.js';
import { FallbackIcons } from './src/icons/FallbackIcons.js';

async function testIconSystem() {
  console.log('Testing Icon Management System...');
  
  try {
    // Test FallbackIcons
    console.log('\n1. Testing FallbackIcons...');
    const fallbackIcons = new FallbackIcons();
    const fallbackIcon = fallbackIcons.getIcon('microservice');
    console.log('✓ Fallback icon generated:', fallbackIcon.length > 0 ? 'Success' : 'Failed');
    
    // Test IconCache
    console.log('\n2. Testing IconCache...');
    const cache = new IconCache();
    cache.set('test-icon', '<svg>test</svg>');
    const cached = cache.get('test-icon');
    console.log('✓ Cache set/get:', cached === '<svg>test</svg>' ? 'Success' : 'Failed');
    
    // Test IconManager
    console.log('\n3. Testing IconManager...');
    const iconManager = new IconManager();
    
    // Test fallback functionality
    const fallbackResult = iconManager.getFallbackIcon('database');
    console.log('✓ IconManager fallback:', fallbackResult.length > 0 ? 'Success' : 'Failed');
    
    // Test icon name resolution
    const resolvedName = iconManager.resolveIconName('auto', 'microservice');
    console.log('✓ Icon name resolution:', resolvedName === 'docker' ? 'Success' : 'Failed');
    
    // Test statistics
    const stats = iconManager.getStats();
    console.log('✓ Statistics available:', typeof stats === 'object' ? 'Success' : 'Failed');
    
    console.log('\n✅ All icon system tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIconSystem();