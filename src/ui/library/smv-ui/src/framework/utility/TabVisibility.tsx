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
