// Types
import {ReactNode} from "react";

export type RouteParams<T> = Record<string, T>;
export type TransitionType = 'slide-left' | 'slide-right' | 'fade' | 'scale' | 'none';


export interface ScreenProps {
    children: ReactNode;
    name: string;
    endTask?: boolean;
}

export interface NavigationContextType {
    navigate: (screenName: string, params?: RouteParams<any>, transition?: TransitionType, endTask?: boolean) => void;
    goBack: () => void;
    goHome: () => void;
    getParams: <T>() => RouteParams<T>;
    activeScreens: ActiveScreen[];
    transitionType: TransitionType;
    direction: 'forward' | 'backward';
    getCurrentScreenKey: () => string;
}

export interface ActiveScreen {
    name: string;
    params: RouteParams<any>;
    key: string; // Unique identifier for the screen instance
}

export const motionVariants = {
    'slide-left': {
        initial: {
            x: '100%',
            boxShadow: '-5px 0 15px rgba(0, 0, 0, 0)'
        },
        animate: {
            x: 0,
            boxShadow: '-5px 0 15px rgba(0, 0, 0, 0.1)',
            transition: {type: 'tween', ease: 'easeOut', duration: 0.3}
        },
        exit: {
            x: '100%',
            boxShadow: '-5px 0 15px rgba(0, 0, 0, 0)',
            transition: {type: 'tween', ease: 'easeIn', duration: 0.3}
        }
    },
    'slide-right': {
        initial: {
            x: '-100%',
            boxShadow: '5px 0 15px rgba(0, 0, 0, 0)'
        },
        animate: {
            x: 0,
            boxShadow: '5px 0 15px rgba(0, 0, 0, 0.1)',
            transition: {type: 'tween', ease: 'easeOut', duration: 0.3}
        },
        exit: {
            x: '-100%',
            boxShadow: '5px 0 15px rgba(0, 0, 0, 0)',
            transition: {type: 'tween', ease: 'easeIn', duration: 0.3}
        }
    },
    'fade': {
        initial: {opacity: 0},
        animate: {
            opacity: 1,
            transition: {duration: 0.2}
        },
        exit: {
            opacity: 0,
            transition: {duration: 0.2}
        }
    },
    'scale': {
        initial: {opacity: 0, scale: 0.9},
        animate: {
            opacity: 1,
            scale: 1,
            transition: {type: 'spring', stiffness: 300, damping: 30}
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            transition: {duration: 0.2}
        }
    },
    'none': {
        initial: {opacity: 1},
        animate: {opacity: 1},
        exit: {opacity: 1}
    }
};