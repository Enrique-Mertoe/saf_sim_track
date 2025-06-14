#!/bin/bash

# SMV-UI Lifecycle Library Setup Script
# Run this from ui/smv-ui directory

set -e

echo "🚀 Setting up SMV-UI Lifecycle Library..."

# Create directory structure
echo "📁 Creating directory structure..."

mkdir -p src/lifecycle/core
mkdir -p src/lifecycle/components
mkdir -p src/lifecycle/hooks
mkdir -p src/lifecycle/observers
mkdir -p src/lifecycle/decorators
mkdir -p src/lifecycle/utils
mkdir -p src/lifecycle/types
mkdir -p src/__tests__/lifecycle/core
mkdir -p src/__tests__/lifecycle/components
mkdir -p src/__tests__/lifecycle/hooks
mkdir -p src/__tests__/lifecycle/observers
mkdir -p src/examples

echo "✅ Directory structure created!"

# Create core files
echo "📝 Creating core lifecycle files..."

# LifecycleState.ts
cat > src/lifecycle/core/LifecycleState.ts << 'EOF'
/**
 * Lifecycle states matching Android's Activity lifecycle
 */
export enum LifecycleState {
  INITIALIZED = 'INITIALIZED',
  CREATED = 'CREATED',
  STARTED = 'STARTED',
  RESUMED = 'RESUMED',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  DESTROYED = 'DESTROYED'
}

/**
 * Lifecycle events that trigger state changes
 */
export enum LifecycleEvent {
  ON_CREATE = 'ON_CREATE',
  ON_START = 'ON_START',
  ON_RESUME = 'ON_RESUME',
  ON_PAUSE = 'ON_PAUSE',
  ON_STOP = 'ON_STOP',
  ON_DESTROY = 'ON_DESTROY'
}

/**
 * Check if current state is at least the target state
 */
export function isAtLeast(current: LifecycleState, target: LifecycleState): boolean {
  const states = Object.values(LifecycleState);
  const currentIndex = states.indexOf(current);
  const targetIndex = states.indexOf(target);
  return currentIndex >= targetIndex;
}
EOF

# LifecycleOwner.ts
cat > src/lifecycle/core/LifecycleOwner.ts << 'EOF'
import { Lifecycle } from './Lifecycle';

/**
 * Interface for components that have a lifecycle
 */
export interface LifecycleOwner {
  getLifecycle(): Lifecycle;
}

/**
 * Check if an object implements LifecycleOwner
 */
export function isLifecycleOwner(obj: any): obj is LifecycleOwner {
  return obj && typeof obj.getLifecycle === 'function';
}
EOF

# LifecycleObserver.ts
cat > src/lifecycle/core/LifecycleObserver.ts << 'EOF'
import { LifecycleEvent, LifecycleState } from './LifecycleState';

/**
 * Base interface for lifecycle observers
 */
export interface LifecycleObserver {
  onStateChanged?(state: LifecycleState, event: LifecycleEvent): void;
}

/**
 * Full lifecycle observer with individual event methods
 */
export interface FullLifecycleObserver extends LifecycleObserver {
  onCreate?(): void;
  onStart?(): void;
  onResume?(): void;
  onPause?(): void;
  onStop?(): void;
  onDestroy?(): void;
}

/**
 * Event-specific observer
 */
export interface LifecycleEventObserver extends LifecycleObserver {
  onStateChanged(state: LifecycleState, event: LifecycleEvent): void;
}
EOF

# Lifecycle.ts
cat > src/lifecycle/core/Lifecycle.ts << 'EOF'
import { LifecycleState, LifecycleEvent } from './LifecycleState';
import { LifecycleObserver, FullLifecycleObserver } from './LifecycleObserver';

/**
 * Main lifecycle class that manages state and observers
 */
export abstract class Lifecycle {
  abstract getCurrentState(): LifecycleState;
  abstract addObserver(observer: LifecycleObserver): void;
  abstract removeObserver(observer: LifecycleObserver): void;
}

/**
 * Registry implementation of Lifecycle
 */
