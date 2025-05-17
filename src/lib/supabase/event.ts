import SignalEvent from "@/lib/supabase/signal";
import {createSupabaseClient} from "@/lib/supabase/client";
import {SupabaseClient} from "@supabase/supabase-js";
import {RealtimeChannel} from "@supabase/realtime-js";

import {useEffect, useRef} from "react";

/**
 * Event data type that comes from Supabase realtime
 */
export type SupabaseRealtimePayload<T = any> = {
    /** The event type (INSERT, UPDATE, DELETE, etc.) */
    eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT' | '*';
    /** The table the change occurred in */
    table: string;
    /** The schema the change occurred in */
    schema: string;
    /** Data of the changed record (new version for INSERT/UPDATE, old version for DELETE) */
    new: T | null;
    /** Previous data of the changed record (for UPDATE/DELETE) */
    old: T | null;
};

/**
 * Supabase event types
 */
export type SupabaseEventType = 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT' | '*';

/**
 * Options for SupabaseSignal constructor
 */
export interface SupabaseSignalOptions {
    /** Supabase URL (if not providing a client) */
    supabaseUrl?: string;
    /** Supabase anonymous key (if not providing a client) */
    supabaseKey?: string;
    /** Optional existing Supabase client */
    client?: SupabaseClient;
    /** Auto-connect to realtime on instantiation */
    autoConnect?: boolean;
    /** Schema to use (defaults to 'public') */
    schema?: string;
}

/**
 * Extended SignalEvent for Supabase realtime events
 * Makes it easy to listen for database changes in React components
 */
class SupabaseSignal<T = any> extends SignalEvent {
    private supabase: SupabaseClient;
    private tableName: string;
    private schema: string;
    private channel: RealtimeChannel | null = null;
    private isConnected: boolean = false;

    /**
     * Creates a new SupabaseSignal instance for a specific table
     * @param tableName The name of the table to subscribe to
     * @param options Configuration options
     */
    constructor(tableName: string, options: SupabaseSignalOptions = {}) {
        super();
        this.tableName = tableName;
        this.schema = options.schema || 'public';

        // Initialize Supabase client
        if (options.client) {
            this.supabase = options.client;
        } else {
            this.supabase = createSupabaseClient();
        }

        // Auto-connect if specified
        if (options.autoConnect) {
            this.connect().then();
        }
    }

    /**
     * Connect to Supabase realtime and start listening for changes
     * @returns Promise that resolves when connected
     */
    async connect(): Promise<void> {
        if (this.isConnected) return;

        // Create a channel for this table
        this.channel = this.supabase
            .channel(`table:${this.tableName}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: this.schema,
                    table: this.tableName
                },
                (payload) => {
                    // Convert payload to our standard format
                    const eventData: SupabaseRealtimePayload<T> = {
                        eventType: payload.eventType as SupabaseEventType,
                        table: payload.table,
                        schema: payload.schema,
                        new: payload.new as T,
                        old: payload.old as T
                    };

                    // Emit specific event type (INSERT, UPDATE, DELETE)
                    this.emit(payload.eventType, eventData);

                    // Also emit wildcard event
                    this.emit('*', eventData);
                }
            )
            .subscribe();

        this.isConnected = true;
    }

    /**
     * Disconnect from Supabase realtime
     */
    disconnect(): void {
        if (!this.isConnected || !this.channel) return;

        this.supabase.removeChannel(this.channel);
        this.channel = null;
        this.isConnected = false;
    }

    /**
     * Listen for a specific CRUD operation on the table
     * @param eventType The database event type (INSERT, UPDATE, DELETE or * for all)
     * @param handler Function to handle the event
     * @returns this instance for method chaining
     */
    onCrud(eventType: SupabaseEventType, handler: (data: SupabaseRealtimePayload<T>) => void): this {
        if (!this.isConnected) {
            this.connect();
        }
        return this.on(eventType, handler);
    }

    /**
     * Listen for any CRUD operation on the table
     * @param handler Function to handle the event
     * @returns this instance for method chaining
     */
    onAny(handler: (data: SupabaseRealtimePayload<T>) => void): this {
        if (!this.isConnected) {
            this.connect();
        }
        return this.on('*', handler);
    }

    /**
     * Listen for INSERT operations on the table
     * @param handler Function to handle the event
     * @returns this instance for method chaining
     */
    onInsert(handler: (data: SupabaseRealtimePayload<T>) => void): this {
        return this.onCrud('INSERT', handler);
    }

    /**
     * Listen for UPDATE operations on the table
     * @param handler Function to handle the event
     * @returns this instance for method chaining
     */
    onUpdate(handler: (data: SupabaseRealtimePayload<T>) => void): this {
        return this.onCrud('UPDATE', handler);
    }

    /**
     * Listen for DELETE operations on the table
     * @param handler Function to handle the event
     * @returns this instance for method chaining
     */
    onDelete(handler: (data: SupabaseRealtimePayload<T>) => void): this {
        return this.onCrud('DELETE', handler);
    }

    /**
     * Cleans up resources when component unmounts
     */
    cleanup(): void {
        this.disconnect();
        this.removeAllListeners();
    }
}

/**
 * React hook for using SupabaseSignal in functional components
 */
export function useSupabaseSignal<T = any>(
    tableName: string,
    options: SupabaseSignalOptions = {}
): SupabaseSignal<T> {

    // Create a ref to store the signal instance
    const signalRef = useRef<SupabaseSignal<T> | null>(null);

    if (!signalRef.current) {
        signalRef.current = new SupabaseSignal<T>(tableName, options);
    }

    // Clean up on component unmount
    useEffect(() => {
        return () => {
            if (signalRef.current) {
                signalRef.current.cleanup();
            }
        };
    }, []);

    return signalRef.current;
}

export default SupabaseSignal;

// EXAMPLE USAGE IN REACT:

/*
import React, { useEffect, useState } from 'react';
import { useSupabaseSignal } from './SupabaseSignal';

// Define your data type
type Todo = {
  id: number;
  task: string;
  is_complete: boolean;
};

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Initialize the signal for 'todos' table
  const todoSignal = useSupabaseSignal<Todo>('todos', {
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseKey: 'your-anon-key',
    autoConnect: true
  });

  // Load initial data
  useEffect(() => {
    const fetchTodos = async () => {
      const { data } = await todoSignal.supabase
        .from('todos')
        .select('*');

      if (data) setTodos(data);
    };

    fetchTodos();
  }, []);

  // Subscribe to INSERT events
  useEffect(() => {
    todoSignal.onInsert((payload) => {
      if (payload.new) {
        setTodos(prev => [...prev, payload.new!]);
      }
    });

    todoSignal.onUpdate((payload) => {
      if (payload.new) {
        setTodos(prev =>
          prev.map(todo => todo.id === payload.new!.id ? payload.new! : todo)
        );
      }
    });

    todoSignal.onDelete((payload) => {
      if (payload.old) {
        setTodos(prev =>
          prev.filter(todo => todo.id !== payload.old!.id)
        );
      }
    });
  }, []);

  return (
    <div>
      <h1>Todo List</h1>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {todo.task} - {todo.is_complete ? 'Done' : 'Pending'}
          </li>
        ))}
      </ul>
    </div>
  );
}
*/