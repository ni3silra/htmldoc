# Customization Guide

## Overview

The HTML Diagram Library is designed to be highly customizable, allowing you to extend functionality, create custom themes, add new element types, and integrate with existing systems. This guide covers advanced customization techniques for developers who need to go beyond the default configuration.

## Custom Themes

### Creating a Custom Theme

```javascript
const customTheme = {
  name: 'corporate',
  nodeStyles: {
    microservice: {
      fill: '#1976D2',
      stroke: '#0D47A1',
      strokeWidth: 2,
      rx: 8,
      ry: 8,
      fontSize: '14px',
      fontFamily: 'Roboto, sans-serif',
      fontWeight: 'bold',
      textFill: '#FFFFFF'
    },
    database: {
      fill: '#388E3C',
      stroke: '#1B5E20',
      strokeWidth: 2,
      rx: 4,
      ry: 4,
      fontSize: '12px',
      fontFamily: 'Roboto, sans-serif',
      textFill: '#FFFFFF'
    },
    'api-gateway': {
      fill: '#F57C00',
      stroke: '#E65100',
      strokeWidth: 3,
      rx: 12,
      ry: 12,
      fontSize: '14px',
      fontFamily: 'Roboto, sans-serif',
      fontWeight: 'bold',
      textFill: '#FFFFFF'
    }
  },
  edgeStyles: {
    connection: {
      stroke: '#424242',
      strokeWidth: 2,
      strokeDasharray: 'none',
      markerEnd: 'url(#arrowhead-corporate)',
      opacity: 0.8
    },
    hierarchy: {
      stroke: '#757575',
      strokeWidth: 1,
      strokeDasharray: '5,5',
      markerEnd: 'url(#arrowhead-hierarchy)',
      opacity: 0.6
    }
  },
  colors: {
    primary: '#1976D2',
    secondary: '#424242',
    accent: '#F57C00',
    background: '#FAFAFA',
    text: '#212121'
  },
  fonts: {
    primary: 'Roboto, sans-serif',
    secondary: 'Roboto Mono, monospace',
    sizes: {
      small: '10px',
      medium: '12px',
      large: '14px',
      xlarge: '16px'
    }
  },
  animations: {
    duration: 800,
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    stagger: 100
  }
};

// Apply the custom theme
const diagram = new DiagramLibrary({
  theme: customTheme
});
```

### Dynamic Theme Switching

```javascript
class ThemeManager {
  constructor(diagram) {
    this.diagram = diagram;
    this.themes = new Map();
    this.currentTheme = 'default';
  }

  registerTheme(name, theme) {
    this.themes.set(name, theme);
  }

  switchTheme(themeName) {
    if (this.themes.has(themeName)) {
      this.diagram.applyTheme(this.themes.get(themeName));
      this.currentTheme = themeName;
      this.diagram.render(); // Re-render with new theme
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Usage
const themeManager = new ThemeManager(diagram);
themeManager.registerTheme('dark', darkTheme);
themeManager.registerTheme('light', lightTheme);
themeManager.switchTheme('dark');
```

## Custom Element Types

### Adding New Element Types

```javascript
// Define a custom element type
class CustomElementType {
  constructor() {
    this.type = 'load-balancer';
    this.defaultAttributes = {
      name: 'Load Balancer',
      brand: 'nginx'
    };
    this.requiredAttributes = ['name'];
    this.icon = 'load-balancer-icon';
  }

  validate(element) {
    const errors = [];
    
    if (!element.attributes.name) {
      errors.push('Load balancer must have a name attribute');
    }
    
    if (element.attributes.connects) {
      const connections = element.attributes.connects.split(',');
      if (connections.length < 2) {
        errors.push('Load balancer should connect to at least 2 services');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getDefaultStyle() {
    return {
      fill: '#FF9800',
      stroke: '#F57C00',
      strokeWidth: 2,
      shape: 'rect',
      rx: 6,
      ry: 6
    };
  }
}

// Register the custom element type
diagram.registerElementType(new CustomElementType());
```

### Element Type Plugin System

```javascript
class ElementTypePlugin {
  constructor(config) {
    this.name = config.name;
    this.elementTypes = config.elementTypes || [];
    this.validators = config.validators || [];
    this.renderers = config.renderers || [];
  }

  install(diagram) {
    // Register element types
    this.elementTypes.forEach(type => {
      diagram.registerElementType(type);
    });

    // Register validators
    this.validators.forEach(validator => {
      diagram.addValidator(validator);
    });

    // Register custom renderers
    this.renderers.forEach(renderer => {
      diagram.addRenderer(renderer);
    });
  }
}

// Create a plugin for cloud services
const cloudServicesPlugin = new ElementTypePlugin({
  name: 'cloud-services',
  elementTypes: [
    new AWSLambdaElement(),
    new AWSRDSElement(),
    new AWSS3Element(),
    new AWSAPIGatewayElement()
  ],
  validators: [
    new AWSResourceValidator()
  ],
  renderers: [
    new AWSIconRenderer()
  ]
});

// Install the plugin
diagram.use(cloudServicesPlugin);
```

