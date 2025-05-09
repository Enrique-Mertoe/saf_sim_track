'use client';

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

/**
 * Store for tracking page loads and transitions
 * Uses persist middleware to maintain state between page loads
 */
interface NavigationStore {
    isFirstLoad: boolean;
    isLoading: boolean;
    currentPath: string | null;
    setFirstLoadComplete: () => void;
    startLoading: () => void;
    finishLoading: (path: string) => void;
}

export const useNavigationStore = create<NavigationStore>()(
    persist(
        (set) => ({
            isFirstLoad: true,
            isLoading: false,
            currentPath: null,
            setFirstLoadComplete: () => set({isFirstLoad: false}),
            startLoading: () => set({isLoading: true}),
            finishLoading: (path) => set({isLoading: false, currentPath: path}),
        }),
        {
            name: 'navigation-state',
            storage: createJSONStorage(() => sessionStorage),
            // Only persist these fields
            partialize: (state) => ({
                isFirstLoad: state.isFirstLoad,
                currentPath: state.currentPath
            }),
        }
    )
);

// Helper hooks for navigation
export function useIsFirstLoad() {
    return useNavigationStore((state) => state.isFirstLoad);
}

export function useIsLoading() {
    return useNavigationStore((state) => state.isLoading);
}