export class LifecycleRegistry extends Lifecycle {
  private state: LifecycleState = LifecycleState.INITIALIZED;
  private observers: Set<LifecycleObserver> = new Set();

  getCurrentState(): LifecycleState {
    return this.state;
  }

  addObserver(observer: LifecycleObserver): void {
    this.observers.add(observer);
  }

  removeObserver(observer: LifecycleObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Mark the current state and notify observers
   */
  markState(state: LifecycleState): void {
    this.setCurrentState(state);
  }

  /**
   * Handle lifecycle event and transition to appropriate state
   */
  handleLifecycleEvent(event: LifecycleEvent): void {
    const newState = this.getStateAfter(event);
    this.setCurrentState(newState);
    this.notifyObservers(newState, event);
  }

  private setCurrentState(state: LifecycleState): void {
    this.state = state;
  }

  private notifyObservers(state: LifecycleState, event: LifecycleEvent): void {
    this.observers.forEach(observer => {
      // Notify general state change
      if (observer.onStateChanged) {
        observer.onStateChanged(state, event);
      }

      // Notify specific lifecycle methods
      const fullObserver = observer as FullLifecycleObserver;
      switch (event) {
        case LifecycleEvent.ON_CREATE:
          fullObserver.onCreate?.();
          break;
        case LifecycleEvent.ON_START:
          fullObserver.onStart?.();
          break;
        case LifecycleEvent.ON_RESUME:
          fullObserver.onResume?.();
          break;
        case LifecycleEvent.ON_PAUSE:
          fullObserver.onPause?.();
          break;
        case LifecycleEvent.ON_STOP:
          fullObserver.onStop?.();
          break;
        case LifecycleEvent.ON_DESTROY:
          fullObserver.onDestroy?.();
          break;
      }
    });
  }

  private getStateAfter(event: LifecycleEvent): LifecycleState {
    switch (event) {
      case LifecycleEvent.ON_CREATE:
        return LifecycleState.CREATED;
      case LifecycleEvent.ON_START:
        return LifecycleState.STARTED;
      case LifecycleEvent.ON_RESUME:
        return LifecycleState.RESUMED;
      case LifecycleEvent.ON_PAUSE:
        return LifecycleState.PAUSED;
      case LifecycleEvent.ON_STOP:
        return LifecycleState.STOPPED;
      case LifecycleEvent.ON_DESTROY:
        return LifecycleState.DESTROYED;
      default:
        return this.state;
    }
  }
}
EOF

# React hooks
echo "🔧 Creating React hooks..."

# useLifecycle.ts
cat > src/lifecycle/hooks/useLifecycle.ts << 'EOF'
import { useRef, useEffect } from 'react';
import { LifecycleRegistry } from '../core/Lifecycle';
import { LifecycleEvent } from '../core/LifecycleState';

/**
 * Main hook for lifecycle management in React components
 */
export function useLifecycle() {
  const lifecycleRef = useRef<LifecycleRegistry>();

  if (!lifecycleRef.current) {
    lifecycleRef.current = new LifecycleRegistry();
  }

  const lifecycle = lifecycleRef.current;

  useEffect(() => {
    // Component mounted - trigger CREATE and START
    lifecycle.handleLifecycleEvent(LifecycleEvent.ON_CREATE);
    lifecycle.handleLifecycleEvent(LifecycleEvent.ON_START);
    lifecycle.handleLifecycleEvent(LifecycleEvent.ON_RESUME);

    return () => {
      // Component unmounting - trigger PAUSE, STOP, DESTROY
      lifecycle.handleLifecycleEvent(LifecycleEvent.ON_PAUSE);
      lifecycle.handleLifecycleEvent(LifecycleEvent.ON_STOP);
      lifecycle.handleLifecycleEvent(LifecycleEvent.ON_DESTROY);
    };
  }, [lifecycle]);

  return lifecycle;
}
EOF

# useLifecycleObserver.ts
cat > src/lifecycle/hooks/useLifecycleObserver.ts << 'EOF'
import { useEffect } from 'react';
import { LifecycleRegistry } from '../core/Lifecycle';
import { FullLifecycleObserver } from '../core/LifecycleObserver';

/**
 * Hook to observe lifecycle events
 */
export function useLifecycleObserver(
  lifecycle: LifecycleRegistry,
  observer: FullLifecycleObserver
) {
  useEffect(() => {
    lifecycle.addObserver(observer);

    return () => {
      lifecycle.removeObserver(observer);
    };
  }, [lifecycle, observer]);
}
EOF

# Activity component
echo "🎯 Creating Activity component..."

cat > src/lifecycle/components/Activity.tsx << 'EOF'
import React, { ReactNode, createContext, useContext } from 'react';
import { useLifecycle } from '../hooks/useLifecycle';
import { LifecycleRegistry } from '../core/Lifecycle';
import { LifecycleOwner } from '../core/LifecycleOwner';

interface ActivityProps {
  children: ReactNode;
  className?: string;
}

const ActivityContext = createContext<LifecycleRegistry | null>(null);

/**
 * Activity component - represents a full-screen component with lifecycle
 */
export const Activity: React.FC<ActivityProps> = ({ children, className }) => {
  const lifecycle = useLifecycle();

  return (
    <ActivityContext.Provider value={lifecycle}>
      <div className={`smv-activity ${className || ''}`}>
        {children}
      </div>
    </ActivityContext.Provider>
  );
};

/**
 * Hook to get the current activity's lifecycle
 */
export function useActivityLifecycle(): LifecycleRegistry {
  const lifecycle = useContext(ActivityContext);
  if (!lifecycle) {
    throw new Error('useActivityLifecycle must be used within an Activity component');
  }
  return lifecycle;
}

/**
 * HOC to make a component lifecycle-aware
 */
export function withLifecycle<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => (
    <Activity>
      <Component {...props} />
    </Activity>
  );
}
EOF