## Custom Layout Algorithms

### Implementing a Custom Layout Engine

```javascript
class GridLayoutEngine {
  constructor(config = {}) {
    this.config = {
      columns: config.columns || 3,
      rowHeight: config.rowHeight || 150,
      columnWidth: config.columnWidth || 200,
      padding: config.padding || 20,
      ...config
    };
  }

  calculateLayout(nodes, edges) {
    const positions = new Map();
    const { columns, rowHeight, columnWidth, padding } = this.config;

    nodes.forEach((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      positions.set(node.id, {
        x: col * (columnWidth + padding) + columnWidth / 2,
        y: row * (rowHeight + padding) + rowHeight / 2
      });
    });

    return {
      nodes: nodes.map(node => ({
        ...node,
        position: positions.get(node.id)
      })),
      edges,
      bounds: {
        width: columns * (columnWidth + padding),
        height: Math.ceil(nodes.length / columns) * (rowHeight + padding)
      }
    };
  }
}

// Register and use custom layout
diagram.registerLayoutEngine('grid', GridLayoutEngine);
diagram.setLayoutEngine('grid', {
  columns: 4,
  columnWidth: 180,
  rowHeight: 120
});
```

### Hierarchical Layout Engine

```javascript
class HierarchicalLayoutEngine {
  constructor(config = {}) {
    this.config = {
      levelHeight: config.levelHeight || 150,
      nodeSpacing: config.nodeSpacing || 100,
      direction: config.direction || 'top-down', // 'top-down', 'left-right'
      ...config
    };
  }

  calculateLayout(nodes, edges) {
    // Build hierarchy from edges
    const hierarchy = this.buildHierarchy(nodes, edges);
    const positions = this.calculateHierarchicalPositions(hierarchy);
    
    return {
      nodes: nodes.map(node => ({
        ...node,
        position: positions.get(node.id)
      })),
      edges,
      bounds: this.calculateBounds(positions)
    };
  }

  buildHierarchy(nodes, edges) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const children = new Map();
    const parents = new Map();
    
    // Initialize
    nodes.forEach(node => {
      children.set(node.id, []);
      parents.set(node.id, []);
    });
    
    // Build parent-child relationships
    edges.forEach(edge => {
      children.get(edge.source).push(edge.target);
      parents.get(edge.target).push(edge.source);
    });
    
    // Find root nodes (no parents)
    const roots = nodes.filter(node => parents.get(node.id).length === 0);
    
    return { nodeMap, children, parents, roots };
  }

  calculateHierarchicalPositions(hierarchy) {
    const positions = new Map();
    const { levelHeight, nodeSpacing } = this.config;
    
    // Level-order traversal to assign levels
    const levels = [];
    const queue = hierarchy.roots.map(root => ({ node: root, level: 0 }));
    
    while (queue.length > 0) {
      const { node, level } = queue.shift();
      
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
      
      const childNodes = hierarchy.children.get(node.id)
        .map(childId => hierarchy.nodeMap.get(childId));
      
      childNodes.forEach(child => {
        queue.push({ node: child, level: level + 1 });
      });
    }
    
    // Position nodes within levels
    levels.forEach((levelNodes, levelIndex) => {
      const totalWidth = (levelNodes.length - 1) * nodeSpacing;
      const startX = -totalWidth / 2;
      
      levelNodes.forEach((node, nodeIndex) => {
        positions.set(node.id, {
          x: startX + nodeIndex * nodeSpacing,
          y: levelIndex * levelHeight
        });
      });
    });
    
    return positions;
  }
}
```

## Custom Icon Management

### Creating a Custom Icon Provider

```javascript
class CustomIconProvider {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.iconMap = config.iconMap || {};
    this.cache = new Map();
  }

  async getIcon(elementType, brand) {
    const cacheKey = `${elementType}-${brand}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const iconUrl = this.resolveIconUrl(elementType, brand);
      const iconData = await this.fetchIcon(iconUrl);
      this.cache.set(cacheKey, iconData);
      return iconData;
    } catch (error) {
      console.warn(`Failed to load icon for ${elementType}:${brand}`, error);
      return this.getFallbackIcon(elementType);
    }
  }

  resolveIconUrl(elementType, brand) {
    const key = `${elementType}:${brand}`;
    if (this.iconMap[key]) {
      return `${this.baseUrl}/${this.iconMap[key]}`;
    }
    
    // Try brand-specific icon
    if (this.iconMap[brand]) {
      return `${this.baseUrl}/${this.iconMap[brand]}`;
    }
    
    // Try element type icon
    if (this.iconMap[elementType]) {
      return `${this.baseUrl}/${this.iconMap[elementType]}`;
    }
    
    // Default pattern
    return `${this.baseUrl}/${elementType}/${brand}.svg`;
  }

  async fetchIcon(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  }

  getFallbackIcon(elementType) {
    const fallbackIcons = {
      microservice: '<circle cx="12" cy="12" r="10" fill="#4CAF50"/>',
      database: '<rect x="2" y="2" width="20" height="20" rx="2" fill="#2196F3"/>',
      'api-gateway': '<polygon points="12,2 22,12 12,22 2,12" fill="#FF9800"/>'
    };
    
    return fallbackIcons[elementType] || fallbackIcons.microservice;
  }
}

