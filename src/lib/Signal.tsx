class Signal {
    private static eventHandlers: Record<string, Closure[]> = {};
    private static plugins: Record<string, Closure> = {};

    /**
     * Attach an event listener.
     */
    static on(action: string, handler: Closure): void {

        if (!this.eventHandlers[action]) {
            this.eventHandlers[action] = [];
        }
        this.eventHandlers[action].push(handler);
    }

    /**
     * Attach a one-time event listener.
     */
    static once(action: string, handler: Closure): void {
        const wrapper = (...args: Closure[]) => {
            handler(...args);
            this.off(action, wrapper);
        };
        this.on(action, wrapper);
    }

    /**
     * Remove a specific event handler or all handlers for an event.
     */
    static off(action: string, handler?: Closure): void {
        if (!this.eventHandlers[action]) return;

        if (!handler) {
            delete this.eventHandlers[action];
        } else {
            this.eventHandlers[action] = this.eventHandlers[action].filter(h => h !== handler);
        }
    }

    /**
     * Trigger an event with optional arguments.
     */
    static trigger(action: string, ...args: unknown[]): void {
        this.eventHandlers[action]?.forEach(handler => handler(...args));
    }

    /**
     * Get a list of all registered event names.
     */
    static events(): string[] {
        return Object.keys(this.eventHandlers);
    }

    /**
     * Check if an event has any registered handlers.
     */
    static has(action: string): boolean {
        return !!this.eventHandlers[action]?.length;
    }

    /**
     * Remove all event listeners.
     */
    static clearAll(): void {
        this.eventHandlers = {};
    }

    /**
     * Register a plugin for extending Listener.
     */
    static registerPlugin(name: string, plugin: (box: typeof Signal, ...args: unknown[]) => unknown): void {
        if (this.plugins[name]) {
            throw new Error(`Plugin "${name}" is already registered.`);
        }
        this.plugins[name] = plugin;
    }

    /**
     * Use a registered plugin.
     */
    static use(name: string, ...args: unknown[]): unknown {
        if (!this.plugins[name]) {
            throw new Error(`Plugin "${name}" is not registered.`);
        }
        return this.plugins[name](this, ...args);
    }

    /**
     * Get a list of registered plugins.
     */
    static pluginsList(): string[] {
        return Object.keys(this.plugins);
    }

    static get(action: string) {
        return this.eventHandlers[action]
    }
}

export default Signal;
