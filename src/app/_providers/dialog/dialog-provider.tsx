"use client"
import React, {createContext, useContext, useState, useCallback, ReactNode, useEffect} from "react";
import {generateUUID} from "@/helper";
import DialogStack from "@/app/_providers/dialog/dialog-provider.library";

interface DialogOptions {
    content: ReactNode;
    cancelable?: boolean;
    design?: ("md-down" | "sm-down" | "lg-down" | "xl-down" | "xxl-down" | "scrollable")[];
    size?: "sm" | "md" | "lg" | "xl" | "xxl";
    radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
    onOpen?: () => void;
    onClose?: () => void;
    persist?: boolean;
}

interface DialogContextType {
    create: (options: DialogOptions) => DialogBuilder;
}

export interface DialogBuilder {
    onDismiss: () => DialogBuilder | void;
    onOpen: () => DialogBuilder | void;
    dismiss: () => DialogBuilder | void;
    show: () => void;
    setView: (view: React.ReactNode) => DialogBuilder | void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

type Closure = (param?: any) => void;

const Dialog = ({
                    cancelable, content, onOpen, onClose, persist, size, design, radius
                }: DialogOptions): DialogInstance => {
    console.log(onClose, persist)

    const closeHandler: Closure[] = [];
    let hideHandler: Closure | null = null;
    let dismissHolder: Closure | null = null;
    let tp: Closure | null = null;
    const b: DialogBuilder = {
        dismiss: () => {
            dismissHolder?.()
        },
        onDismiss(): DialogBuilder | void {
            return undefined;
        },
        onOpen(): DialogBuilder | void {
            onOpen?.();
        },
        setView(view: React.ReactNode): DialogBuilder | void {
            content = view
            return this
        },
        show(): void {
        }
    }
    const dismiss = () => {
        closeHandler.forEach(ch => ch())
    };
    const h: DialogHandler = {
        onDismiss(callback: Closure): void {
            closeHandler.push(callback)
        },
        hide(h: boolean) {
            hideHandler?.(h)
        },
        onTPrevious(param: Closure) {
            tp = param
        }
    }
    return {
        view: <DialogComponent
            content={content}
            handler={{
                closeHandler: (handler: Closure) => {
                    dismissHolder = handler
                },
                onHide(param: Closure) {
                    hideHandler = param
                }
            }}
            tPrevious={() => {
                tp?.()
            }}
            onClose={dismiss}
            size={size}
            design={design}
            radius={radius}
            cancelable={cancelable ?? true}/>,
        id: generateUUID(),
        handler: h,
        builder: b,
        state: "dormant"
    }
}

interface DialogInstance {
    view: React.ReactNode,
    id: string,
    state: "active" | "dormant"
    builder: DialogBuilder,
    handler: DialogHandler
}

interface DialogHandler {
    onDismiss: (callback: Closure) => void,
    hide: Closure

    onTPrevious(param: Closure): void;
}

const DialogProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [stack] = useState<DialogStack<DialogInstance>>(new DialogStack());
    const [dialogs, setDialogs] = useState<DialogInstance[]>([]);
    const [prevState, sp] = useState(false)
    const [originalBodyStyles, setOriginalBodyStyles] = useState<Record<string, string>>({});

    const initBody = useCallback(() => {
        if (stack.length) {
            return
        }
        const styleAttr = document.body.getAttribute("style") ?? "";
        const styleObj = styleAttr
            ? Object.fromEntries(
                styleAttr
                    .split(";")
                    .map(rule => rule.trim())
                    .filter(Boolean)
                    .map(rule => {
                        const [property, value] = rule.split(":").map(str => str.trim());
                        return [property, value];
                    })
            )
            : {};
        setOriginalBodyStyles(styleObj);

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        const scrollY = window.scrollY;
        const newStyles = {
            ...originalBodyStyles,
            position: "fixed",
            top: `-${scrollY}px`,
            width: "100%",
            paddingRight: `${scrollbarWidth}px`,
        };
        Object.assign(document.body.style, newStyles);
    }, [originalBodyStyles, stack.length])

    const create = useCallback((context: DialogOptions) => {
        const d = Dialog(context)
        setDialogs(prev => [...prev, d])
        sp(prev => !prev)
        initBody()
        stack.push(d.id, d)
        sp(false)
        d.handler.onDismiss(() => {
            stack.pop()
            setDialogs(prev => prev.filter(dl => dl.id != d.id))
            sp(false)
            if (stack.length == 0) {
                document.body.removeAttribute("style")
                Object.assign(document.body.style, originalBodyStyles)
            }
        });
        d.handler.onTPrevious(() => {
            sp(true)
        });
        return d.builder
    }, [initBody, originalBodyStyles, stack])

    useEffect(() => {
        const currentDialog = stack.getCurrentDialog();
        if (currentDialog) {
            setDialogs([currentDialog.content]);
        }
    }, [stack]);

    const getVisibilityState = (index: number, id: string) => {
        return (index === dialogs.length - 1) || (prevState && stack.getCurrentDialog()?.prev?.content.id == id) ? "" : "hidden"
    }

    return (
        <DialogContext.Provider value={{create}}>
            {children}
            {dialogs.map((dialog, index) => (
                <div
                    key={index}
                    className={getVisibilityState(index, dialog.id)}
                >
                    {dialog.view}
                </div>
            ))}
        </DialogContext.Provider>
    );
}