// Register custom icon provider
const iconProvider = new CustomIconProvider({
  baseUrl: 'https://my-icons.example.com',
  iconMap: {
    'microservice:spring-boot': 'spring/spring-boot.svg',
    'microservice:nodejs': 'nodejs/nodejs.svg',
    'database:postgresql': 'databases/postgresql.svg'
  }
});

diagram.setIconProvider(iconProvider);
```

## Event System Extensions

### Custom Event Handlers

```javascript
class DiagramEventManager {
  constructor(diagram) {
    this.diagram = diagram;
    this.eventHandlers = new Map();
    this.middlewares = [];
  }

  // Add middleware for event processing
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // Register custom event handler
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType).push(handler);
  }

  // Emit custom events with middleware processing
  async emit(eventType, eventData) {
    let processedData = eventData;
    
    // Apply middlewares
    for (const middleware of this.middlewares) {
      processedData = await middleware(eventType, processedData);
    }
    
    // Call registered handlers
    const handlers = this.eventHandlers.get(eventType) || [];
    for (const handler of handlers) {
      await handler(processedData);
    }
  }
}

// Usage example
const eventManager = new DiagramEventManager(diagram);

// Add logging middleware
eventManager.use(async (eventType, data) => {
  console.log(`Event: ${eventType}`, data);
  return data;
});

// Add analytics middleware
eventManager.use(async (eventType, data) => {
  if (eventType === 'node:click') {
    analytics.track('diagram_node_clicked', {
      nodeType: data.node.type,
      nodeName: data.node.name
    });
  }
  return data;
});

// Register custom event handlers
eventManager.on('node:doubleclick', async (data) => {
  const nodeDetails = await fetchNodeDetails(data.node.id);
  showNodeDetailsModal(nodeDetails);
});
```

## Integration with External Systems

### REST API Integration

```javascript
class APIIntegration {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async loadDiagramFromAPI(diagramId) {
    const response = await fetch(`${this.baseUrl}/diagrams/${diagramId}`, {
      headers: this.headers
    });
    
    const diagramData = await response.json();
    return this.convertAPIDataToHTML(diagramData);
  }

  async saveDiagramToAPI(diagramId, htmlContent) {
    const diagramData = this.convertHTMLToAPIData(htmlContent);
    
    const response = await fetch(`${this.baseUrl}/diagrams/${diagramId}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(diagramData)
    });
    
    return response.json();
  }

  convertAPIDataToHTML(apiData) {
    let html = '';
    
    apiData.components.forEach(component => {
      const attributes = Object.entries(component.attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      
      html += `<${component.type} ${attributes}></${component.type}>\n`;
    });
    
    return html;
  }

  convertHTMLToAPIData(htmlContent) {
    // Parse HTML and convert to API format
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const components = [];
    
    doc.querySelectorAll('microservice, database, api-gateway').forEach(element => {
      const component = {
        type: element.tagName.toLowerCase(),
        attributes: {}
      };
      
      Array.from(element.attributes).forEach(attr => {
        component.attributes[attr.name] = attr.value;
      });
      
      components.push(component);
    });
    
    return { components };
  }
}

// Usage
const apiIntegration = new APIIntegration({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key'
});

// Load diagram from API
apiIntegration.loadDiagramFromAPI('diagram-123')
  .then(htmlContent => diagram.render(htmlContent));

// Save diagram to API
diagram.on('diagram:changed', (event) => {
  apiIntegration.saveDiagramToAPI('diagram-123', event.htmlContent);
});
```

### Real-time Collaboration

```javascript
class CollaborationManager {
  constructor(diagram, websocketUrl) {
    this.diagram = diagram;
    this.ws = new WebSocket(websocketUrl);
    this.userId = this.generateUserId();
    this.cursors = new Map();
    
    this.setupWebSocket();
    this.setupDiagramEvents();
  }

  setupWebSocket() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  setupDiagramEvents() {
    this.diagram.on('node:move', (event) => {
      this.broadcast({
        type: 'node:move',
        userId: this.userId,
        nodeId: event.node.id,
        position: event.position
      });
    });

    this.diagram.on('node:add', (event) => {
      this.broadcast({
        type: 'node:add',
        userId: this.userId,
        node: event.node
      });
    });
  }

  handleMessage(message) {
    if (message.userId === this.userId) return; // Ignore own messages
    
    switch (message.type) {
      case 'node:move':
        this.diagram.moveNode(message.nodeId, message.position);
        break;
      case 'node:add':
        this.diagram.addNode(message.node);
        break;
      case 'cursor:move':
        this.updateCursor(message.userId, message.position);
        break;
    }
  }

  broadcast(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  updateCursor(userId, position) {
    if (!this.cursors.has(userId)) {
      this.cursors.set(userId, this.createCursor(userId));
    }
    
    const cursor = this.cursors.get(userId);
    cursor.style.left = `${position.x}px`;
    cursor.style.top = `${position.y}px`;
  }

  createCursor(userId) {
    const cursor = document.createElement('div');
    cursor.className = 'collaboration-cursor';
    cursor.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      background: #FF5722;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
    `;
    document.body.appendChild(cursor);
    return cursor;
  }
}
```

## Performance Optimization Extensions

### Custom Virtualization

```javascript
class DiagramVirtualization {
  constructor(diagram, config = {}) {
    this.diagram = diagram;
    this.config = {
      viewportBuffer: config.viewportBuffer || 100,
      maxVisibleNodes: config.maxVisibleNodes || 50,
      ...config
    };
    this.visibleNodes = new Set();
    this.viewport = { x: 0, y: 0, width: 0, height: 0 };
  }