# Fragment component
cat > src/lifecycle/components/Fragment.tsx << 'EOF'
import React, { ReactNode } from 'react';
import { useLifecycle } from '../hooks/useLifecycle';
import { LifecycleRegistry } from '../core/Lifecycle';

interface FragmentProps {
  children: ReactNode;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}

/**
 * Fragment component - represents a reusable UI component with lifecycle
 */
export const Fragment: React.FC<FragmentProps> = ({
  children,
  className,
  tag: Tag = 'div'
}) => {
  const lifecycle = useLifecycle();

  return (
    <Tag className={`smv-fragment ${className || ''}`}>
      {children}
    </Tag>
  );
};

/**
 * Hook specifically for fragments
 */
export function useFragment(): LifecycleRegistry {
  return useLifecycle();
}
EOF

# Types
echo "📋 Creating type definitions..."

cat > src/lifecycle/types/index.ts << 'EOF'
// Core exports
export * from './LifecycleTypes';
export * from './ComponentTypes';
export * from './ObserverTypes';

// Re-export core classes and enums
export { LifecycleState, LifecycleEvent } from '../core/LifecycleState';
export { Lifecycle, LifecycleRegistry } from '../core/Lifecycle';
export { LifecycleOwner } from '../core/LifecycleOwner';
export {
  LifecycleObserver,
  FullLifecycleObserver,
  LifecycleEventObserver
} from '../core/LifecycleObserver';
EOF

cat > src/lifecycle/types/LifecycleTypes.ts << 'EOF'
import { LifecycleState, LifecycleEvent } from '../core/LifecycleState';

export interface LifecycleCallbacks {
  onCreate?: () => void;
  onStart?: () => void;
  onResume?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onDestroy?: () => void;
}

export interface LifecycleConfig {
  autoStart?: boolean;
  logging?: boolean;
  strictMode?: boolean;
}

export type LifecycleEventCallback = (state: LifecycleState, event: LifecycleEvent) => void;
EOF

# Main library export
cat > src/lifecycle/index.ts << 'EOF'
// Core exports
export * from './core/LifecycleState';
export * from './core/Lifecycle';
export * from './core/LifecycleOwner';
export * from './core/LifecycleObserver';

// Component exports
export * from './components/Activity';
export * from './components/Fragment';

// Hook exports
export * from './hooks/useLifecycle';
export * from './hooks/useLifecycleObserver';

