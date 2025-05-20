// Navigation Context
import React, {createContext, ReactNode, useContext, useState} from "react";
import {ActiveScreen, NavigationContextType, RouteParams, TransitionType} from "@/ui/materia_screen/Types";
import {ArrowLeft, Home} from "lucide-react";
import {AnimatePresence} from "framer-motion";
import {ScreenOverlay} from "@/ui/materia_screen/components/Overlay";
import {generateUniqueId} from "@/ui/materia_screen/utility";

const NavigationContext = createContext<NavigationContextType | null>(null);

// Custom hook to use navigation
export const useScreen = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

export const MaterialScreenProvider = ({children, initialScreen = 'Screen1'}: {
    children: ReactNode,
    initialScreen?: string
}) => {
    const initialKey = generateUniqueId();
    const [activeScreens, setActiveScreens] = useState<ActiveScreen[]>([
        {name: initialScreen, params: {}, key: initialKey}
    ]);

    const [transitionType, setTransitionType] = useState<TransitionType>('none');
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [endTaskMap, setEndTaskMap] = useState<Record<string, boolean>>({});

    // Get the current top screen
    const getCurrentScreen = () => {
        return activeScreens[activeScreens.length - 1]?.name || initialScreen;
    };

    // Get the current top screen's unique key
    const getCurrentScreenKey = () => {
        return activeScreens[activeScreens.length - 1]?.key || initialKey;
    };

    // Navigate to a new screen
    const navigate = (
        screenName: string,
        newParams: RouteParams<any> = {},
        transition: TransitionType = 'slide-left',
        endTask: boolean = false
    ) => {
        const newScreenKey = generateUniqueId();

        setDirection('forward');
        setTransitionType(transition === 'none' ? 'slide-left' : transition);

        // Store the end task preference
        setEndTaskMap(prev => ({
            ...prev,
            [newScreenKey]: endTask
        }));

        // Add to screen stack
        setActiveScreens(prev => [
            ...prev,
            {name: screenName, params: newParams, key: newScreenKey}
        ]);
    };

    // Go back to previous screen
    const goBack = () => {
        if (activeScreens.length <= 1) return;

        setDirection('backward');
        setTransitionType('slide-right');

        // Get current screen before removal
        const currentScreen = activeScreens[activeScreens.length - 1];
        const shouldEndTask = endTaskMap[currentScreen.key] || false;

        // Remove current screen from stack
        setActiveScreens(prev => {
            // If endTask is true, remove just the current screen
            // Otherwise, keep all screens in the stack
            if (shouldEndTask) {
                return prev.slice(0, -1);
            } else {
                // This appears to remove the screen, but AnimatePresence
                // will handle exit animations and the screen will stay in the DOM
                return prev.slice(0, -1);
            }
        });
    };

    // Go back to the home screen (first screen)
    const goHome = () => {
        if (activeScreens.length <= 1) return;

        setDirection('backward');
        setTransitionType('fade');

        // Only keep the first screen in the stack
        setActiveScreens(prev => [prev[0]]);
    };

    // Get parameters for current screen
    const getParams = () => {
        return activeScreens[activeScreens.length - 1]?.params || {};
    };

    const value = {
        navigate,
        goBack,
        goHome,
        getParams,
        activeScreens,
        transitionType,
        direction,
        getCurrentScreenKey
    };

    return (
        <NavigationContext.Provider value={value}>
            <div className="relative overflow-hidden w-full h-ful h-96 bg-gray-50 rounded-lg shadow-lg">
                {/* Main Content with Framer Motion transitions */}
                <div className="w-full h-full relative">
                    <AnimatePresence>
                        {/* Overlay for screens that aren't on top */}
                        {activeScreens.length > 1 && <ScreenOverlay/>}

                        {/* Render all screens in the stack */}
                        {React.Children.map(children, (child) => {
                            if (React.isValidElement(child)) {
                                return React.cloneElement(child);
                            }
                            return child;
                        })}
                    </AnimatePresence>
                </div>

                {/* Navigation Bar */}
                <div
                    className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center">
                    <button
                        onClick={goBack}
                        disabled={activeScreens.length <= 1}
                        className={`flex items-center px-4 py-2 rounded-md ${activeScreens.length <= 1 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
                    >
                        <ArrowLeft size={18} className="mr-1"/>
                        Back
                    </button>

                    <div className="text-gray-600 font-medium">
                        {getCurrentScreen()} ({activeScreens.length} screens)
                    </div>

                    <button
                        onClick={goHome}
                        disabled={activeScreens.length <= 1}
                        className={`flex items-center px-4 py-2 rounded-md ${activeScreens.length <= 1 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
                    >
                        <Home size={18} className="mr-1"/>
                        Home
                    </button>
                </div>
            </div>
        </NavigationContext.Provider>
    );
};