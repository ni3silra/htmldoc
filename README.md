# HTML Diagram Library

A lightweight JavaScript library for creating beautiful architectural diagrams using simple HTML-like syntax. No installation, no build tools, no complex APIs - just include a script tag and start creating diagrams!

## ✨ Features

- **HTML-like syntax** - Define diagrams using familiar custom HTML tags
- **Zero installation** - Works with just a CDN script tag inclusion
- **Auto-layout** - Automatic positioning using force-directed graph algorithms
- **Interactive** - Built-in zoom, pan, tooltips, and hover effects
- **Cross-browser** - Works in Chrome, Firefox, Safari, and Edge
- **Professional icons** - High-quality icons for architectural components
- **Documentation-friendly** - Perfect for Confluence, wikis, and documentation sites

## 🚀 Quick Start

### 1. Include the Library

Add this single script tag to your HTML page:

```html
<script src="https://cdn.jsdelivr.net/npm/html-diagram-library@1.0.0/dist/html-diagram-library.min.js"></script>
```

### 2. Create a Container

Add a div where your diagram will be rendered:

```html
<div id="my-diagram" style="width: 800px; height: 600px;">
  <!-- Your diagram elements go here -->
</div>
```

### 3. Define Your Architecture

Use custom HTML tags to define your system components:

```html
<div id="my-diagram" style="width: 800px; height: 600px;">
  <api-gateway name="Main Gateway" brand="kong" connects="user-service,order-service" id="gateway">
  </api-gateway>

  <microservice name="User Service" brand="spring-boot" connects="user-db" id="user-service">
  </microservice>

  <microservice name="Order Service" brand="nodejs" connects="order-db" id="order-service">
  </microservice>

  <database name="User Database" brand="postgresql" id="user-db">
  </database>

  <database name="Order Database" brand="mongodb" id="order-db">
  </database>
</div>
```

### 4. Initialize and Render

Add a script to initialize the library:

```html
<script>
  const diagram = new HTMLDiagramLibrary('#my-diagram');
  
  diagram.initialize().then(() => {
    return diagram.render();
  });
</script>
```

That's it! Your diagram will automatically appear with professional styling and interactive features.

## 📖 Complete Example

Here's a full working HTML page you can copy and paste:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Architecture Diagram</title>
</head>
<body>
    <h1>My Microservice Architecture</h1>
    
    <div id="diagram" style="width: 100%; height: 600px; border: 1px solid #ccc;">
        <api-gateway name="API Gateway" brand="kong" connects="auth-service,user-service" id="gateway">
        </api-gateway>

        <microservice name="Auth Service" brand="spring-boot" connects="auth-db" id="auth-service">
        </microservice>

        <microservice name="User Service" brand="nodejs" connects="user-db" id="user-service">
        </microservice>

        <database name="Auth DB" brand="postgresql" id="auth-db">
        </database>

        <database name="User DB" brand="mongodb" id="user-db">
        </database>
    </div>

    <!-- Include the library -->
    <script src="https://cdn.jsdelivr.net/npm/html-diagram-library@1.0.0/dist/html-diagram-library.min.js"></script>
    
    <script>
        // Initialize and render
        const diagram = new HTMLDiagramLibrary('#diagram', {
            theme: 'default',
            interaction: {
                enableZoom: true,
                enablePan: true,
                enableTooltips: true
            }
        });
        
        diagram.initialize().then(() => {
            return diagram.render();
        }).then(() => {
            console.log('Diagram rendered successfully!');
        }).catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

## 🏗️ Supported Elements

### Microservice
```html
<microservice name="Service Name" brand="spring-boot" connects="database-id" id="service-id">
</microservice>
```

**Attributes:**
- `name` - Display name for the service
- `brand` - Technology brand (spring-boot, nodejs, python, etc.)
- `connects` - Comma-separated list of IDs this service connects to
- `id` - Unique identifier (required)

### API Gateway
```html
<api-gateway name="Gateway Name" brand="kong" connects="service1,service2" id="gateway-id">
</api-gateway>
```

**Attributes:**
- `name` - Display name for the gateway
- `brand` - Gateway technology (kong, nginx, aws-api-gateway, etc.)
- `connects` - Comma-separated list of service IDs
- `id` - Unique identifier (required)

### Database
```html
<database name="Database Name" brand="postgresql" id="db-id">
</database>
```

**Attributes:**
- `name` - Display name for the database
- `brand` - Database type (postgresql, mongodb, mysql, redis, etc.)
- `id` - Unique identifier (required)

## ⚙️ Configuration Options

You can customize the diagram behavior with configuration options:

```javascript
const diagram = new HTMLDiagramLibrary('#diagram', {
    // Layout configuration
    layout: {
        forceStrength: 0.3,         // Overall force strength (0-1)
        linkDistance: 120,          // Distance between connected nodes
        nodeRepulsion: 400,         // How much nodes repel each other
        centerForce: 0.1            // Force pulling nodes to center
    },
    
    // Theme configuration
    theme: 'default',               // Theme name or custom theme object
    
    // Interaction configuration
    interaction: {
        enableZoom: true,           // Enable zoom functionality
        enablePan: true,            // Enable pan functionality
        enableTooltips: true,       // Show tooltips on hover
        enableAnimations: true      // Enable smooth animations
    },
    
    // Performance configuration
    performance: {
        maxNodes: 100,              // Maximum nodes before warnings
        animationDuration: 300,     // Animation duration in ms
        renderThrottle: 16          // Render throttle in ms
    }
});
```