// Type exports
export * from './types';

// Default export for convenience
export { LifecycleRegistry as default } from './core/Lifecycle';
EOF

# Main src index
cat > src/index.ts << 'EOF'
// SMV-UI Lifecycle Library
export * from './lifecycle';

// Version
export const VERSION = '1.0.0';
EOF

# Package.json
echo "📦 Creating package.json..."

cat > package.json << 'EOF'
{
  "name": "smv-ui-lifecycle",
  "version": "1.0.0",
  "description": "Android-like lifecycle management for React/Next.js applications",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "keywords": [
    "react",
    "nextjs",
    "lifecycle",
    "android",
    "state-management",
    "typescript"
  ],
  "author": "Your Name",
  "license": "MIT",
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/jest": "^29.0.0",
    "@rollup/plugin-commonjs": "^24.0.0",
    "@rollup/plugin-node-resolve": "^15.0.0",
    "@rollup/plugin-typescript": "^11.0.0",
    "jest": "^29.0.0",
    "rollup": "^3.0.0",
    "typescript": "^5.0.0",
    "tslib": "^2.5.0"
  }
}
EOF

# TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "jsx": "react-jsx",
    "module": "ESNext"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx"
  ]
}
EOF

# Rollup config for building
cat > rollup.config.js << 'EOF'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: ['react', 'react-dom'],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
    }),
  ],
};
EOF

# Basic example
cat > src/examples/BasicActivity.tsx << 'EOF'
import React from 'react';
import { Activity, useActivityLifecycle, useLifecycleObserver } from '../lifecycle';

const BasicActivityExample: React.FC = () => {
  const lifecycle = useActivityLifecycle();

  useLifecycleObserver(lifecycle, {
    onCreate: () => console.log('Activity created!'),
    onStart: () => console.log('Activity started!'),
    onResume: () => console.log('Activity resumed!'),
    onPause: () => console.log('Activity paused!'),
    onStop: () => console.log('Activity stopped!'),
    onDestroy: () => console.log('Activity destroyed!'),
  });

  return (
    <div>
      <h1>Basic Activity Example</h1>
      <p>Check the console to see lifecycle events!</p>
      <p>Current state: {lifecycle.getCurrentState()}</p>
    </div>
  );
};

export const BasicActivityPage: React.FC = () => {
  return (
    <Activity>
      <BasicActivityExample />
    </Activity>
  );
};
EOF

# README
cat > README.md << 'EOF'
# SMV-UI Lifecycle Library

Android-like lifecycle management for React/Next.js applications.

## Features

- 🔄 Complete lifecycle management (Created, Started, Resumed, Paused, Stopped, Destroyed)
- 👀 Observer pattern for lifecycle events
- ⚛️ React hooks integration
- 🎯 Activity and Fragment components
- 📱 Android-inspired API
- 🔧 TypeScript support

## Quick Start

```bash
npm install
npm run build
```

## Usage

```tsx
import { Activity, useActivityLifecycle, useLifecycleObserver } from 'smv-ui-lifecycle';

const MyComponent = () => {
  const lifecycle = useActivityLifecycle();

  useLifecycleObserver(lifecycle, {
    onResume: () => console.log('Component is active!'),
    onPause: () => console.log('Component is paused!'),
  });

  return <div>My Content</div>;
};

const App = () => (
  <Activity>
    <MyComponent />
  </Activity>
);
```

## Lifecycle States

- **INITIALIZED** - Component created but not mounted
- **CREATED** - Component mounted, before first render
- **STARTED** - Component visible, before interactions
- **RESUMED** - Component active and interactive
- **PAUSED** - Component still visible but not interactive
- **STOPPED** - Component not visible
- **DESTROYED** - Component unmounted

## License

MIT
EOF

echo "🎉 SMV-UI Lifecycle Library setup complete!"
echo ""
echo "Next steps:"
echo "1. cd ui/smv-ui"
echo "2. npm install"
echo "3. npm run build"
echo ""
echo "To test the library:"
echo "- Check src/examples/BasicActivity.tsx"
echo "- Import and use in your Next.js pages"
echo ""
echo "Happy coding! 🚀"