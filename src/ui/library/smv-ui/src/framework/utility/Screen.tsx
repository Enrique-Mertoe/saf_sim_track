"use client"
// components/ScreenProvider.tsx
import React, {createContext, ReactNode, useCallback, useContext, useEffect, useState} from 'react';

// Breakpoint definitions (following common conventions like Tailwind CSS)
export const BREAKPOINTS = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface ScreenDimensions {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
}

export interface ViewportDimensions {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    scrollWidth: number;
    scrollHeight: number;
}

export interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouchDevice: boolean;
    devicePixelRatio: number;
    orientation: 'portrait' | 'landscape';
    userAgent: string;
}

export interface BreakpointState {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
    '2xl': boolean;
    current: BreakpointKey;
    above: (breakpoint: BreakpointKey) => boolean;
    below: (breakpoint: BreakpointKey) => boolean;
    between: (min: BreakpointKey, max: BreakpointKey) => boolean;
}

export interface ScreenState {
    screen: ScreenDimensions;
    viewport: ViewportDimensions;
    device: DeviceInfo;
    breakpoints: BreakpointState;
    isLoading: boolean;
}

export interface ScreenCallbacks {
    onResize?: (state: ScreenState) => void;
    onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
    onBreakpointChange?: (current: BreakpointKey, previous: BreakpointKey) => void;
    onScroll?: (scrollX: number, scrollY: number) => void;
}

/**
 * Get current breakpoint based on viewport width
 */
function getCurrentBreakpoint(width: number): BreakpointKey {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
}

/**
 * Create breakpoint state object
 */
function createBreakpointState(width: number): BreakpointState {
    const current = getCurrentBreakpoint(width);

    return {
        xs: width >= BREAKPOINTS.xs,
        sm: width >= BREAKPOINTS.sm,
        md: width >= BREAKPOINTS.md,
        lg: width >= BREAKPOINTS.lg,
        xl: width >= BREAKPOINTS.xl,
        '2xl': width >= BREAKPOINTS['2xl'],
        current,
        above: (breakpoint: BreakpointKey) => width >= BREAKPOINTS[breakpoint],
        below: (breakpoint: BreakpointKey) => width < BREAKPOINTS[breakpoint],
        between: (min: BreakpointKey, max: BreakpointKey) =>
            width >= BREAKPOINTS[min] && width < BREAKPOINTS[max],
    };
}

/**
 * Get device information
 */
function getDeviceInfo(width: number, height: number): DeviceInfo {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const userAgent = navigator.userAgent;
    const orientation = width > height ? 'landscape' : 'portrait';

    // Simple device detection based on viewport size and touch capability
    const isMobile = width < BREAKPOINTS.md && isTouchDevice;
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg && isTouchDevice;
    const isDesktop = !isMobile && !isTablet;

    return {
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        devicePixelRatio: window.devicePixelRatio || 1,
        orientation,
        userAgent,
    };
}

/**
 * Hook to track screen dimensions, breakpoints, and device information
 */
export function useScreen(callbacks?: ScreenCallbacks) {
    const [state, setState] = useState<ScreenState>({
        screen: {
            width: 0,
            height: 0,
            availWidth: 0,
            availHeight: 0,
            colorDepth: 0,
            pixelDepth: 0,
        },
        viewport: {
            width: 0,
            height: 0,
            scrollX: 0,
            scrollY: 0,
            scrollWidth: 0,
            scrollHeight: 0,
        },
        device: {
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            isTouchDevice: false,
            devicePixelRatio: 1,
            orientation: 'landscape',
            userAgent: '',
        },
        breakpoints: {
            xs: true,
            sm: false,
            md: false,
            lg: false,
            xl: false,
            '2xl': false,
            current: 'xs',
            above: () => false,
            below: () => true,
            between: () => false,
        },
        isLoading: true,
    });

    const updateState = useCallback(() => {
        if (typeof window === 'undefined') return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollWidth = document.documentElement.scrollWidth;
        const scrollHeight = document.documentElement.scrollHeight;

        const screenDimensions: ScreenDimensions = {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
        };

        const viewportDimensions: ViewportDimensions = {
            width: viewportWidth,
            height: viewportHeight,
            scrollX,
            scrollY,
            scrollWidth,
            scrollHeight,
        };

        const deviceInfo = getDeviceInfo(viewportWidth, viewportHeight);
        const breakpointState = createBreakpointState(viewportWidth);
        const previousBreakpoint = state.breakpoints.current;

        const newState: ScreenState = {
            screen: screenDimensions,
            viewport: viewportDimensions,
            device: deviceInfo,
            breakpoints: breakpointState,
            isLoading: false,
        };

        setState(prevState => {
            // Call callbacks
            callbacks?.onResize?.(newState);

            if (deviceInfo.orientation !== prevState.device.orientation) {
                callbacks?.onOrientationChange?.(deviceInfo.orientation);
            }

            if (breakpointState.current !== previousBreakpoint && !prevState.isLoading) {
                callbacks?.onBreakpointChange?.(breakpointState.current, previousBreakpoint);
            }

            return newState;
        });
    }, [callbacks, state.breakpoints.current]);

    const handleScroll = useCallback(() => {
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        setState(prev => ({
            ...prev,
            viewport: {
                ...prev.viewport,
                scrollX,
                scrollY,
            },
        }));

        callbacks?.onScroll?.(scrollX, scrollY);
    }, [callbacks]);

    useEffect(() => {
        // Initial state
        updateState();

        // Event listeners
        window.addEventListener('resize', updateState);
        window.addEventListener('orientationchange', updateState);
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Cleanup
        return () => {
            window.removeEventListener('resize', updateState);
            window.removeEventListener('orientationchange', updateState);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [updateState, handleScroll]);

    return state;
}

// Context for providing screen state to components
const ScreenContext = createContext<ScreenState | null>(null);

interface ScreenProviderProps {
    children: ReactNode;
    callbacks?: ScreenCallbacks;
}

export const ScreenProvider: React.FC<ScreenProviderProps> = ({
                                                                  children,
                                                                  callbacks,
                                                              }) => {
    const screenState = useScreen(callbacks);

    return (
        <ScreenContext.Provider value={screenState}>
            {children}
            </ScreenContext.Provider>
    );
};

export const useScreenContext = () => {
    const context = useContext(ScreenContext);
    if (!context) {
        throw new Error('useScreenContext must be used within ScreenProvider');
    }
    return context;
};

// Convenience hook that returns just the dimensions for simpler usage
export const useDimensions = () => {
    const { viewport, breakpoints, device } = useScreen();
    return {
        width: viewport.width,
        height: viewport.height,
        ...breakpoints,
        ...device,
    };
};