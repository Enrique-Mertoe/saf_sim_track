"use client"
import React, {useState, useEffect, createContext, useContext, useCallback, useRef} from 'react';
import {AlertCircle, CheckCircle, Info, X, AlertTriangle} from 'lucide-react';
import Signal from "@/lib/Signal";

// Types
type AlertType = 'success' | 'error' | 'info' | 'warning';

export enum ConfirmType {
    ERROR = "error",
    WARN = "warn",
    SUCCESS = "success",
    INFO = "info",
    DEFAULT = "default"
}

interface AlertOptions {
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export interface AlertContextType {
    success: (message: string, options?: AlertOptions) => void;
    error: (message: string, options?: AlertOptions) => void;
    info: (message: string, options?: AlertOptions) => void;
    warning: (message: string, options?: AlertOptions) => void;
    confirm: (
        args: ConfirmDialogInstance
    ) => void;
    ERROR: ConfirmType.ERROR,
    WARN: ConfirmType.WARN,
    INFO: ConfirmType.INFO,
    SUCCESS: ConfirmType.SUCCESS,
}

interface AlertItem {
    id: string;
    type: AlertType;
    message: string;
    duration: number;
    position: string;
}

type TaskType<T> = () => T | Promise<T>;

interface ConfirmDialogProps<T = any> {
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmType;
    onConfirm: (...args: any) => void;
    onDismiss: () => void;
    onCancel: () => void;
    task?: TaskType<T>;
}

interface ConfirmDialogInstance<T = any> {
    title?: string;
    message: string;
    type?: ConfirmType;
    onConfirm?: (res?: T) => void;
    onCancel?: () => void;
    task?: TaskType<T>;
}

// Context
const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Alert Hook
export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export function _addAlert(...args: any[]) {
    Signal.trigger("add-alert", ...args)
}

export function _alert_confirm(args: ConfirmDialogInstance<any>) {
    Signal.trigger("add-alert-confirm", args)
}

// Alert Provider Component
//@ts-ignore
export const AlertDialog = () => {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps>({
        isOpen: false,
        title: '',
        message: '',
        type: ConfirmType.DEFAULT,
        onConfirm: () => {
        },
        onDismiss: () => {
        },
        onCancel: () => {
        },
    });


    const removeAlert = useCallback((id: string) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, []);

    const addAlert = useCallback(
        (type: AlertType, message: string, options?: AlertOptions) => {
            const id = Math.random().toString(36).substring(2, 9);
            const newAlert: AlertItem = {
                id,
                type,
                message,
                duration: options?.duration || 5000,
                position: options?.position || 'top-right',
            };

            setAlerts((prev) => [...prev, newAlert]);

            if (newAlert.duration > 0) {
                setTimeout(() => {
                    removeAlert(id);
                }, newAlert.duration);
            }

            return id;
        },
        [removeAlert]
    );


    const confirm = useCallback(
        ({
             title,
             message,
             type,
             onConfirm,
             onCancel, task,
         }: ConfirmDialogInstance<any>
        ) => {
            setConfirmDialog({
                isOpen: true,
                title: title || '',
                type: type || ConfirmType.DEFAULT,
                message,
                task,
                onConfirm: res => {
                    onConfirm?.(res);
                },
                onDismiss: () => {
                    setConfirmDialog((prev) => ({...prev, isOpen: false}));
                },
                onCancel: () => {
                    onCancel?.();
                    setConfirmDialog((prev) => ({...prev, isOpen: false}));
                },
            });
        },
        []
    );
    useEffect(() => {
        Signal.on("add-alert", addAlert)
        Signal.on("add-alert-confirm", confirm)
        return () => {
            Signal.off("add-alert", addAlert)
            Signal.off("add-alert-confirm", confirm)
        }
    }, [addAlert, confirm]);


    return (
        <>
            <AlertContainer alerts={alerts} removeAlert={removeAlert}/>
            <ConfirmDialog {...confirmDialog} />
        </>
    );
};

// Alert Icon Component
const AlertIcon = ({type}: { type: AlertType }) => {
    switch (type) {
        case 'success':
            return <CheckCircle className="w-6 h-6 text-green-500"/>;
        case 'error':
            return <AlertCircle className="w-6 h-6 text-red-500"/>;
        case 'warning':
            return <AlertTriangle className="w-6 h-6 text-yellow-500"/>;
        case 'info':
        default:
            return <Info className="w-6 h-6 text-green-500"/>;
    }
};

// Alert Component
const Alert = ({
                   alert,
                   onClose
               }: {
    alert: AlertItem;
    onClose: () => void
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const getBgColor = () => {
        switch (alert.type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
            default:
                return 'bg-green-50 border-green-200';
        }
    };

    return (
        <div
            className={`fixed transform transition-all duration-500 ease-in-out shadow-lg rounded-lg border p-4 flex items-center gap-3 max-w-xs w-full ${getBgColor()} ${
                isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
            style={{
                zIndex: 9999,
            }}
        >
            <AlertIcon type={alert.type}/>
            <p className="text-sm font-medium flex-1">{alert.message}</p>
            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
            >
                <X className="w-4 h-4"/>
            </button>
        </div>
    );
};

// Alert Container Component
const AlertContainer = ({
                            alerts,
                            removeAlert
                        }: {
    alerts: AlertItem[];
    removeAlert: (id: string) => void
}) => {
    const getPositionStyle = (position: string) => {
        switch (position) {
            case 'top-right':
                return 'top-4 right-4 flex flex-col items-end gap-2';
            case 'top-left':
                return 'top-4 left-4 flex flex-col items-start gap-2';
            case 'bottom-right':
                return 'bottom-4 right-4 flex flex-col items-end gap-2';
            case 'bottom-left':
                return 'bottom-4 left-4 flex flex-col items-start gap-2';
            case 'top-center':
                return 'top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2';
            case 'bottom-center':
                return 'bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2';
            default:
                return 'top-4 right-4 flex flex-col items-end gap-2';
        }
    };

    const positionGroups: { [key: string]: AlertItem[] } = {};
    alerts.forEach(alert => {
        if (!positionGroups[alert.position]) {
            positionGroups[alert.position] = [];
        }
        positionGroups[alert.position].push(alert);
    });

    return (
        <>
            {Object.entries(positionGroups).map(([position, positionAlerts]) => (
                <div
                    key={position}
                    className={`fixed ${getPositionStyle(position)}`}
                    style={{zIndex: 9999}}
                >
                    {positionAlerts.map((alert) => (
                        <Alert
                            key={alert.id}
                            alert={alert}
                            onClose={() => removeAlert(alert.id)}
                        />
                    ))}
                </div>
            ))}
        </>
    );
};

// Confirm Dialog Component
const ConfirmDialog = ({
                           isOpen,
                           title,
                           message,
                           onConfirm,
                           onDismiss,
                           type,
                           task,
                           onCancel,
                       }: ConfirmDialogProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [taskRunning, setTaskRunning] = useState<boolean>(false)
    const [taskError, setTaskError] = useState<string>('')
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isOpen) {
            // Slight delay to ensure the modal is in the DOM before animating
            timer = setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
        }
        return () => clearTimeout(timer);
    }, [isOpen]);
    const Confirm = async () => {
        try {
            let res = undefined
            if (task)
                res = await runTask()
            setIsVisible(false)
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            res ? onConfirm?.(res)
                : onConfirm?.();
            setTimeout(() => onDismiss(), 300)
        } catch (e: any) {
            e = new Error(e);
            setTaskError(e.message || "Cant process task")
        }
    }

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isVisible) {
            setIsAnimating(true);
            interval = setInterval(() => {
                setIsAnimating(prev => !prev);
            }, 2000);
        }

        return () => clearInterval(interval);
    }, [isVisible]);

    const runTask = async () => {
        setTaskRunning(true)
        setTaskError('')
        return new Promise(async (resolve, reject) => {
            try {
                const res = await task?.()
                resolve(res)
            } catch (e) {
                reject(e)
            } finally {
                setTaskRunning(false)
            }
        })
    }
    const getThemeColors = () => {
        switch (type) {
            case ConfirmType.ERROR:
                return {
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-600',
                    iconColor: 'text-red-600',
                    buttonBg: 'bg-red-600',
                    buttonHoverBg: 'bg-red-500',
                    buttonRingColor: 'ring-red-500',
                    buttonHoverEffect: 'bg-red-400'
                };
            case ConfirmType.WARN:
                return {
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-600',
                    iconColor: 'text-yellow-600',
                    buttonBg: 'bg-yellow-600',
                    buttonHoverBg: 'bg-yellow-500',
                    buttonRingColor: 'ring-yellow-500',
                    buttonHoverEffect: 'bg-yellow-400'
                };
            case ConfirmType.SUCCESS:
                return {
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-600',
                    iconColor: 'text-green-600',
                    buttonBg: 'bg-green-600',
                    buttonHoverBg: 'bg-green-500',
                    buttonRingColor: 'ring-green-500',
                    buttonHoverEffect: 'bg-green-400'
                };
            case ConfirmType.INFO:
                return {
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-600',
                    iconColor: 'text-blue-600',
                    buttonBg: 'bg-blue-600',
                    buttonHoverBg: 'bg-blue-500',
                    buttonRingColor: 'ring-blue-500',
                    buttonHoverEffect: 'bg-blue-400'
                };
            default:
                return {
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-600',
                    iconColor: 'text-gray-600',
                    buttonBg: 'bg-green-600',
                    buttonHoverBg: 'bg-green-500',
                    buttonRingColor: 'ring-green-500',
                    buttonHoverEffect: 'bg-green-400'
                };
        }
    };

    const theme = getThemeColors();

    // Render appropriate icon based on type
    const renderIcon = () => {
        switch (type) {
            case ConfirmType.ERROR:
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-10 w-10 ${theme.iconColor} transition-all duration-1000 transform ${
                            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        } ${isAnimating ? 'animate-pulse' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            className={`transition-all duration-1000`}
                            style={{
                                strokeDasharray: '100',
                                strokeDashoffset: isVisible ? '0' : '100',
                            }}
                        />
                    </svg>
                );
            case ConfirmType.WARN:
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-10 w-10 ${theme.iconColor} transition-all duration-1000 transform ${
                            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        } ${isAnimating ? 'animate-bounce' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            className={`transition-all duration-1000`}
                            style={{
                                strokeDasharray: '100',
                                strokeDashoffset: isVisible ? '0' : '100',
                            }}
                        />
                    </svg>
                );
            case ConfirmType.INFO:
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-10 w-10 ${theme.iconColor} transition-all duration-1000 transform ${
                            isVisible ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                        } ${isAnimating ? 'animate-ping' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            className={`transition-all duration-1000`}
                            style={{
                                strokeDasharray: '100',
                                strokeDashoffset: isVisible ? '0' : '100',
                            }}
                        />
                    </svg>
                );
            case ConfirmType.SUCCESS:
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-10 w-10 ${theme.iconColor} transition-all duration-1000 transform ${
                            isVisible ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                        } ${isAnimating ? 'animate-spin' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            className={`transition-all duration-1000`}
                            style={{
                                strokeDasharray: '100',
                                strokeDashoffset: isVisible ? '0' : '100',
                            }}
                        />
                    </svg>
                );
            default:
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-10 w-10 ${theme.iconColor} transition-all duration-1000 transform ${
                            isVisible ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                        } ${isAnimating ? 'animate-pulse' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            className={`transition-all duration-1000`}
                            style={{
                                strokeDasharray: '100',
                                strokeDashoffset: isVisible ? '0' : '100',
                            }}
                        />
                    </svg>
                );
        }
    };

    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 z-[10888] overflow-y-auto flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 ${
                    isVisible ? 'opacity-50' : 'opacity-0'
                }`}
                // onClick={onCancel}
            />

            {/* Dialog */}
            <div
                className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-md mx-4 overflow-hidden ${
                    isVisible
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-105 translate-y-4'
                }`}
                style={{
                    boxShadow: isVisible ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 'none',
                }}
            >
                {/* Icon Header */}
                <div className="flex items-center gap-3 pt-4 ps-4">
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-700 ${
                            isVisible
                                ? `opacity-100 scale-100 ${theme.bgColor}`
                                : 'opacity-0 scale-50 bg-transparent'
                        }`}
                    >
                        {renderIcon()}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 flex justify-center">
          <span
              className={`inline-block transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 -translate-y-2'}`}>
            {title}
          </span>
                    </h3>
                </div>

                <div
                    className={`p-6 transition-all duration-700 text-center ${
                        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
                    }`}
                >
                    <p className={`text-sm text-gray-500 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                        {message}
                    </p>
                    {
                        taskRunning ?
                            <div className="flex justify-center items-center h-34">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
                            </div> : ''
                    }
                    {
                        taskError ?
                            <div
                                className="flex items-center p-3 my-2 bg-red-50 border border-red-200 rounded-md shadow-sm transition-all duration-700 delay-100 animate-pulse">
                                <div className="mr-3 text-red-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                         fill="currentColor">
                                        <path fillRule="evenodd"
                                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                              clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-red-800">
                                    {taskError}
                                </p>
                            </div> : ''
                    }
                </div>

                <div className="bg-gray-50 px-6 py-2 flex justify-end space-x-3">
                    <button
                        disabled={taskRunning}
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onDismiss, 500);
                            onCancel();
                        }}
                        className="px-4 cursor-pointer py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md transition-all duration-300 transform hover:scale-105 hover:shadow-sm group"
                    >
          <span className="flex items-center">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1 group-hover:text-red-500 transition-colors duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Cancel
          </span>
                    </button>
                    <button
                        disabled={taskRunning}
                        ref={btnRef}
                        onClick={() => Confirm()}
                        className={`px-4 py-2 cursor-pointer text-sm font-medium text-white ${theme.buttonBg} hover:${theme.buttonHoverBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:${theme.buttonRingColor} rounded-md transition-all duration-300 transform hover:scale-105 hover:shadow-md relative overflow-hidden group`}
                    >
          <span className="relative z-10 flex items-center">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1 transition-transform duration-300 group-hover:rotate-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
            Confirm
          </span>
                        <span
                            className={`absolute inset-0 ${theme.buttonHoverEffect} transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300`}></span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Example Usage Component
const ExampleUsage = () => {
    const alert = useAlert();

    const showSuccess = () => {
        alert.success("Operation completed successfully!");
    };

    const showError = () => {
        alert.error("An error occurred while processing your request.");
    };

    const showInfo = () => {
        alert.info("This is an informational message.");
    };

    const showWarning = () => {
        alert.warning("Warning: This action may have consequences.");
    };

    const showConfirm = () => {
        // alert.confirm(
        //     "Are you sure?",
        //     "This action cannot be undone. Are you sure you want to continue?",
        //     () => {
        //         // Success callback
        //         alert.success("Action confirmed and executed!");
        //     },
        //     () => {
        //         // Cancel callback
        //         alert.info("Action canceled");
        //     }
        // );
    };

    return (
        <div className="p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6">Alert Dialog Demo</h2>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={showSuccess}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                    Success
                </button>
                <button
                    onClick={showError}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                    Error
                </button>
                <button
                    onClick={showInfo}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                    Info
                </button>
                <button
                    onClick={showWarning}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                    Warning
                </button>
                <button
                    onClick={showConfirm}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md col-span-2 hover:bg-purple-700 transition-colors"
                >
                    Confirm Dialog
                </button>
            </div>
        </div>
    );
};