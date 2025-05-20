import React, {useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef} from 'react';
import {ArrowLeft, Home, X} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';

// Types
type RouteParams = Record<string, any>;
type TransitionType = 'slide-left' | 'slide-right' | 'fade' | 'scale' | 'none';

// Lifecycle callback interfaces
interface LifecycleEvent {
  preventDefault: () => void;
  resume: () => void;
}

type LifecycleCallback = (event: LifecycleEvent) => void;

interface ScreenProps {
  children: ReactNode;
  name: string;
  endTask?: boolean;
  onCreate?: LifecycleCallback;
  onDestroy?: LifecycleCallback;
  onPause?: LifecycleCallback;
  onResume?: LifecycleCallback;
}

interface ActiveScreen {
  name: string;
  params: RouteParams;
  key: string;
  lifecycleHooks: {
    onCreate?: LifecycleCallback;
    onDestroy?: LifecycleCallback;
    onPause?: LifecycleCallback;
    onResume?: LifecycleCallback;
  };
}

interface NavigationContextType {
  navigate: (screenName: string, params?: RouteParams, transition?: TransitionType, endTask?: boolean) => void;
  goBack: () => void;
  goHome: () => void;
  getParams: () => RouteParams;
  activeScreens: ActiveScreen[];
  transitionType: TransitionType;
  direction: 'forward' | 'backward';
  getCurrentScreenKey: () => string;
  registerLifecycleHooks: (screenKey: string, hooks: {
    onCreate?: LifecycleCallback;
    onDestroy?: LifecycleCallback;
    onPause?: LifecycleCallback;
    onResume?: LifecycleCallback;
  }) => void;
  triggerLifecycleEvent: (screenKey: string, eventType: 'onCreate' | 'onDestroy' | 'onPause' | 'onResume') => Promise<boolean>;
}

// Navigation Context
const NavigationContext = createContext<NavigationContextType | null>(null);

// Custom hook to use navigation
export const useActivity = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Screen Component with lifecycle hooks
export const Screen = ({
  children,
  name,
  endTask = false,
  onCreate,
  onDestroy,
  onPause,
  onResume
}: ScreenProps) => {
  const {activeScreens, transitionType, getCurrentScreenKey, registerLifecycleHooks} = useActivity();

  // Find all instances of this screen in the active screens stack
  const screenInstances = activeScreens.filter(screen => screen.name === name);

  useEffect(() => {
    // Register lifecycle hooks for each instance of this screen
    screenInstances.forEach(instance => {
      registerLifecycleHooks(instance.key, {
        onCreate,
        onDestroy,
        onPause,
        onResume
      });
    });
  }, [screenInstances.map(s => s.key).join(',')]);

  if (screenInstances.length === 0) return null;

  return (
    <>
      {screenInstances.map((instance, index) => {
        const isTopScreen = instance.key === getCurrentScreenKey();
        const variants = motionVariants[isTopScreen ? transitionType : 'none'];

        // Only the current screen gets animated with the selected transition
        return (
          <motion.div
            key={instance.key}
            className="absolute top-0 left-0 w-full h-full bg-white"
            style={{zIndex: index + 1}}
            initial={isTopScreen ? "initial" : false}
            animate={isTopScreen ? "animate" : {x: 0, opacity: 1}}
            exit={isTopScreen ? "exit" : {opacity: 0}}
            variants={variants}
          >
            {children}
          </motion.div>
        );
      })}
    </>
  );
};

