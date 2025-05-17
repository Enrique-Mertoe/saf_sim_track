/**
 * SignalEvent - A robust TypeScript event emitter with type safety
 *
 * Features:
 * - Type-safe event handling with generics
 * - Support for multiple listeners per event
 * - Resource management through listener removal
 * - One-time event listeners
 * - Wildcard event handling
 * - Asynchronous event emission option
 */

type EventHandler<T extends any[] = any[]> = (...args: T) => void | Promise<void>;

type EventMap = Record<string, EventHandler[]>;

interface EventEmitterOptions {
  /**
   * Maximum number of listeners per event
   * Default: 10
   */
  maxListeners?: number;

  /**
   * Whether to capture the stack trace when adding listeners
   * Useful for debugging but has performance impact
   * Default: false
   */
  captureRejections?: boolean;
}

class SignalEvent {
  private events: EventMap = {};
  private maxListeners: number;
  private captureRejections: boolean;
  private wildcardHandlers: EventHandler[] = [];

  /**
   * Creates a new SignalEvent instance
   * @param options Configuration options
   */
  constructor(options: EventEmitterOptions = {}) {
    this.maxListeners = options.maxListeners ?? 10;
    this.captureRejections = options.captureRejections ?? false;
  }

  /**
   * Registers an event handler for the specified event
   * @param eventName Name of the event to listen for
   * @param handler Function to execute when the event is emitted
   * @returns this instance for method chaining
   */
  on<T extends any[] = any[]>(eventName: string, handler: EventHandler<T>): this {
    if (eventName === '*') {
      this.wildcardHandlers.push(handler);
      return this;
    }

    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    if (this.events[eventName].length >= this.maxListeners) {
      console.warn(
        `Warning: Event "${eventName}" has exceeded the maximum listener count (${this.maxListeners}). ` +
        `This might be a memory leak in your application.`
      );
    }

    this.events[eventName].push(handler);
    return this;
  }

  /**
   * Registers a one-time event handler that will be removed after it's executed once
   * @param eventName Name of the event to listen for
   * @param handler Function to execute when the event is emitted
   * @returns this instance for method chaining
   */
  once<T extends any[] = any[]>(eventName: string, handler: EventHandler<T>): this {
    const onceWrapper: EventHandler = (...args: any[]) => {
      this.off(eventName, onceWrapper);
      //@ts-ignore
      handler(...args);
    };

    return this.on(eventName, onceWrapper);
  }

  /**
   * Removes an event handler for the specified event
   * @param eventName Name of the event to remove the handler from
   * @param handler Function to remove from the event listeners
   * @returns this instance for method chaining
   */
  off(eventName: string, handler?: EventHandler): this {
    if (eventName === '*') {
      if (handler) {
        const index = this.wildcardHandlers.indexOf(handler);
        if (index !== -1) {
          this.wildcardHandlers.splice(index, 1);
        }
      } else {
        this.wildcardHandlers = [];
      }
      return this;
    }

    if (!this.events[eventName]) {
      return this;
    }

    if (!handler) {
      // Remove all handlers for this event
      delete this.events[eventName];
      return this;
    }

    const index = this.events[eventName].indexOf(handler);
    if (index !== -1) {
      this.events[eventName].splice(index, 1);

      // Clean up empty arrays
      if (this.events[eventName].length === 0) {
        delete this.events[eventName];
      }
    }

    return this;
  }

  /**
   * Emits an event with the specified arguments
   * @param eventName Name of the event to emit
   * @param args Arguments to pass to the event handlers
   * @returns true if the event had listeners, false otherwise
   */
  emit(eventName: string, ...args: any[]): boolean {
    const handlers = this.events[eventName];
    const hasHandlers = !!(handlers && handlers.length) || this.wildcardHandlers.length > 0;

    if (handlers) {
      // Create a copy to prevent issues if handlers are removed during emission
      [...handlers].forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          if (this.captureRejections) {
            console.error(`Error in event handler for "${eventName}":`, error);
          } else {
            throw error;
          }
        }
      });
    }

    // Execute wildcard handlers
    this.wildcardHandlers.forEach(handler => {
      try {
        handler(eventName, ...args);
      } catch (error) {
        if (this.captureRejections) {
          console.error(`Error in wildcard handler for "${eventName}":`, error);
        } else {
          throw error;
        }
      }
    });

    return hasHandlers;
  }

  /**
   * Emits an event asynchronously, waiting for all handlers to complete
   * @param eventName Name of the event to emit
   * @param args Arguments to pass to the event handlers
   * @returns Promise that resolves when all handlers have completed
   */
  async emitAsync(eventName: string, ...args: any[]): Promise<void> {
    const handlers = this.events[eventName];
    const promises: Promise<void>[] = [];

    if (handlers) {
      // Create a copy to prevent issues if handlers are removed during emission
      [...handlers].forEach(handler => {
        try {
          const result = handler(...args);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          if (this.captureRejections) {
            console.error(`Error in event handler for "${eventName}":`, error);
          } else {
            throw error;
          }
        }
      });
    }

    // Execute wildcard handlers
    this.wildcardHandlers.forEach(handler => {
      try {
        const result = handler(eventName, ...args);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        if (this.captureRejections) {
          console.error(`Error in wildcard handler for "${eventName}":`, error);
        } else {
          throw error;
        }
      }
    });

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Returns the number of listeners for the specified event
   * @param eventName Name of the event to check
   * @returns Number of listeners for the event
   */
  listenerCount(eventName: string): number {
    const handlers = this.events[eventName];
    return (handlers ? handlers.length : 0) + (eventName === '*' ? 0 : this.wildcardHandlers.length);
  }

  /**
   * Returns an array of all registered event names
   * @returns Array of event names
   */
  eventNames(): string[] {
    return Object.keys(this.events);
  }

  /**
   * Returns all listeners for the specified event
   * @param eventName Name of the event to get listeners for
   * @returns Array of listener functions
   */
  listeners(eventName: string): EventHandler[] {
    const handlers = this.events[eventName];
    return handlers ? [...handlers] : [];
  }

  /**
   * Removes all event listeners
   * @returns this instance for method chaining
   */
  removeAllListeners(eventName?: string): this {
    if (eventName) {
      delete this.events[eventName];
      if (eventName === '*') {
        this.wildcardHandlers = [];
      }
    } else {
      this.events = {};
      this.wildcardHandlers = [];
    }
    return this;
  }

  /**
   * Sets the maximum number of listeners per event
   * @param n Maximum number of listeners
   * @returns this instance for method chaining
   */
  setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  /**
   * Returns the current maximum listeners value
   * @returns Maximum number of listeners per event
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }
}

export default SignalEvent;



// Usage examples:
/*
// Basic usage
const events = new SignalEvent();

// Add event listener
events.on('userLogin', (userId: string, timestamp: number) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

// Emit event
events.emit('userLogin', 'user123', Date.now());

// One-time event
events.once('initialize', () => {
  console.log('Initialization done!');
});

// Remove listener
const handler = () => console.log('Notification received');
events.on('notification', handler);
events.off('notification', handler);

// Wildcard listeners
events.on('*', (eventName, ...args) => {
  console.log(`Event "${eventName}" was triggered with args:`, args);
});

// Async event handling
events.on('dataFetch', async (id) => {
  const data = await fetchData(id);
  // process data
});

await events.emitAsync('dataFetch', '12345');
*/