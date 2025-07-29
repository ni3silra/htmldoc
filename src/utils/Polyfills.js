/**
 * Polyfills Module
 * Provides graceful degradation and polyfills for unsupported browser features
 * Ensures the diagram library works across different browser versions
 */

/**
 * Polyfills manager for handling missing browser features
 * Provides fallbacks and polyfills for older browsers
 */
class Polyfills {
  constructor() {
    this.appliedPolyfills = new Set();
    this.init();
  }

  /**
   * Initializes and applies necessary polyfills
   * Detects missing features and applies appropriate fallbacks
   */
  init() {
    this.applyRequestAnimationFramePolyfill();
    this.applyPromisePolyfill();
    this.applyObjectAssignPolyfill();
    this.applyArrayFromPolyfill();
    this.applyCustomEventPolyfill();
    this.applyResizeObserverPolyfill();
    this.applyIntersectionObserverPolyfill();
  }

  /**
   * Polyfill for requestAnimationFrame
   * Provides smooth animation support for older browsers
   * Falls back to setTimeout with 60fps timing
   */
  applyRequestAnimationFramePolyfill() {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'undefined') {
      return;
    }

    let lastTime = 0;
    
    window.requestAnimationFrame = function(callback) {
      const currentTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currentTime - lastTime));
      const id = window.setTimeout(() => {
        callback(currentTime + timeToCall);
      }, timeToCall);
      
      lastTime = currentTime + timeToCall;
      return id;
    };

    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };

    this.appliedPolyfills.add('requestAnimationFrame');
  }

  /**
   * Polyfill for Promise support
   * Provides basic Promise implementation for older browsers
   * Includes then, catch, and resolve/reject methods
   */
  applyPromisePolyfill() {
    if (typeof window === 'undefined' || typeof window.Promise !== 'undefined') {
      return;
    }

    // Simple Promise polyfill for basic functionality
    window.Promise = function(executor) {
      const self = this;
      self.state = 'pending';
      self.value = undefined;
      self.handlers = [];

      function resolve(result) {
        if (self.state === 'pending') {
          self.state = 'fulfilled';
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function reject(error) {
        if (self.state === 'pending') {
          self.state = 'rejected';
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function handle(handler) {
        if (self.state === 'pending') {
          self.handlers.push(handler);
        } else {
          if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
            handler.onFulfilled(self.value);
          }
          if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
            handler.onRejected(self.value);
          }
        }
      }

      this.then = function(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {
          handle({
            onFulfilled: function(result) {
              try {
                const returnValue = onFulfilled ? onFulfilled(result) : result;
                resolve(returnValue);
              } catch (ex) {
                reject(ex);
              }
            },
            onRejected: function(error) {
              try {
                const returnValue = onRejected ? onRejected(error) : error;
                reject(returnValue);
              } catch (ex) {
                reject(ex);
              }
            }
          });
        });
      };

      this.catch = function(onRejected) {
        return this.then(null, onRejected);
      };

      executor(resolve, reject);
    };

    // Static methods
    window.Promise.resolve = function(value) {
      return new Promise((resolve) => resolve(value));
    };

    window.Promise.reject = function(reason) {
      return new Promise((resolve, reject) => reject(reason));
    };

    this.appliedPolyfills.add('Promise');
  }

  /**
   * Polyfill for Object.assign
   * Provides object property copying for older browsers
   * Essential for configuration merging and object manipulation
   */
  applyObjectAssignPolyfill() {
    if (typeof Object.assign === 'function') {
      return;
    }

    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      const to = Object(target);

      for (let index = 1; index < arguments.length; index++) {
        const nextSource = arguments[index];

        if (nextSource != null) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };

    this.appliedPolyfills.add('Object.assign');
  }

  /**
   * Polyfill for Array.from
   * Provides array creation from array-like objects
   * Used for converting NodeLists and other iterables
   */
  applyArrayFromPolyfill() {
    if (typeof Array.from === 'function') {
      return;
    }

    Array.from = function(arrayLike, mapFn, thisArg) {
      const C = this;
      const items = Object(arrayLike);
      
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }

      const mapFunction = mapFn === undefined ? undefined : mapFn;
      if (typeof mapFunction !== 'undefined' && typeof mapFunction !== 'function') {
        throw new TypeError('Array.from: when provided, the second argument must be a function');
      }

      const len = parseInt(items.length);
      const A = typeof C === 'function' ? Object(new C(len)) : new Array(len);

      let k = 0;
      while (k < len) {
        const kValue = items[k];
        const mappedValue = mapFunction ? mapFunction.call(thisArg, kValue, k) : kValue;
        A[k] = mappedValue;
        k += 1;
      }

      A.length = len;
      return A;
    };

    this.appliedPolyfills.add('Array.from');
  }

  /**
   * Polyfill for CustomEvent
   * Provides custom event creation for older browsers
   * Essential for diagram interaction events
   */
  applyCustomEventPolyfill() {
    if (typeof window === 'undefined' || typeof window.CustomEvent === 'function') {
      return;
    }

    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      if (typeof document !== 'undefined' && document.createEvent) {
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      }
      // Fallback for environments without document.createEvent
      return { type: event, detail: params.detail };
    }

    if (typeof window !== 'undefined' && window.Event) {
      CustomEvent.prototype = window.Event.prototype;
    }
    if (typeof window !== 'undefined') {
      window.CustomEvent = CustomEvent;
    }

    this.appliedPolyfills.add('CustomEvent');
  }

  /**
   * Polyfill for ResizeObserver
   * Provides element resize detection for older browsers
   * Falls back to window resize events with throttling
   */
  applyResizeObserverPolyfill() {
    if (typeof window === 'undefined' || typeof window.ResizeObserver !== 'undefined') {
      return;
    }

    class ResizeObserver {
      constructor(callback) {
        this.callback = callback;
        this.observedElements = new Map();
        this.resizeHandler = this.handleResize.bind(this);
      }

      observe(element) {
        if (this.observedElements.size === 0) {
          window.addEventListener('resize', this.resizeHandler);
        }

        const rect = element.getBoundingClientRect();
        this.observedElements.set(element, {
          width: rect.width,
          height: rect.height
        });
      }

      unobserve(element) {
        this.observedElements.delete(element);
        
        if (this.observedElements.size === 0) {
          window.removeEventListener('resize', this.resizeHandler);
        }
      }

      disconnect() {
        this.observedElements.clear();
        window.removeEventListener('resize', this.resizeHandler);
      }

      handleResize() {
        const entries = [];
        
        this.observedElements.forEach((lastSize, element) => {
          const rect = element.getBoundingClientRect();
          
          if (rect.width !== lastSize.width || rect.height !== lastSize.height) {
            this.observedElements.set(element, {
              width: rect.width,
              height: rect.height
            });

            entries.push({
              target: element,
              contentRect: rect
            });
          }
        });

        if (entries.length > 0) {
          this.callback(entries);
        }
      }
    }

    window.ResizeObserver = ResizeObserver;
    this.appliedPolyfills.add('ResizeObserver');
  }

  /**
   * Polyfill for IntersectionObserver
   * Provides element visibility detection for older browsers
   * Falls back to scroll event monitoring with throttling
   */
  applyIntersectionObserverPolyfill() {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'undefined') {
      return;
    }

    class IntersectionObserver {
      constructor(callback, options = {}) {
        this.callback = callback;
        this.options = {
          root: options.root || null,
          rootMargin: options.rootMargin || '0px',
          threshold: options.threshold || 0
        };
        this.observedElements = new Set();
        this.scrollHandler = this.throttle(this.handleScroll.bind(this), 100);
      }

      observe(element) {
        this.observedElements.add(element);
        
        if (this.observedElements.size === 1) {
          window.addEventListener('scroll', this.scrollHandler, true);
          window.addEventListener('resize', this.scrollHandler);
        }

        // Initial check
        this.checkIntersection(element);
      }

      unobserve(element) {
        this.observedElements.delete(element);
        
        if (this.observedElements.size === 0) {
          window.removeEventListener('scroll', this.scrollHandler, true);
          window.removeEventListener('resize', this.scrollHandler);
        }
      }

      disconnect() {
        this.observedElements.clear();
        window.removeEventListener('scroll', this.scrollHandler, true);
        window.removeEventListener('resize', this.scrollHandler);
      }

      handleScroll() {
        this.observedElements.forEach(element => {
          this.checkIntersection(element);
        });
      }

      checkIntersection(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        const isIntersecting = (
          rect.top < windowHeight &&
          rect.bottom > 0 &&
          rect.left < windowWidth &&
          rect.right > 0
        );

        const entry = {
          target: element,
          isIntersecting: isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: rect
        };

        this.callback([entry]);
      }

      throttle(func, limit) {
        let inThrottle;
        return function() {
          const args = arguments;
          const context = this;
          if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      }
    }

    window.IntersectionObserver = IntersectionObserver;
    this.appliedPolyfills.add('IntersectionObserver');
  }

  /**
   * Provides a fallback fetch implementation
   * Uses XMLHttpRequest for older browsers that don't support fetch
   * @returns {Function} Fetch polyfill function
   */
  getFetchPolyfill() {
    if (typeof window.fetch === 'function') {
      return window.fetch;
    }

    return function(url, options = {}) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const method = options.method || 'GET';
        
        xhr.open(method, url);
        
        // Set headers
        if (options.headers) {
          Object.keys(options.headers).forEach(key => {
            xhr.setRequestHeader(key, options.headers[key]);
          });
        }

        xhr.onload = function() {
          const response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            text: () => Promise.resolve(xhr.responseText),
            json: () => Promise.resolve(JSON.parse(xhr.responseText))
          };
          resolve(response);
        };

        xhr.onerror = function() {
          reject(new Error('Network error'));
        };

        xhr.send(options.body || null);
      });
    };
  }

  /**
   * Provides classList polyfill for older browsers
   * Adds support for add, remove, toggle, and contains methods
   * @param {HTMLElement} element - Element to add classList support to
   */
  addClassListPolyfill(element) {
    if (element.classList) {
      return;
    }

    element.classList = {
      add: function(className) {
        if (!this.contains(className)) {
          element.className += (element.className ? ' ' : '') + className;
        }
      },
      remove: function(className) {
        element.className = element.className.replace(
          new RegExp('(^|\\s)' + className + '(\\s|$)', 'g'), ' '
        ).trim();
      },
      toggle: function(className) {
        if (this.contains(className)) {
          this.remove(className);
        } else {
          this.add(className);
        }
      },
      contains: function(className) {
        return new RegExp('(^|\\s)' + className + '(\\s|$)').test(element.className);
      }
    };
  }

  /**
   * Gets the list of applied polyfills
   * @returns {Array} List of polyfill names that were applied
   */
  getAppliedPolyfills() {
    return Array.from(this.appliedPolyfills);
  }

  /**
   * Checks if a specific polyfill was applied
   * @param {string} polyfillName - Name of the polyfill to check
   * @returns {boolean} Whether the polyfill was applied
   */
  isPolyfillApplied(polyfillName) {
    return this.appliedPolyfills.has(polyfillName);
  }

  /**
   * Provides a safe way to use modern JavaScript features
   * Returns appropriate fallbacks for unsupported features
   * @returns {Object} Object with safe feature implementations
   */
  getSafeFeatures() {
    return {
      fetch: this.getFetchPolyfill(),
      requestAnimationFrame: window.requestAnimationFrame || function(cb) { 
        return setTimeout(cb, 16); 
      },
      cancelAnimationFrame: window.cancelAnimationFrame || function(id) { 
        clearTimeout(id); 
      },
      Promise: window.Promise,
      ObjectAssign: Object.assign,
      ArrayFrom: Array.from,
      CustomEvent: window.CustomEvent,
      ResizeObserver: window.ResizeObserver,
      IntersectionObserver: window.IntersectionObserver
    };
  }
}

export default Polyfills;