const useDialog = (): DialogContextType => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};

// Dialog Component
interface DialogComponentProps {
    content: ReactNode;
    onClose: () => void;
    tPrevious: Closure;
    handler: DialogComponentHandler
    cancelable: boolean;
    design?: DialogOptions["design"];
    size?: DialogOptions["size"];
    radius?: DialogOptions["radius"];
}

interface DialogComponentHandler {
    closeHandler: (handler: Closure) => void;

    onHide(param: Closure): void;
}

const DialogComponent: React.FC<DialogComponentProps> = ({
                                                             content,
                                                             handler,
                                                             tPrevious,
                                                             design,
                                                             onClose,
                                                             cancelable,
                                                             size,
                                                             radius
                                                         }) => {
    const [visible, setVisible] = useState(false);
    const [showContent, setShowContent] = useState(false);
    // const [originalBodyStyles, setOriginalBodyStyles] = useState<Record<string, string>>({});

    // Handle scroll locking to prevent layout shift
    // useEffect(() => {
    //     if (visible) {
    //         const styleAttr = document.body.getAttribute("style") ?? "";
    //         const styleObj = styleAttr
    //             ? Object.fromEntries(
    //                 styleAttr
    //                     .split(";")
    //                     .map(rule => rule.trim())
    //                     .filter(Boolean)
    //                     .map(rule => {
    //                         const [property, value] = rule.split(":").map(str => str.trim());
    //                         return [property, value];
    //                     })
    //             )
    //             : {};
    //         setOriginalBodyStyles(styleObj);
    //
    //         const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    //         const scrollY = window.scrollY;
    //         const newStyles = {
    //             ...originalBodyStyles,
    //             position: "fixed",
    //             top: `-${scrollY}px`,
    //             width: "100%",
    //             paddingRight: `${scrollbarWidth}px`,
    //         };
    //         Object.assign(document.body.style, newStyles);
    //         const eom = JSON.parse(document.body.getAttribute("eom") ?? "{}")
    //         console.log(eom)
    //         document.body.setAttribute("eom", JSON.stringify(originalBodyStyles))
    //
    //         console.log(originalBodyStyles)
    //
    //         return () => {
    //             document.body.removeAttribute("style")
    //             console.log("ort", originalBodyStyles)
    //             Object.assign(document.body.style, originalBodyStyles)
    //             window.scrollTo(0, scrollY);
    //         };
    //     }
    // }, [visible]);

    const handleOutsideClick = (e: React.MouseEvent) => {
        if (cancelable && e.target === e.currentTarget) {
            handleClose();
            tPrevious();
        }
    };

    const handleClose = useCallback(() => {
        setShowContent(false);
        setTimeout(() => setVisible(false), 350);
        setTimeout(() => {
            onClose()
        }, 300);
    }, [onClose]);

    useEffect(() => {
        setVisible(true);
        setShowContent(true);
        handler.closeHandler(handleClose);
    }, [handler, handleClose]);

    // Tailwind dialog size classes
    const sizeClasses = {
        "sm": "w-[300px]",
        "md": "w-[500px]",
        "lg": "w-[800px]",
        "xl": "w-[1140px]",
        "xxl": "w-[1200px]",
    };

    // Tailwind border radius classes
    const radiusClasses = {
        "none": "rounded-none",
        "sm": "rounded",
        "md": "rounded-md",
        "lg": "rounded-lg",
        "xl": "rounded-xl",
        "full": "rounded-full",
    };

    // Handle responsive design options with Tailwind
    const scrollableDesign = () => {
        if (!design)
            return ""
        if (design.includes("scrollable"))
            return "overflow-y-auto scrollbar-thin h-full scrollbar-rounded-full"
    }
    const getResponsiveClasses = () => {
        if (!design) return "";

        const classes: string[] = [];

        if (design.includes("scrollable")) {
            classes.push("h-[80vh]");
        }

        if (design.includes("sm-down")) {
            classes.push("max-sm:w-full max-sm:max-w-full max-sm:m-0 max-sm:min-h-screen");
        }

        if (design.includes("md-down")) {
            classes.push("max-md:w-full max-md:max-w-full max-md:m-0 max-md:min-h-screen");
        }

        if (design.includes("lg-down")) {
            classes.push("max-lg:w-full max-lg:max-w-full max-lg:m-0 max-lg:min-h-screen");
        }

        if (design.includes("xl-down")) {
            classes.push("max-xl:w-full max-xl:max-w-full max-xl:m-0 max-xl:min-h-screen");
        }

        if (design.includes("xxl-down")) {
            classes.push("max-2xl:w-full max-2xl:max-w-full max-2xl:m-0 max-2xl:min-h-screen");
        }

        return classes.join(" ");
    }

    return (
        <div
            onClick={handleOutsideClick}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
            } ${visible ? "" : "pointer-events-none"}`}
        >
            <div
                className={`relative ${sizeClasses[size ?? 'md']} ${getResponsiveClasses()} 
                transition-all duration-300 transform
                ${showContent ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
            >
                <div
                    className={`bg-white dark:bg-gray-800 ${radiusClasses[radius ?? 'lg']} shadow-xl ${scrollableDesign() || 'overflow-hidden'}`}>
                    {content}
                </div>
            </div>
        </div>
    );
};

export {DialogProvider, useDialog};