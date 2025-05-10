"use client"
import React, {createContext, useContext, useState, useCallback, ReactNode, useEffect} from "react";
import {generateUUID} from "@/helper";
import DialogStack from "@/app/_providers/dialog/dialog-provider.library";


interface DialogOptions {
    content: ReactNode;
    cancelable?: boolean;
    design?: ("md-down" | "sm-down" | "lg-down" | "xl-down" | "xxl-down" | "scrollable")[];
    size?: "sm" | "md" | "lg" | "xl" | "xxl";
    onOpen?: () => void;
    onClose?: () => void;
    persist?: boolean;
}

interface DialogContextType {
    // showDialog: (options: DialogOptions) => void;
    // dismiss: () => void;
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


const Dialog = ({
                    cancelable, content, onOpen, onClose, persist, size, design
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
        }, onTPrevious(param: Closure) {
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
    const create = useCallback((context: DialogOptions) => {
        const d = Dialog(context)
        setDialogs(prev => [...prev, d])
        sp(prev => !prev)
        stack.push(d.id, d)
        d.handler.onDismiss(() => {
            stack.pop()
            setDialogs(prev => prev.filter(dl => dl.id != d.id))
            sp(false)
        });
        d.handler.onTPrevious(() => {
            sp(true)
        });
        return d.builder
    }, [stack])
    useEffect(() => {
        const currentDialog = stack.getCurrentDialog();
        if (currentDialog) {
            setDialogs([currentDialog.content]);
        }
    }, [stack]);
    const gS = (index: number, id: string) => {
        return (index === dialogs.length - 1) || (prevState && stack.getCurrentDialog()?.prev?.content.id == id) ? "" : "hidden"
    }

    return (
        <DialogContext.Provider value={{create}}>
            {children}
            {dialogs.map((dialog, index) => (
                <div

                    key={index}
                    className={gS(index, dialog.id)}
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
    size: DialogOptions["size"];
}

interface DialogComponentHandler {
    closeHandler: (handler: Closure) => void;

    onHide(param: Closure): void;
}


const DialogComponent:
    React.FC<DialogComponentProps> =
    ({
         content,
         handler,
         tPrevious,
         design,
         onClose,
         cancelable,
         size
     }) => {
        const [visible, setVisible] = useState(false);
        const [s, setS] = useState(false);
        const handleOutsideClick = (e: React.MouseEvent) => {
            if (cancelable && e.target === e.currentTarget) {
                tClose()
                tPrevious()
            }
        };

        const tClose = useCallback(() => {
            setTimeout(() => setVisible(false), 350)
            setS(false)
            setTimeout(onClose, 300)
        }, [onClose])


        useEffect(() => {
            setVisible(() => true);
            setS(true)
            handler.closeHandler(tClose)
        }, [handler, tClose, visible]);

        const designs = {
            "md-down": "dialog-fullscreen-md-down",
            "sm-down": "dialog-fullscreen-sm-down",
            "lg-down": "dialog-fullscreen-lg-down",
            "xl-down": "dialog-fullscreen-xl-down",
            "xxl-down": "dialog-fullscreen-xxl-down",
            "scrollable": "dialog-dialog-scrollable",
        }
        const sizes = {
            "md": "dialog-md",
            "sm": "dialog-sm",
            "lg": "dialog-lg",
            "xl": "dialog-xl",
            "xxl": "dialog-xxl",
        }
        return (
            <div
                onClick={handleOutsideClick}
                className={`modal ${sizes[size ?? 'md']} fade ${
                    s ? "show" : "!opacity-0"
                }`}>
                <div className={`dialog-dialog dialog-dialog-centered ${
                    design?.map(d => designs[d ?? 'sm-down']).join(' ')
                }`}>
                    <div className={`dialog-content rounded-sm`}>
                        {content}
                    </div>
                </div>
            </div>
        );
    };


export {DialogProvider, useDialog};