// Motion variants for different transitions
const motionVariants = {
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

// Android-style screen overlay for stacked screens
const ScreenOverlay = () => {
  return (
    <motion.div
      className="absolute inset-0 bg-black pointer-events-none"
      initial={{opacity: 0}}
      animate={{opacity: 0.5}}
      exit={{opacity: 0}}
      transition={{duration: 0.3}}
    />
  );
};

// Generate a unique ID for screen instances
const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// Navigation Provider Component with lifecycle hooks
export const NavigationProvider = ({children, initialScreen = 'Screen1'}: {
  children: ReactNode,
  initialScreen?: string
}) => {
  const initialKey = generateUniqueId();
  const [activeScreens, setActiveScreens] = useState<ActiveScreen[]>([
    {
      name: initialScreen,
      params: {},
      key: initialKey,
      lifecycleHooks: {}
    }
  ]);

  const [transitionType, setTransitionType] = useState<TransitionType>('none');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [endTaskMap, setEndTaskMap] = useState<Record<string, boolean>>({});

  // Queue for handling pending navigation actions
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Get the current top screen
  const getCurrentScreen = () => {
    return activeScreens[activeScreens.length - 1]?.name || initialScreen;
  };

  // Get the current top screen's unique key
  const getCurrentScreenKey = () => {
    return activeScreens[activeScreens.length - 1]?.key || initialKey;
  };

  // Register lifecycle hooks for a screen instance
  const registerLifecycleHooks = useCallback((screenKey: string, hooks: {
    onCreate?: LifecycleCallback;
    onDestroy?: LifecycleCallback;
    onPause?: LifecycleCallback;
    onResume?: LifecycleCallback;
  }) => {
    setActiveScreens(prev => {
      return prev.map(screen => {
        if (screen.key === screenKey) {
          return {
            ...screen,
            lifecycleHooks: {
              ...screen.lifecycleHooks,
              ...hooks
            }
          };
        }
        return screen;
      });
    });
  }, []);

  // Trigger lifecycle event and handle preventDefault
  const triggerLifecycleEvent = useCallback(async (
    screenKey: string,
    eventType: 'onCreate' | 'onDestroy' | 'onPause' | 'onResume'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const screen = activeScreens.find(s => s.key === screenKey);
      const handler = screen?.lifecycleHooks[eventType];

      if (!handler) {
        resolve(true); // No handler, proceed with default action
        return;
      }

      let isDefaultPrevented = false;
      let isResumed = false;

      const event: LifecycleEvent = {
        preventDefault: () => {
          isDefaultPrevented = true;
        },
        resume: () => {
          isResumed = true;
          if (pendingNavigationRef.current) {
            pendingNavigationRef.current();
            pendingNavigationRef.current = null;
          }
          resolve(true);
        }
      };

      handler(event);

      // If the handler doesn't call preventDefault, proceed
      if (!isDefaultPrevented) {
        resolve(true);
      } else if (!isResumed) {
        // Default is prevented and resume not called immediately
        resolve(false);
      }
    });
  }, [activeScreens]);

  // Navigate to a new screen
  const navigate = useCallback(async (
    screenName: string,
    newParams: RouteParams = {},
    transition: TransitionType = 'slide-left',
    endTask: boolean = false
  ) => {
    // If there's a current screen, trigger onPause
    if (activeScreens.length > 0) {
      const currentScreenKey = getCurrentScreenKey();
      const shouldProceed = await triggerLifecycleEvent(currentScreenKey, 'onPause');

      if (!shouldProceed) {
        // Store the navigation action to be resumed later
        pendingNavigationRef.current = () => navigate(screenName, newParams, transition, endTask);
        return;
      }
    }

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
      {
        name: screenName,
        params: newParams,
        key: newScreenKey,
        lifecycleHooks: {}
      }
    ]);

    // Schedule onCreate for the next tick to ensure the screen is in the DOM
    setTimeout(() => {
      triggerLifecycleEvent(newScreenKey, 'onCreate');
    }, 0);
  }, [activeScreens, getCurrentScreenKey, triggerLifecycleEvent]);

  // Go back to previous screen
  const goBack = useCallback(async () => {
    if (activeScreens.length <= 1) return;

    const currentScreenKey = getCurrentScreenKey();
    const shouldProceed = await triggerLifecycleEvent(currentScreenKey, 'onDestroy');

    if (!shouldProceed) {
      pendingNavigationRef.current = goBack;
      return;
    }

    setDirection('backward');
    setTransitionType('slide-right');

    // Get current screen before removal
    const currentScreen = activeScreens[activeScreens.length - 1];
    const shouldEndTask = endTaskMap[currentScreen.key] || false;

    // Remove current screen from stack
    setActiveScreens(prev => {
      const newStack = prev.slice(0, -1);

      // Trigger onResume on the previous screen
      if (newStack.length > 0) {
        const previousScreenKey = newStack[newStack.length - 1].key;
        setTimeout(() => {
          triggerLifecycleEvent(previousScreenKey, 'onResume');
        }, 0);
      }

      return newStack;
    });
  }, [activeScreens, getCurrentScreenKey, triggerLifecycleEvent, endTaskMap]);

  // Go back to the home screen (first screen)
  const goHome = useCallback(async () => {
    if (activeScreens.length <= 1) return;

    const currentScreenKey = getCurrentScreenKey();
    const shouldProceed = await triggerLifecycleEvent(currentScreenKey, 'onDestroy');

    if (!shouldProceed) {
      pendingNavigationRef.current = goHome;
      return;
    }

    setDirection('backward');
    setTransitionType('fade');

    // Only keep the first screen in the stack
    setActiveScreens(prev => {
      const homeScreen = [prev[0]];

      // Trigger onResume on the home screen
      setTimeout(() => {
        triggerLifecycleEvent(homeScreen[0].key, 'onResume');
      }, 0);

      return homeScreen;
    });
  }, [activeScreens, getCurrentScreenKey, triggerLifecycleEvent]);

  // Get parameters for current screen
  const getParams = useCallback(() => {
    return activeScreens[activeScreens.length - 1]?.params || {};
  }, [activeScreens]);

  const value = {
    navigate,
    goBack,
    goHome,
    getParams,
    activeScreens,
    transitionType,
    direction,
    getCurrentScreenKey,
    registerLifecycleHooks,
    triggerLifecycleEvent
  };

  return (
    <NavigationContext.Provider value={value}>
      <div className="relative overflow-hidden w-full h-full bg-gray-50 rounded-lg shadow-lg">
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