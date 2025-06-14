"use client"
import React, {createContext, ReactNode, useContext} from 'react';
import {useLifecycle} from '../hooks/useLifecycle';
import {Lifecycle, LifecycleRegistry} from '../core/Lifecycle';
import {LifecycleOwner} from '../core/LifecycleOwner';

interface ComponentActivityProps {
    children: ReactNode;
    className?: string;
}

const ActivityContext = createContext<LifecycleRegistry | null>(null);

/**
 * Activity component - represents a full-screen component with lifecycle
 */
export const ComponentActivity: React.FC<ComponentActivityProps> = ({children, className}) => {
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
    return function WrappedComponent (props: P){
        return (
            <ComponentActivity>
                <Component {...props} />
            </ComponentActivity>
        );
    }
}

type ActivityProps = LifecycleOwner & {}
export const Activity: () => ActivityProps = () => {
    return {
        getLifecycle(): Lifecycle {
            return 9 as any
        }
    }
}