## 🌐 Browser Compatibility

The HTML Diagram Library works in all modern browsers with **no installation required**:

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |

**No polyfills or additional dependencies needed!**

### What's Included

- ✅ SVG rendering support
- ✅ ES6+ JavaScript features
- ✅ CSS3 animations and transitions
- ✅ Touch events for mobile/tablet
- ✅ Responsive design support

## 📚 Examples

We provide ready-to-use examples in the `examples/` directory:

### Basic Examples
- [Microservice Architecture](examples/basic/microservice-example.html)
- [Database Connections](examples/basic/database-example.html)
- [API Gateway Setup](examples/basic/api-gateway-example.html)

### Advanced Examples
- [Enterprise Architecture](examples/advanced/enterprise-architecture.html)
- [Cloud-Native Architecture](examples/advanced/cloud-native-architecture.html)
- [Event-Driven Architecture](examples/advanced/event-driven-architecture.html)

### Quick Start Examples
- [Simple Setup](examples/quick-start/simple-setup.html)
- [With Configuration](examples/quick-start/with-configuration.html)
- [Interactive Features](examples/quick-start/interactive-features.html)

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Diagram Not Appearing

**Problem:** The diagram container is empty or shows no content.

**Solutions:**
1. **Check the script tag:** Ensure the CDN URL is correct and accessible
   ```html
   <script src="https://cdn.jsdelivr.net/npm/html-diagram-library@1.0.0/dist/html-diagram-library.min.js"></script>
   ```

2. **Use the correct class name and constructor:** The library is exported as `HTMLDiagramLibrary` and expects container as first parameter
   ```html
   <!-- Correct -->
   <script>
     const diagram = new HTMLDiagramLibrary('#diagram');
     diagram.initialize().then(() => diagram.render());
   </script>
   
   <!-- Incorrect -->
   <script>
     const diagram = new DiagramLibrary({ container: '#diagram' });
   </script>
   ```

3. **Verify container has dimensions:** The container must have width and height
   ```html
   <div id="diagram" style="width: 800px; height: 600px;">
   ```

4. **Check browser console:** Look for JavaScript errors that might prevent rendering

5. **Validate HTML syntax:** Ensure all custom elements have proper closing tags
   ```html
   <!-- Correct -->
   <microservice name="My Service" id="service1"></microservice>
   
   <!-- Incorrect -->
   <microservice name="My Service" id="service1">
   ```

#### Elements Not Connecting

**Problem:** Connections between elements don't appear as lines/arrows.

**Solutions:**
1. **Check ID references:** Ensure `connects` attribute references valid element IDs
   ```html
   <microservice connects="db1" id="service1"></microservice>
   <database id="db1"></database> <!-- ID must match -->
   ```

2. **Use comma separation:** Multiple connections should be comma-separated
   ```html
   <api-gateway connects="service1,service2,service3" id="gateway"></api-gateway>
   ```

3. **Avoid circular references:** Don't create circular connection chains

#### Performance Issues

**Problem:** Diagram is slow to render or interact with.

**Solutions:**
1. **Reduce node count:** Consider breaking large diagrams into smaller ones
2. **Adjust performance settings:**
   ```javascript
   const diagram = new HTMLDiagramLibrary({
       performance: {
           maxNodes: 50,           // Reduce if needed
           animationDuration: 150, // Faster animations
           renderThrottle: 32      // Less frequent updates
       }
   });
   ```

3. **Disable animations for large diagrams:**
   ```javascript
   interaction: {
       enableAnimations: false
   }
   ```

#### Icons Not Loading

**Problem:** Elements show placeholder icons instead of brand-specific icons.

**Solutions:**
1. **Check internet connection:** Icons are loaded from CDN
2. **Verify brand names:** Use supported brand names (spring-boot, nodejs, postgresql, etc.)
3. **Check Content Security Policy:** Ensure your page allows external image loading

#### Styling Conflicts

**Problem:** Diagram styling conflicts with page CSS.

**Solutions:**
1. **Use CSS isolation:** Wrap diagram in a container with specific styles
   ```css
   .diagram-container {
       isolation: isolate;
   }
   ```

2. **Check CSS specificity:** Page styles might override diagram styles
3. **Use custom themes:** Define your own theme to match page styling

#### Mobile/Touch Issues

**Problem:** Diagram doesn't work properly on mobile devices.

**Solutions:**
1. **Enable touch events:**
   ```javascript
   interaction: {
       enableZoom: true,
       enablePan: true
   }
   ```

2. **Set viewport meta tag:**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

3. **Use responsive container:**
   ```css
   #diagram {
       width: 100%;
       height: 400px;
       max-width: 100vw;
   }
   ```

### Getting Help

If you're still experiencing issues:

1. **Check the browser console** for error messages
2. **Validate your HTML** using online HTML validators
3. **Try the minimal example** from our Quick Start guide
4. **Review our examples** for similar use cases
5. **Open an issue** on our GitHub repository with:
   - Your HTML code
   - Browser and version
   - Console error messages
   - Expected vs actual behavior

## 📄 License

MIT License - feel free to use in personal and commercial projects.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📞 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-org/html-diagram-library/issues)
- 💬 [Discussions](https://github.com/your-org/html-diagram-library/discussions)