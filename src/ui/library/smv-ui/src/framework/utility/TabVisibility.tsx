"use client"
// components/TabVisibilityProvider.tsx
import React, {createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState} from 'react';

export interface TabVisibilityState {
    isVisible: boolean;
    isActive: boolean;
    visibilityState: DocumentVisibilityState;
    isTabSwitching: boolean;
    lastVisibilityChange: Date | null;
    timeHidden: number; // milliseconds
}

export interface TabVisibilityCallbacks {
    onShow?: () => void;
    onHide?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onBeforeUnload?: () => void;
    onVisibilityChange?: (state: TabVisibilityState) => void;
}

/**
 * Hook to detect tab visibility and switching in Next.js
 */
export function useTabVisibility(callbacks?: TabVisibilityCallbacks) {
    const [state, setState] = useState<TabVisibilityState>({
        isVisible: true,
        isActive: true,
        visibilityState: 'visible',
        isTabSwitching: false,
        lastVisibilityChange: null,
        timeHidden: 0,
    });

    const hideTimeRef = useRef<number | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updateState = useCallback((updates: Partial<TabVisibilityState>) => {
        setState(prev => {
            const newState = { ...prev, ...updates };
            callbacks?.onVisibilityChange?.(newState);
            return newState;
        });
    }, [callbacks]);

    // Handle visibility change (tab switching, minimizing, etc.)
    const handleVisibilityChange = useCallback(() => {
        const isVisible = !document.hidden;
        const visibilityState = document.visibilityState;
        const now = Date.now();

        if (!isVisible && hideTimeRef.current === null) {
            // Tab became hidden
            hideTimeRef.current = now;
            callbacks?.onHide?.();

            updateState({
                isVisible: false,
                isActive: false,
                visibilityState,
                isTabSwitching: true,
                lastVisibilityChange: new Date(),
            });

            // Reset tab switching flag after a delay
            timeoutRef.current = setTimeout(() => {
                updateState({ isTabSwitching: false });
            }, 1000);

        } else if (isVisible && hideTimeRef.current !== null) {
            // Tab became visible
            const timeHidden = now - hideTimeRef.current;
            hideTimeRef.current = null;
            callbacks?.onShow?.();

            updateState({
                isVisible: true,
                isActive: true,
                visibilityState,
                isTabSwitching: true,
                lastVisibilityChange: new Date(),
                timeHidden,
            });

            // Reset tab switching flag after a delay
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                updateState({ isTabSwitching: false });
            }, 1000);
        }
    }, [callbacks, updateState]);

    // Handle window focus/blur
    const handleFocus = useCallback(() => {
        callbacks?.onFocus?.();
        updateState({
            isActive: true,
            isTabSwitching: false
        });
    }, [callbacks, updateState]);

    const handleBlur = useCallback(() => {
        callbacks?.onBlur?.();
        updateState({
            isActive: false,
            isTabSwitching: true
        });
    }, [callbacks, updateState]);

    // Handle page unload
    const handleBeforeUnload = useCallback(() => {
        callbacks?.onBeforeUnload?.();
    }, [callbacks]);

    useEffect(() => {
        // Initial state
        updateState({
            isVisible: !document.hidden,
            isActive: document.hasFocus(),
            visibilityState: document.visibilityState,
        });

        // Event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('beforeunload', handleBeforeUnload);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [handleVisibilityChange, handleFocus, handleBlur, handleBeforeUnload]);

    return state;
}

const TabVisibilityContext = createContext<TabVisibilityState | null>(null);

interface TabVisibilityProviderProps {
    children: ReactNode;
    callbacks?: TabVisibilityCallbacks;
}

export const TabVisibilityProvider: React.FC<TabVisibilityProviderProps> = ({
                                                                                children,
                                                                                callbacks,
                                                                            }) => {
    const tabState = useTabVisibility(callbacks);

    return (
        <TabVisibilityContext.Provider value={tabState}>
            {children}
            </TabVisibilityContext.Provider>
    );
};

export const useTabVisibilityContext = () => {
    const context = useContext(TabVisibilityContext);
    if (!context) {
        throw new Error('useTabVisibilityContext must be used within TabVisibilityProvider');
    }
    return context;
};


/**
 * Integrates tab visibility with your lifecycle library
 */
// export function useLifecycleWithTabVisibility() {
//     const lifecycle = useLifecycle();
//     const tabState = useTabVisibility();
//
//     useEffect(() => {
//         if (tabState.isVisible && tabState.isActive) {
//             // Tab is visible and active - resume
//             lifecycle.handleLifecycleEvent(LifecycleEvent.ON_RESUME);
//         } else if (tabState.isVisible && !tabState.isActive) {
//             // Tab is visible but not active - start but don't resume
//             lifecycle.handleLifecycleEvent(LifecycleEvent.ON_START);
//             lifecycle.handleLifecycleEvent(LifecycleEvent.ON_PAUSE);
//         } else {
//             // Tab is hidden - pause and stop
//             lifecycle.handleLifecycleEvent(LifecycleEvent.ON_PAUSE);
//             lifecycle.handleLifecycleEvent(LifecycleEvent.ON_STOP);
//         }
//     }, [tabState.isVisible, tabState.isActive, lifecycle]);
//
//     return {
//         lifecycle,
//         tabState,
//     };
// }

// Example usage in pages/_app.tsx
// import { AppProps } from 'next/app';
// import { TabVisibilityProvider } from '../hooks/useTabVisibility';
//
// export default function MyApp({ Component, pageProps }: AppProps) {
//     return (
//         <TabVisibilityProvider
//             callbacks={{
//         onShow: () => {
//             console.log('🎉 Welcome back! Tab is visible again');
//             // Resume any paused operations
//         },
//             onHide: () => {
//             console.log('👋 Tab hidden, pausing operations');
//             // Pause expensive operations, stop timers, etc.
//         },
//             onBeforeUnload: () => {
//             console.log('💾 Saving data before page unload');
//             // Save important data
//         },
//     }}
// >
//     <Component {...pageProps} />
//     </TabVisibilityProvider>
// );
// }

// // Example usage in a page
// // pages/index.tsx
// import { useState, useEffect } from 'react';
// import { TabStatusIndicator, useTabVisibility } from '../hooks/useTabVisibility';
// import { useLifecycleWithTabVisibility } from '../hooks/useLifecycleWithTabVisibility';
//
// export default function HomePage() {
//     const [counter, setCounter] = useState(0);
//     const { lifecycle, tabState } = useLifecycleWithTabVisibility();
//
//     // Auto-increment counter only when tab is active
//     useEffect(() => {
//         if (!tabState.isVisible || !tabState.isActive) return;
//
//         const interval = setInterval(() => {
//             setCounter(prev => prev + 1);
//         }, 1000);
//
//         return () => clearInterval(interval);
//     }, [tabState.isVisible, tabState.isActive]);
//
//     return (
//         <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
//         <div className="max-w-4xl mx-auto">
//         <h1 className="text-4xl font-bold mb-8 text-center">
//             Next.js Tab Visibility Detection
//     </h1>
//
//     <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
//     <h2 className="text-2xl font-semibold mb-4">Auto Counter</h2>
//     <p className="text-lg">
//         Counter: <span className="font-mono text-2xl text-blue-600">{counter}</span>
//         </p>
//         <p className="text-sm text-gray-600 mt-2">
//         This counter only increments when the tab is active and visible.
//     </p>
//     </div>
//
//     <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
//     <h2 className="text-2xl font-semibold mb-4">Lifecycle State</h2>
//     <p className="text-lg">
//         Current State: <span className="font-mono text-green-600">
//         {lifecycle.getCurrentState()}
//         </span>
//         </p>
//         </div>
//
//         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
//     <h2 className="text-2xl font-semibold mb-4">Test Instructions</h2>
//     <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
//         <li>Switch to another tab and come back</li>
//     <li>Minimize the browser window</li>
//     <li>Click outside the browser window</li>
//     <li>Check the console for detailed logs</li>
//     <li>Watch the status indicator in the top-right corner</li>
//     </ul>
//     </div>
//     </div>
//
//     <TabStatusIndicator />
//     </div>
// );
// }