  updateViewport(viewport) {
    this.viewport = viewport;
    this.updateVisibleNodes();
  }

  updateVisibleNodes() {
    const { x, y, width, height } = this.viewport;
    const buffer = this.config.viewportBuffer;
    
    const viewBounds = {
      left: x - buffer,
      right: x + width + buffer,
      top: y - buffer,
      bottom: y + height + buffer
    };

    const newVisibleNodes = new Set();
    
    this.diagram.getAllNodes().forEach(node => {
      if (this.isNodeInBounds(node, viewBounds)) {
        newVisibleNodes.add(node.id);
      }
    });

    // Show newly visible nodes
    newVisibleNodes.forEach(nodeId => {
      if (!this.visibleNodes.has(nodeId)) {
        this.diagram.showNode(nodeId);
      }
    });

    // Hide no longer visible nodes
    this.visibleNodes.forEach(nodeId => {
      if (!newVisibleNodes.has(nodeId)) {
        this.diagram.hideNode(nodeId);
      }
    });

    this.visibleNodes = newVisibleNodes;
  }

  isNodeInBounds(node, bounds) {
    const nodeSize = node.size || { width: 100, height: 60 };
    const nodeLeft = node.position.x - nodeSize.width / 2;
    const nodeRight = node.position.x + nodeSize.width / 2;
    const nodeTop = node.position.y - nodeSize.height / 2;
    const nodeBottom = node.position.y + nodeSize.height / 2;

    return !(nodeRight < bounds.left || 
             nodeLeft > bounds.right || 
             nodeBottom < bounds.top || 
             nodeTop > bounds.bottom);
  }
}
```

## Testing Custom Extensions

### Unit Testing Custom Components

```javascript
// Example test for custom element type
describe('CustomElementType', () => {
  let elementType;

  beforeEach(() => {
    elementType = new CustomElementType();
  });

  test('should validate required attributes', () => {
    const element = {
      type: 'load-balancer',
      attributes: {}
    };

    const result = elementType.validate(element);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Load balancer must have a name attribute');
  });

  test('should validate connection requirements', () => {
    const element = {
      type: 'load-balancer',
      attributes: {
        name: 'Test LB',
        connects: 'service1'
      }
    };

    const result = elementType.validate(element);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Load balancer should connect to at least 2 services');
  });
});
```

### Integration Testing

```javascript
// Example integration test
describe('Custom Theme Integration', () => {
  let diagram;
  let customTheme;

  beforeEach(() => {
    customTheme = new CustomTheme();
    diagram = new DiagramLibrary({
      container: '#test-container',
      theme: customTheme
    });
  });

  test('should apply custom theme styles', async () => {
    const html = '<microservice name="Test Service"></microservice>';
    await diagram.render(html);

    const nodeElement = diagram.container.querySelector('.diagram-node');
    const computedStyle = window.getComputedStyle(nodeElement);
    
    expect(computedStyle.fill).toBe(customTheme.nodeStyles.microservice.fill);
  });
});
```

This customization guide provides the foundation for extending the HTML Diagram Library to meet specific requirements while maintaining performance and compatibility.