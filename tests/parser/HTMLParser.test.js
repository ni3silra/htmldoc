/**
 * Unit tests for HTMLParser class
 * Tests comprehensive HTML parsing scenarios for custom diagram elements
 */

import { HTMLParser } from '../../src/parser/HTMLParser.js';

// Mock DOM environment for testing
const mockDocument = {
  createElement: jest.fn(() => ({
    innerHTML: '',
    childNodes: [],
    attributes: [],
    tagName: 'DIV',
    id: ''
  }))
};

// Mock Node constants
if (!global.Node) {
  global.Node = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3
  };
}

// Mock document if not already defined
if (!global.document) {
  global.document = mockDocument;
} else {
  // If document exists, just mock createElement
  global.document.createElement = mockDocument.createElement;
}

describe('HTMLParser', () => {
  let parser;

  beforeEach(() => {
    parser = new HTMLParser();
    jest.clearAllMocks();
    
    // Reset mock document
    mockDocument.createElement.mockReturnValue({
      innerHTML: '',
      childNodes: [],
      attributes: [],
      tagName: 'DIV',
      id: ''
    });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultParser = new HTMLParser();
      expect(defaultParser.options.strictMode).toBe(false);
      expect(defaultParser.options.validateConnections).toBe(true);
      expect(defaultParser.options.allowedElements).toContain('microservice');
      expect(defaultParser.options.allowedElements).toContain('api-gateway');
      expect(defaultParser.options.allowedElements).toContain('database');
    });

    it('should initialize with custom options', () => {
      const customParser = new HTMLParser({
        strictMode: true,
        allowedElements: ['microservice', 'database'],
        validateConnections: false
      });
      
      expect(customParser.options.strictMode).toBe(true);
      expect(customParser.options.validateConnections).toBe(false);
      expect(customParser.options.allowedElements).toEqual(['microservice', 'database']);
    });

    it('should initialize validator with options', () => {
      expect(parser.validator).toBeDefined();
      expect(parser.elementIdCounter).toBe(0);
    });
  });

  describe('parseHTML method', () => {
    beforeEach(() => {
      // Mock DOM element creation and manipulation
      const mockElement = {
        innerHTML: '',
        childNodes: [],
        attributes: [],
        tagName: 'MICROSERVICE',
        id: 'test-service',
        nodeType: 1
      };
      
      mockDocument.createElement.mockReturnValue(mockElement);
    });

    it('should parse simple microservice element', () => {
      const html = '<microservice name="user-service" brand="nodejs"></microservice>';
      
      // Mock the DOM parsing
      const mockContainer = {
        innerHTML: html,
        childNodes: [{
          nodeType: 1,
          tagName: 'MICROSERVICE',
          attributes: [
            { name: 'name', value: 'user-service' },
            { name: 'brand', value: 'nodejs' }
          ],
          childNodes: []
        }]
      };
      
      mockDocument.createElement.mockReturnValue(mockContainer);
      
      const result = parser.parseHTML(html);
      
      expect(result.isValid).toBe(true);
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].type).toBe('microservice');
      expect(result.elements[0].attributes.name).toBe('user-service');
      expect(result.elements[0].attributes.brand).toBe('nodejs');
    });

    it('should parse multiple elements', () => {
      const html = `
        <microservice name="user-service" brand="nodejs"></microservice>
        <database name="user-db" brand="postgresql"></database>
        <api-gateway name="main-gateway" brand="nginx"></api-gateway>
      `;
      
      const mockContainer = {
        innerHTML: html,
        childNodes: [
          {
            nodeType: 1,
            tagName: 'MICROSERVICE',
            attributes: [
              { name: 'name', value: 'user-service' },
              { name: 'brand', value: 'nodejs' }
            ],
            childNodes: []
          },
          {
            nodeType: 1,
            tagName: 'DATABASE',
            attributes: [
              { name: 'name', value: 'user-db' },
              { name: 'brand', value: 'postgresql' }
            ],
            childNodes: []
          },
          {
            nodeType: 1,
            tagName: 'API-GATEWAY',
            attributes: [
              { name: 'name', value: 'main-gateway' },
              { name: 'brand', value: 'nginx' }
            ],
            childNodes: []
          }
        ]
      };
      
      mockDocument.createElement.mockReturnValue(mockContainer);
      
      const result = parser.parseHTML(html);
      
      expect(result.isValid).toBe(true);
      expect(result.elements).toHaveLength(3);
      expect(result.elements[0].type).toBe('microservice');
      expect(result.elements[1].type).toBe('database');
      expect(result.elements[2].type).toBe('api-gateway');
    });

    it('should parse nested elements', () => {
      const html = `
        <microservice name="user-service" brand="nodejs">
          <database name="user-db" brand="postgresql"></database>
          <cache name="user-cache" brand="redis"></cache>
        </microservice>
      `;
      
      const mockContainer = {
        innerHTML: html,
        childNodes: [{
          nodeType: 1,
          tagName: 'MICROSERVICE',
          attributes: [
            { name: 'name', value: 'user-service' },
            { name: 'brand', value: 'nodejs' }
          ],
          childNodes: [
            {
              nodeType: 1,
              tagName: 'DATABASE',
              attributes: [
                { name: 'name', value: 'user-db' },
                { name: 'brand', value: 'postgresql' }
              ],
              childNodes: []
            },
            {
              nodeType: 1,
              tagName: 'CACHE',
              attributes: [
                { name: 'name', value: 'user-cache' },
                { name: 'brand', value: 'redis' }
              ],
              childNodes: []
            }
          ]
        }]
      };
      
      mockDocument.createElement.mockReturnValue(mockContainer);
      
      const result = parser.parseHTML(html);
      
      expect(result.isValid).toBe(true);
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].children).toHaveLength(2);
      expect(result.elements[0].children[0].type).toBe('database');
      expect(result.elements[0].children[1].type).toBe('cache');
    });

    it('should parse elements with connections', () => {
      const html = '<microservice name="user-service" connects="db-1,cache-1"></microservice>';
      
      const mockContainer = {
        innerHTML: html,
        childNodes: [{
          nodeType: 1,
          tagName: 'MICROSERVICE',
          attributes: [
            { name: 'name', value: 'user-service' },
            { name: 'connects', value: 'db-1,cache-1' }
          ],
          childNodes: []
        }]
      };
      
      mockDocument.createElement.mockReturnValue(mockContainer);
      
      const result = parser.parseHTML(html);
      
      // May have validation errors for non-existent connection targets
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].connections).toEqual(['db-1', 'cache-1']);
      expect(result.elements[0].attributes.connects).toBe('db-1,cache-1');
    });

    it('should handle empty HTML input', () => {
      const result = parser.parseHTML('');
      
      expect(result.isValid).toBe(true);
      expect(result.elements).toHaveLength(0);
      expect(result.statistics.elementCount).toBe(0);
    });

    it('should handle whitespace-only HTML input', () => {
      const result = parser.parseHTML('   \n\t   ');
      
      expect(result.isValid).toBe(true);
      expect(result.elements).toHaveLength(0);
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<microservice name="test" <invalid>';
      
      // Mock parsing error
      mockDocument.createElement.mockImplementation(() => {
        throw new Error('Invalid HTML syntax');
      });
      
      const result = parser.parseHTML(html);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('PARSE_ERROR');
      expect(result.errors[0].message).toContain('Failed to parse HTML');
    });

    it('should handle unknown elements in non-strict mode', () => {
      const html = '<unknown-element name="test"></unknown-element>';
      
      const mockContainer = {
        innerHTML: html,
        childNodes: [{
          nodeType: 1,
          tagName: 'UNKNOWN-ELEMENT',
          attributes: [{ name: 'name', value: 'test' }],
          childNodes: []
        }]
      };
      
      mockDocument.createElement.mockReturnValue(mockContainer);
      
      const result = parser.parseHTML(html);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings.some(w => w.type === 'UNKNOWN_ELEMENT')).toBe(true);
    });

    it('should reject unknown elements in strict mode', () => {
      const strictParser = new HTMLParser({ strictMode: true });
      const html = '<unknown-element name="test"></unknown-element>';
      
      const mockContainer = {
        innerHTML: html,
        childNodes: [{
          nodeType: 1,
          tagName: 'UNKNOWN-ELEMENT',
          attributes: [{ name: 'name', value: 'test' }],
          childNodes: []
        }]
      };
      
      mockDocument.createElement.mockReturnValue(mockContainer);
      
      const result = strictParser.parseHTML(html);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('UNKNOWN_ELEMENT');
    });

    it('should calculate parsing statistics', () => {
      const html = `
        <microservice name="service1" connects="db1">
          <database name="db1"></database>
        </microservice>
        <api-gateway name="gateway1" connects="service1"></api-gateway>
      `;
      
      const mockContainer = {
        innerHTML: html,
        childNodes: [
          {
            nodeType: 1,
            tagName: 'MICROSERVICE',
            attributes: [
              { name: 'name', value: 'service1' },
              { name: 'connects', value: 'db1' }
            ],
            childNodes: [{
              nodeType: 1,
              tagName: 'DATABASE',
              attributes: [{ name: 'name', value: 'db1' }],
              childNodes: []
            }]
          },
          {
            nodeType: 1,
            tagName: 'API-GATEWAY',
            attributes: [
              { name: 'name', value: 'gateway1' },
              { name: 'connects', value: 'service1' }
            ],
            childNodes: []
          }
        ]
      };
      
      mockDocument.createElement.mockReturnValue(mockContainer);
      
      const result = parser.parseHTML(html);
      
      expect(result.statistics.elementCount).toBe(3); // service + db + gateway
      expect(result.statistics.connectionCount).toBe(2); // service->db + gateway->service
      expect(result.statistics.topLevelElements).toBe(2); // service + gateway
    });
  });

  describe('extractAttributes method', () => {
    it('should extract all attributes from DOM element', () => {
      const mockElement = {
        attributes: [
          { name: 'name', value: 'test-service' },
          { name: 'brand', value: 'nodejs' },
          { name: 'connects', value: 'db-1,cache-1' },
          { name: 'id', value: 'service-1' }
        ],
        tagName: 'MICROSERVICE'
      };
      
      const attributes = parser.extractAttributes(mockElement);
      
      expect(attributes.name).toBe('test-service');
      expect(attributes.brand).toBe('nodejs');
      expect(attributes.connects).toBe('db-1,cache-1');
      expect(attributes.id).toBe('service-1');
    });

    it('should normalize brand attribute', () => {
      const mockElement = {
        attributes: [
          { name: 'brand', value: 'Node.js Express' }
        ],
        tagName: 'MICROSERVICE'
      };
      
      const attributes = parser.extractAttributes(mockElement);
      
      expect(attributes.brand).toBe('node-js-express');
    });

    it('should normalize connects attribute', () => {
      const mockElement = {
        attributes: [
          { name: 'connects', value: ' db-1 , cache-1 , queue-1 ' }
        ],
        tagName: 'MICROSERVICE'
      };
      
      const attributes = parser.extractAttributes(mockElement);
      
      expect(attributes.connects).toBe('db-1,cache-1,queue-1');
    });

    it('should generate default name when missing', () => {
      const mockElement = {
        attributes: [],
        tagName: 'MICROSERVICE'
      };
      
      const attributes = parser.extractAttributes(mockElement);
      
      expect(attributes.name).toBeDefined();
      expect(attributes.name).toContain('Microservice');
    });

    it('should skip invalid attribute names', () => {
      const mockElement = {
        attributes: [
          { name: 'valid-attr', value: 'valid' },
          { name: '123invalid', value: 'invalid' },
          { name: 'also-valid_attr', value: 'valid' }
        ],
        tagName: 'MICROSERVICE'
      };
      
      const attributes = parser.extractAttributes(mockElement);
      
      expect(attributes['valid-attr']).toBe('valid');
      expect(attributes['123invalid']).toBeUndefined();
      expect(attributes['also-valid_attr']).toBe('valid');
    });

    it('should handle empty attribute values', () => {
      const mockElement = {
        attributes: [
          { name: 'name', value: '' },
          { name: 'brand', value: '   ' }
        ],
        tagName: 'MICROSERVICE'
      };
      
      const attributes = parser.extractAttributes(mockElement);
      
      // When name is empty, a default name is generated
      expect(attributes.name).toBeDefined();
      expect(attributes.brand).toBe('');
    });

    it('should handle special characters in attribute values', () => {
      const mockElement = {
        attributes: [
          { name: 'name', value: 'service-with-special@chars#123' },
          { name: 'description', value: 'Service with "quotes" and spaces' }
        ],
        tagName: 'MICROSERVICE'
      };
      
      const attributes = parser.extractAttributes(mockElement);
      
      expect(attributes.name).toBe('service-with-special@chars#123');
      expect(attributes.description).toBe('Service with "quotes" and spaces');
    });
  });

  describe('validateElements method', () => {
    it('should delegate to ElementValidator', () => {
      const mockElements = [
        {
          type: 'microservice',
          id: 'service-1',
          attributes: { name: 'test-service' },
          children: [],
          connections: [],
          metadata: {}
        }
      ];
      
      // Mock validator response
      parser.validator.validateElements = jest.fn().mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });
      
      const result = parser.validateElements(mockElements);
      
      expect(parser.validator.validateElements).toHaveBeenCalledWith(mockElements);
      expect(result.isValid).toBe(true);
    });

    it('should return validation errors from validator', () => {
      const mockElements = [
        {
          type: 'microservice',
          id: 'service-1',
          attributes: {},
          children: [],
          connections: ['non-existent'],
          metadata: {}
        }
      ];
      
      parser.validator.validateElements = jest.fn().mockReturnValue({
        isValid: false,
        errors: [
          {
            type: 'MISSING_REQUIRED_ATTRIBUTE',
            message: 'Missing required attribute name',
            elementId: 'service-1'
          }
        ],
        warnings: []
      });
      
      const result = parser.validateElements(mockElements);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('MISSING_REQUIRED_ATTRIBUTE');
    });
  });

  describe('private methods', () => {
    describe('_parseConnections', () => {
      it('should parse comma-separated connection string', () => {
        const connections = parser._parseConnections('db-1,cache-1,queue-1');
        expect(connections).toEqual(['db-1', 'cache-1', 'queue-1']);
      });

      it('should handle whitespace in connections', () => {
        const connections = parser._parseConnections(' db-1 , cache-1 , queue-1 ');
        expect(connections).toEqual(['db-1', 'cache-1', 'queue-1']);
      });

      it('should filter out empty connections', () => {
        const connections = parser._parseConnections('db-1,,cache-1,');
        expect(connections).toEqual(['db-1', 'cache-1']);
      });

      it('should filter out invalid ID characters', () => {
        const connections = parser._parseConnections('valid-id,invalid@id,another-valid_id');
        expect(connections).toEqual(['valid-id', 'another-valid_id']);
      });

      it('should return empty array for empty input', () => {
        expect(parser._parseConnections('')).toEqual([]);
        expect(parser._parseConnections(null)).toEqual([]);
        expect(parser._parseConnections(undefined)).toEqual([]);
      });
    });

    describe('_generateElementId', () => {
      it('should generate unique IDs based on element type', () => {
        const id1 = parser._generateElementId('microservice');
        const id2 = parser._generateElementId('microservice');
        const id3 = parser._generateElementId('database');
        
        expect(id1).toBe('microservice-1');
        expect(id2).toBe('microservice-2');
        expect(id3).toBe('database-3');
        expect(id1).not.toBe(id2);
      });
    });

    describe('_generateDefaultName', () => {
      it('should generate human-readable names for known types', () => {
        expect(parser._generateDefaultName('microservice')).toContain('Microservice');
        expect(parser._generateDefaultName('api-gateway')).toContain('API Gateway');
        expect(parser._generateDefaultName('database')).toContain('Database');
        expect(parser._generateDefaultName('load-balancer')).toContain('Load Balancer');
      });

      it('should generate generic name for unknown types', () => {
        expect(parser._generateDefaultName('unknown-type')).toContain('Component');
      });

      it('should include counter in generated names', () => {
        // The counter is based on elementIdCounter, so we need to call methods that increment it
        parser._generateElementId('microservice'); // This increments the counter
        const name1 = parser._generateDefaultName('microservice');
        parser._generateElementId('microservice'); // This increments the counter again
        const name2 = parser._generateDefaultName('microservice');
        
        expect(name1).not.toBe(name2);
        expect(name1).toMatch(/\d+$/);
        expect(name2).toMatch(/\d+$/);
      });
    });

    describe('_extractMetadata', () => {
      it('should extract non-standard attributes as metadata', () => {
        const attributes = {
          id: 'service-1',
          name: 'test-service',
          brand: 'nodejs',
          connects: 'db-1',
          'custom-attr': 'custom-value',
          'data-test': 'test-data'
        };
        
        const metadata = parser._extractMetadata(attributes);
        
        expect(metadata['custom-attr']).toBe('custom-value');
        expect(metadata['data-test']).toBe('test-data');
        expect(metadata.id).toBeUndefined();
        expect(metadata.name).toBeUndefined();
        expect(metadata.brand).toBeUndefined();
        expect(metadata.connects).toBeUndefined();
      });

      it('should return empty object when no custom attributes', () => {
        const attributes = {
          id: 'service-1',
          name: 'test-service',
          brand: 'nodejs'
        };
        
        const metadata = parser._extractMetadata(attributes);
        
        expect(Object.keys(metadata)).toHaveLength(0);
      });
    });

    describe('_calculateStatistics', () => {
      it('should calculate correct statistics for flat structure', () => {
        const elements = [
          {
            type: 'microservice',
            connections: ['db-1'],
            children: []
          },
          {
            type: 'database',
            connections: [],
            children: []
          }
        ];
        
        const stats = parser._calculateStatistics(elements);
        
        expect(stats.elementCount).toBe(2);
        expect(stats.connectionCount).toBe(1);
        expect(stats.topLevelElements).toBe(2);
        expect(stats.averageConnectionsPerElement).toBe(0.5);
      });

      it('should calculate correct statistics for nested structure', () => {
        const elements = [
          {
            type: 'microservice',
            connections: ['db-1'],
            children: [
              {
                type: 'database',
                connections: [],
                children: []
              }
            ]
          }
        ];
        
        const stats = parser._calculateStatistics(elements);
        
        expect(stats.elementCount).toBe(2);
        expect(stats.connectionCount).toBe(1);
        expect(stats.topLevelElements).toBe(1);
        expect(stats.averageConnectionsPerElement).toBe(0.5);
      });

      it('should handle empty elements array', () => {
        const stats = parser._calculateStatistics([]);
        
        expect(stats.elementCount).toBe(0);
        expect(stats.connectionCount).toBe(0);
        expect(stats.topLevelElements).toBe(0);
        expect(stats.averageConnectionsPerElement).toBe(0);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should parse complex architectural diagram', () => {
      const html = `
        <api-gateway name="main-gateway" brand="nginx" connects="user-service,order-service">
          <load-balancer name="internal-lb" brand="haproxy"></load-balancer>
        </api-gateway>
        <microservice name="user-service" brand="nodejs" connects="user-db,user-cache">
          <database name="user-db" id="user-db" brand="postgresql"></database>
          <cache name="user-cache" id="user-cache" brand="redis"></cache>
        </microservice>
        <microservice name="order-service" brand="java" connects="order-db,message-queue">
          <database name="order-db" id="order-db" brand="mysql"></database>
          <queue name="message-queue" id="message-queue" brand="rabbitmq"></queue>
        </microservice>
        <external-service name="payment-api" brand="rest-api"></external-service>
      `;
      
      // Mock complex DOM structure
      const mockContainer = {
        innerHTML: html,
        childNodes: [
          {
            nodeType: 1,
            tagName: 'API-GATEWAY',
            attributes: [
              { name: 'name', value: 'main-gateway' },
              { name: 'brand', value: 'nginx' },
              { name: 'connects', value: 'user-service,order-service' }
            ],
            childNodes: [{
              nodeType: 1,
              tagName: 'LOAD-BALANCER',
              attributes: [
                { name: 'name', value: 'internal-lb' },
                { name: 'brand', value: 'haproxy' }
              ],
              childNodes: []
            }]
          },
          {
            nodeType: 1,
            tagName: 'MICROSERVICE',
            attributes: [
              { name: 'name', value: 'user-service' },
              { name: 'brand', value: 'nodejs' },
              { name: 'connects', value: 'user-db,user-cache' }
            ],
            childNodes: [
              {
                nodeType: 1,
                tagName: 'DATABASE',
                attributes: [
                  { name: 'name', value: 'user-db' },
                  { name: 'id', value: 'user-db' },
                  { name: 'brand', value: 'postgresql' }
                ],
                childNodes: []
              },
              {
                nodeType: 1,
                tagName: 'CACHE',
                attributes: [
                  { name: 'name', value: 'user-cache' },
                  { name: 'id', value: 'user-cache' },
                  { name: 'brand', value: 'redis' }
                ],
                childNodes: []
              }
            ]
          },
          {
            nodeType: 1,
            tagName: 'MICROSERVICE',
            attributes: [
              { name: 'name', value: 'order-service' },
              { name: 'brand', value: 'java' },
              { name: 'connects', value: 'order-db,message-queue' }
            ],
            childNodes: [
              {
                nodeType: 1,
                tagName: 'DATABASE',
                attributes: [
                  { name: 'name', value: 'order-db' },
                  { name: 'id', value: 'order-db' },
                  { name: 'brand', value: 'mysql' }
                ],
                childNodes: []
              },
              {
                nodeType: 1,
                tagName: 'QUEUE',
                attributes: [
                  { name: 'name', value: 'message-queue' },
                  { name: 'id', value: 'message-queue' },
                  { name: 'brand', value: 'rabbitmq' }
                ],
                childNodes: []
              }
            ]
          },
          {
            nodeType: 1,
            tagName: 'EXTERNAL-SERVICE',
            attributes: [
              { name: 'name', value: 'payment-api' },
              { name: 'brand', value: 'rest-api' }
            ],
            childNodes: []
          }
        ]
      };
      
      mockDocument.createElement.mockReturnValue(mockContainer);
      
      const result = parser.parseHTML(html);
      
      // The result may have validation errors due to connection validation
      // but the parsing should succeed and elements should be extracted
      expect(result.elements).toHaveLength(4); // gateway, 2 services, external service
      expect(result.statistics.elementCount).toBe(9); // All elements including nested (1 gateway + 1 lb + 2 services + 2 dbs + 1 cache + 1 queue + 1 external)
      expect(result.statistics.connectionCount).toBe(6); // All connections
      
      // Verify structure
      const gateway = result.elements[0];
      expect(gateway.type).toBe('api-gateway');
      expect(gateway.children).toHaveLength(1);
      expect(gateway.connections).toEqual(['user-service', 'order-service']);
      
      const userService = result.elements[1];
      expect(userService.type).toBe('microservice');
      expect(userService.children).toHaveLength(2);
      expect(userService.connections).toEqual(['user-db', 'user-cache']);
    });

    it('should handle parsing errors gracefully in complex scenarios', () => {
      // Mock parsing error during complex parsing
      mockDocument.createElement.mockImplementation(() => {
        throw new Error('DOM parsing failed');
      });
      
      const html = '<microservice name="test"></microservice>';
      const result = parser.parseHTML(html);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('PARSE_ERROR');
      expect(result.elements).toHaveLength(0);
    });
  });
});