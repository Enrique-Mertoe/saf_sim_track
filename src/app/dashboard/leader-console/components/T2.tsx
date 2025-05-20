import React, {useState, useEffect} from 'react';
import {NavigationProvider, Screen, useActivity} from './ActivityCombat';

// Home Screen with lifecycle hooks
const Screen1 = () => {
    const {navigate} = useActivity();
    const [status, setStatus] = useState('Active');

    return (
        <div className="p-6 flex flex-col items-center justify-center h-full">
            <div className="text-3xl font-bold text-blue-600 mb-8">Welcome to Screen 1</div>
            <div className="text-md text-gray-500 mb-4">Status: {status}</div>

            <p className="text-gray-600 mb-8 text-center">This is the home screen with lifecycle hooks.</p>

            <div className="space-y-4 w-full max-w-md">
                <button
                    onClick={() => navigate('Screen2', {message: 'Hello from Screen 1!'})}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                    Go to Screen 2 (Slide Left)
                </button>

                <button
                    onClick={() => navigate('Screen3', {count: 0}, 'fade')}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                    Go to Screen 3 (Fade)
                </button>

                <button
                    onClick={() => navigate('Screen2', {
                        message: 'From home with END TASK!',
                        random: Math.random()
                    }, 'slide-left', true)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                    Go to Screen 2 (with END_TASK)
                </button>
            </div>
        </div>
    );
};

// Screen with pause confirmation dialog
const Screen2 = () => {
    const {navigate, getParams} = useActivity();
    const params = getParams();
    const [showDialog, setShowDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: string, resume: () => void } | null>(null);
    const [lifecycle, setLifecycle] = useState<string[]>([]);

    useEffect(() => {
        setLifecycle(prev => [...prev, 'Created']);
        return () => {
            console.log('Screen2 unmounted');
        };
    }, []);

    // Handler for "unsaved changes" scenario
    const handleDestroy = (event: { preventDefault: () => void, resume: () => void }) => {
        setLifecycle(prev => [...prev, 'Destroy requested']);

        // Prevent default behavior (destroying the screen)
        event.preventDefault();

        // Show confirmation dialog
        setShowDialog(true);

        // Save resume function to call later
        setPendingAction({type: 'destroy', resume: event.resume});
    };

    const handlePause = (event: { preventDefault: () => void, resume: () => void }) => {
        setLifecycle(prev => [...prev, 'Pause requested']);

        // For demonstration, we'll prevent the default and show a dialog here too
        event.preventDefault();
        setShowDialog(true);
        setPendingAction({type: 'pause', resume: event.resume});
    };

    const handleResume = () => {
        setLifecycle(prev => [...prev, 'Resumed']);
    };

    const confirmAction = () => {
        setShowDialog(false);
        if (pendingAction) {
            setLifecycle(prev => [...prev, `${pendingAction.type} confirmed`]);
            pendingAction.resume();
        }
    };

    const cancelAction = () => {
        setShowDialog(false);
        setPendingAction(null);
        setLifecycle(prev => [...prev, 'Action canceled']);
    };

    return (
        <div className="p-6 flex flex-col items-center justify-center h-full">
            <div className="text-3xl font-bold text-green-600 mb-4">Screen 2</div>

            {/* Lifecycle Events Log */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 w-full max-w-md">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Lifecycle Events:</h3>
                <div className="h-24 overflow-y-auto text-sm">
                    {lifecycle.map((event, index) => (
                        <div key={index} className="py-1 border-b border-gray-100">
                            {event}
                        </div>
                    ))}
                </div>
            </div>

            {params.message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 w-full max-w-md">
                    <p className="text-green-800">Message: {params.message}</p>
                    {params.random && (
                        <p className="text-green-600 text-sm mt-2">Random ID: {params.random}</p>
                    )}
                </div>
            )}

            <div className="space-y-4 w-full max-w-md">
                <button
                    onClick={() => navigate('Screen3', {fromScreen2: true, count: 5})}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                    Go to Screen 3
                </button>

                <button
                    onClick={() => navigate('Screen2', {message: 'Another instance of Screen 2!'}, 'scale')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                    Launch Another Screen 2
                </button>
            </div>

            {/* Confirmation Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Unsaved Changes</h3>
                        <p className="text-gray-600 mb-6">
                            {pendingAction?.type === 'destroy'
                                ? 'You have unsaved changes. Are you sure you want to leave this screen?'
                                : 'This screen will be paused. Do you want to continue?'}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelAction}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Example screen with pause/resume behaviors
const Screen3 = () => {
    const {getParams, navigate} = useActivity();
    const params = getParams();
    const [count, setCount] = useState(params.count || 0);
    const [isPaused, setIsPaused] = useState(false);
    const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null);
    const [remainingTime, setRemainingTime] = useState(10);

    // Start a countdown when the screen is active
    useEffect(() => {
        if (!isPaused) {
            const timer = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            setCountdownTimer(timer);

            return () => {
                if (timer) clearInterval(timer);
            };
        }

        return undefined;
    }, [isPaused]);

    // Handle screen pause to stop timers/animations
    const handlePause = (event: { preventDefault: () => void, resume: () => void }) => {
        console.log('Screen3 paused');
        setIsPaused(true);

        // Clear any running timers
        if (countdownTimer) {
            clearInterval(countdownTimer);
            setCountdownTimer(null);
        }
    };

    // Handle screen resume to restart timers/animations
    const handleResume = () => {
        console.log('Screen3 resumed');
        setIsPaused(false);
    };

    return (
        <div className="p-6 flex flex-col items-center justify-center h-full">
            <div className="text-3xl font-bold text-purple-600 mb-6">Screen 3</div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 w-full max-w-md">
                <p className="text-purple-800 text-center">Status: {isPaused ? 'PAUSED' : 'ACTIVE'}</p>
                {!isPaused && remainingTime > 0 && (
                    <p className="text-purple-600 text-center mt-2">Countdown: {remainingTime}s</p>
                )}
                {remainingTime === 0 && (
                    <p className="text-purple-600 text-center mt-2">Countdown complete!</p>
                )}
            </div>

            {params.fromScreen2 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <p className="text-purple-800">You came from Screen 2!</p>
                </div>
            )}

            <div className="text-center mb-8">
                <p className="text-gray-600 mb-4">Counter: {count}</p>
                <div className="flex space-x-2 justify-center">
                    <button
                        onClick={() => setCount((prev: number) => prev + 1)}
                        className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                        Increment
                    </button>
                    <button
                        onClick={() => navigate('Screen4', {fromScreen3: true}, 'slide-left')}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                        Go to Screen 4
                    </button>
                </div>
            </div>
        </div>
    );
};

const Screen4 = () => {
    const {getParams, navigate} = useActivity();
    const params = getParams();

    return (
        <div className="p-6 flex flex-col items-center justify-center h-full bg-gray-50">
            <div className="text-3xl font-bold text-orange-600 mb-8">Screen 4</div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8 w-full max-w-md">
                <p className="text-orange-800 text-center">
                    This screen demonstrates the Android activity stack with lifecycle hooks!
                </p>

                {params.fromScreen3 && (
                    <p className="text-orange-600 mt-2 text-center">
                        You navigated here from Screen 3!
                    </p>
                )}
            </div>

            <div className="flex flex-col space-y-4 w-full max-w-md">
                <button
                    onClick={() => navigate('Screen1', {}, 'slide-left', true)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                    Open New Home Screen (END TASK)
                </button>

                <button
                    onClick={() => navigate('Screen2', {message: 'Launched from Screen 4'}, 'scale')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                    Launch Screen 2
                </button>
            </div>
        </div>
    );
};

// Main App demonstrating the navigation system with lifecycle hooks
export default function App() {
    function handleDestroy() {
        alert("destroyed")
    }

    function handlePause() {

    }

    function handleResume() {

    }

    return (
        <div className="w-full h-full bg-gray-100 p-4 flex items-center justify-center">
            <div className="w-full max-w-lg h-96">
                <NavigationProvider initialScreen="Screen1">
                    <Screen name="Screen1">
                        <Screen1/>
                    </Screen>

                    <Screen
                        name="Screen2"
                        onDestroy={handleDestroy}
                        onPause={handlePause}
                        onResume={handleResume}
                    >
                        <Screen2/>
                    </Screen>

                    <Screen
                        name="Screen3"
                        onPause={handlePause}
                        onResume={handleResume}
                    >
                        <Screen3/>
                    </Screen>

                    <Screen name="Screen4">
                        <Screen4/>
                    </Screen>
                </NavigationProvider>
            </div>
        </div>
    );
}