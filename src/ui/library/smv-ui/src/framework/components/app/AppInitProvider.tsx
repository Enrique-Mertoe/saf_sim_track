"use client"
import React, {createContext, ReactNode, useEffect} from "react";
import {LifecycleEvent, LifecycleRegistry, LifecycleState, useLifecycle} from "@/ui/library/smv-ui/src";
import {ScreenProvider} from "@/ui/library/smv-ui/src/framework/utility/Screen";

interface ComponentActivityProps {
    children: ReactNode;
    className?: string;
}

const AppInitContext = createContext<LifecycleRegistry | null>(null);

/**
 * Activity component - represents a full-screen component with lifecycle
 */
export const SMVAppProvider: React.FC<ComponentActivityProps> = ({children, className}) => {
    const lifecycle = useLifecycle();
    useEffect(() => {
        lifecycle.addObserver({
            onStateChanged(state: LifecycleState, event: LifecycleEvent) {
                // console.log(state, event)
            }
        })
    }, []);


    return (
        <AppInitContext.Provider value={lifecycle}>
            <ScreenProvider>
                <div
                    className={`bg-gray-50 m-0 dark:bg-gray-900 w-full min-h-screen ${className || ''}`}>
                    {children}
                </div>
            </ScreenProvider>
        </AppInitContext.Provider>
    );
};