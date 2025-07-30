# API Reference

## Overview

The HTML Diagram Library allows you to create architectural diagrams using simple HTML-like syntax. This reference documents all available HTML tags, attributes, and configuration options.

## HTML Tags

### `<microservice>`

Represents a microservice component in your architecture.

**Attributes:**
- `name` (required): Display name of the microservice
- `brand` (optional): Technology brand (e.g., "spring-boot", "nodejs", "python")
- `connects` (optional): Comma-separated list of component IDs this service connects to
- `id` (optional): Unique identifier for referencing in connections

**Example:**
```html
<microservice name="User Service" brand="spring-boot" connects="user-db,auth-service" id="user-svc">
</microservice>
```

### `<api-gateway>`

Represents an API Gateway component that routes requests to backend services.

**Attributes:**
- `name` (required): Display name of the API gateway
- `brand` (optional): Technology brand (e.g., "kong", "nginx", "aws-api-gateway")
- `connects` (optional): Comma-separated list of services this gateway routes to
- `id` (optional): Unique identifier for referencing in connections

**Example:**
```html
<api-gateway name="Main Gateway" brand="kong" connects="user-svc,order-svc" id="main-gateway">
</api-gateway>
```

### `<database>`

Represents a database component in your architecture.

**Attributes:**
- `name` (required): Display name of the database
- `brand` (optional): Database type (e.g., "postgresql", "mongodb", "redis", "mysql")
- `connects` (optional): Comma-separated list of components that connect to this database
- `id` (optional): Unique identifier for referencing in connections

**Example:**
```html
<database name="User Database" brand="postgresql" id="user-db">
</database>
```

### `<load-balancer>`

Represents a load balancer component that distributes traffic.

**Attributes:**
- `name` (required): Display name of the load balancer
- `brand` (optional): Technology brand (e.g., "nginx", "haproxy", "aws-elb")
- `connects` (optional): Comma-separated list of services this load balancer routes to
- `id` (optional): Unique identifier for referencing in connections

**Example:**
```html
<load-balancer name="Frontend LB" brand="nginx" connects="web-app-1,web-app-2" id="frontend-lb">
</load-balancer>
```

### `<cache>`

Represents a caching layer in your architecture.

**Attributes:**
- `name` (required): Display name of the cache
- `brand` (optional): Cache technology (e.g., "redis", "memcached", "elasticsearch")
- `connects` (optional): Comma-separated list of components that use this cache
- `id` (optional): Unique identifier for referencing in connections

**Example:**
```html
<cache name="Session Cache" brand="redis" id="session-cache">
</cache>
```

### `<message-queue>`

Represents a message queue or event streaming component.

**Attributes:**
- `name` (required): Display name of the message queue
- `brand` (optional): Technology brand (e.g., "rabbitmq", "kafka", "aws-sqs")
- `connects` (optional): Comma-separated list of services that publish/consume messages
- `id` (optional): Unique identifier for referencing in connections

**Example:**
```html
<message-queue name="Order Events" brand="kafka" id="order-queue">
</message-queue>
```

## Global Attributes

All components support these common attributes:

- `id`: Unique identifier for the component (auto-generated if not provided)
- `class`: CSS class names for custom styling
- `data-*`: Custom data attributes for metadata

## Configuration Options

### Library Initialization

```javascript
const diagram = new DiagramLibrary({
  container: '#diagram-container',
  layout: {
    forceStrength: 0.3,
    linkDistance: 100,
    nodeRepulsion: 300,
    centerForce: 0.1
  },
  theme: 'default',
  icons: {
    fallbackIcon: 'default-component',
    externalSources: ['https://cdn.example.com/icons/']
  },
  interaction: {
    enableZoom: true,
    enablePan: true,
    enableTooltips: true
  }
});
```

### Layout Configuration

- `forceStrength` (0.0-1.0): Overall strength of the force simulation
- `linkDistance` (number): Preferred distance between connected nodes
- `nodeRepulsion` (number): Force pushing nodes apart
- `centerForce` (0.0-1.0): Force pulling nodes toward center
- `iterations` (number): Maximum simulation iterations

### Theme Configuration

```javascript
const customTheme = {
  nodeStyles: {
    microservice: {
      fill: '#4CAF50',
      stroke: '#2E7D32',
      strokeWidth: 2
    },
    database: {
      fill: '#2196F3',
      stroke: '#1565C0',
      strokeWidth: 2
    }
  },
  edgeStyles: {
    connection: {
      stroke: '#666',
      strokeWidth: 1.5,
      markerEnd: 'url(#arrowhead)'
    }
  },
  colors: {
    primary: '#1976D2',
    secondary: '#424242',
    accent: '#FF5722'
  }
};
```

### Icon Configuration

```javascript
const iconConfig = {
  iconSources: {
    'spring-boot': '/icons/spring-boot.svg',
    'nodejs': '/icons/nodejs.svg',
    'postgresql': '/icons/postgresql.svg'
  },
  fallbackIcon: 'default-component',
  externalSources: [
    'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/',
    'https://unpkg.com/feather-icons/dist/icons/'
  ]
};
```

## Methods

### `initialize(config)`

Initializes the diagram library with the provided configuration.

**Parameters:**
- `config` (object): Configuration options

**Returns:** DiagramLibrary instance

### `render(htmlString)`

Renders a diagram from HTML string.

**Parameters:**
- `htmlString` (string): HTML markup containing diagram elements

**Returns:** Promise that resolves when rendering is complete

### `update(htmlString)`

Updates the existing diagram with new HTML content.

**Parameters:**
- `htmlString` (string): Updated HTML markup

**Returns:** Promise that resolves when update is complete

### `destroy()`

Cleans up the diagram and removes all event listeners.

**Returns:** void

### `exportSVG()`

Exports the current diagram as SVG string.

**Returns:** string (SVG markup)

### `exportPNG(options)`

Exports the current diagram as PNG image.

**Parameters:**
- `options` (object): Export options (width, height, scale)

**Returns:** Promise<Blob>

## Events

The library emits the following events:

### `diagram:rendered`

Fired when the diagram has finished rendering.

```javascript
diagram.on('diagram:rendered', (event) => {
  console.log('Diagram rendered with', event.nodeCount, 'nodes');
});
```

### `node:click`

Fired when a node is clicked.

```javascript
diagram.on('node:click', (event) => {
  console.log('Clicked node:', event.node.id);
});
```

### `node:hover`

Fired when a node is hovered.

```javascript
diagram.on('node:hover', (event) => {
  console.log('Hovered node:', event.node.id);
});
```

### `layout:complete`

Fired when the layout calculation is complete.

```javascript
diagram.on('layout:complete', (event) => {
  console.log('Layout completed in', event.duration, 'ms');
});
```

## Error Handling

The library provides detailed error information for debugging:

```javascript
try {
  await diagram.render(htmlString);
} catch (error) {
  if (error instanceof DiagramError) {
    console.error('Diagram Error:', error.type, error.message);
    console.error('Context:', error.context);
  }
}
```

### Error Types

- `PARSE_ERROR`: Invalid HTML syntax or unsupported elements
- `VALIDATION_ERROR`: Missing required attributes or circular references
- `LAYOUT_ERROR`: Layout calculation failures
- `RENDER_ERROR`: SVG generation or icon loading failures
- `INTERACTION_ERROR`: Event binding or browser compatibility issues

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- Diagrams with 50+ nodes may experience slower rendering
- Use `performance.maxNodes` to set limits
- Enable `performance.lazyLoading` for large diagrams
- Consider using `performance.renderThrottle` for smooth animations