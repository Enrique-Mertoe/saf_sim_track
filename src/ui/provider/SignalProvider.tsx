"use client"
import React, {ReactNode, useEffect, useRef, useState} from "react";
import Signal from "@/lib/Signal";
import {AnimatePresence, motion} from "framer-motion";
import Create from "@/app/dashboard/team/create";
import Edit from "@/app/dashboard/team/edit";
import ViewTeamDetails from "@/app/dashboard/team/view";
import {v4 as uuidv4} from "uuid";
import {cn} from "@/lib/utils";
import {useDimensions} from "@/ui/library/smv-ui/src/framework/utility/Screen"; // npm install uuid

type ModalEntry = {
    id: string;
    element: ReactNode;
};

export default function SignalProvider() {
    const [modals, setModals] = useState<ModalEntry[]>([]);
    useEffect(() => {
        Signal.on("create-team", () => {
            const id = uuidv4();
            const modal: ModalEntry = {
                id,
                element: (
                    <ScrollableDialog
                        id={id}
                        onDismiss={() => setModals((prev) => prev.filter((m) => m.id !== id))}
                    >
                        <Create
                            onDismiss={() => {
                                setModals((prev) => prev.filter((m) => m.id !== id));
                            }}
                        />
                    </ScrollableDialog>
                )
            };

            setModals((prev) => [...prev, modal]);
        });

        Signal.on("edit-team", (team) => {
            const id = uuidv4();
            const modal: ModalEntry = {
                id,
                element: (
                    <ScrollableDialog
                        id={id}
                        onDismiss={() => setModals((prev) => prev.filter((m) => m.id !== id))}
                    >
                        <Edit
                            team={team}
                            onDismiss={() => {
                                setModals((prev) => prev.filter((m) => m.id !== id));
                            }}
                        />
                    </ScrollableDialog>
                )
            };

            setModals((prev) => [...prev, modal]);
        });

        Signal.on("view-team-details", (team) => {
            const id = uuidv4();
            const modal: ModalEntry = {
                id,
                element: (
                    <ScrollableDialog
                        id={id}
                        onDismiss={() => setModals((prev) => prev.filter((m) => m.id !== id))}
                        size="xl"
                    >
                        <ViewTeamDetails
                            team={team}
                            onDismiss={() => {
                                setModals((prev) => prev.filter((m) => m.id !== id));
                            }}
                        />
                    </ScrollableDialog>
                )
            };

            setModals((prev) => [...prev, modal]);
        });


        Signal.on("view-pick-content", (Content, props) => {
            const id = uuidv4();
            const modal: ModalEntry = {
                id,
                element: (
                    <ScrollableDialog
                        id={id}

                        onDismiss={() => setModals((prev) => prev.filter((m) => m.id !== id))}
                        {...props}

                    >
                        <Content onDismiss={() => {
                            setModals((prev) => prev.filter((m) => m.id !== id));
                        }}/>
                    </ScrollableDialog>
                )
            };

            setModals((prev) => [...prev, modal]);
        });
        Signal.on("__modal", (Content, props) => {
            const id = uuidv4();
            const modal: ModalEntry = {
                id,
                element: (
                    <ScrollableDialog
                        id={id}

                        onDismiss={() => setModals((prev) => prev.filter((m) => m.id !== id))}
                        {...props}

                    >
                        <Content onClose={() => {
                            setModals((prev) => prev.filter((m) => m.id !== id));
                        }}/>
                    </ScrollableDialog>
                )
            };

            setModals((prev) => [...prev, modal]);
        });

        return () => {
            Signal.off("create-team");
            Signal.off("edit-team");
            Signal.off("view-team-details");
            Signal.off("view-pick-content");
            Signal.off("__modal");
        };
    }, []);

    return (
        <AnimatePresence>
            {modals.map(({id, element}) => (
                <React.Fragment key={id}>{element}</React.Fragment>
            ))}
        </AnimatePresence>
    );
}


const ScrollableDialog = ({id, onDismiss, children, className = "", size = "lg", design = ""}: any) => {
    const ref = useRef<HTMLDivElement>(null);
    const handleBackdropClick = (e: any) => {
        if (ref.current && ref.current.contains(e.target)) {
            onDismiss();
        }
    };
    const dimen = useDimensions()

    React.useEffect(() => {
        // Lock scroll
        document.body.style.overflow = 'hidden';

        const stateKey = `modal-${id}`;
        if (!window.history.state?.modal) {
            window.history.pushState({modal: stateKey}, "");
        }


        const handlePopState = (e: PopStateEvent) => {
            // Intercept back button → close modal
            if (onDismiss) {
                e.preventDefault();
                onDismiss();
                window.history.go(1);
            }
        };

        window.addEventListener("popstate", handlePopState);


        return () => {
            document.body.style.overflow = '';
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    const sizeClasses = {
        xs: "w-80",      // 320px
        sm: "w-96",      // 384px
        md: "w-[32rem]", // 512px
        lg: "w-[48rem]", // 768px
        xl: "w-[64rem]", // 1024px
        "2xl": "w-[80rem]", // 1280px
        full: "w-full"
    };

    return (
        <motion.div
            ref={ref}
            key={id}
            className="fixed inset-0 z-55 bg-black/30 bg-opacity-50 max-h-[100vh] overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className={cn(
                "min-h-[100vh] mx-auto max-sm:w-full max-w-full flex items-center justify-center",
                //@ts-ignore
                sizeClasses[size || "lg"],
                className
            )}>
                <motion.div
                    initial={{opacity: 0, scale: 1.1}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0, scale: 1.1}}
                    transition={{duration: 0.2}}
                    className={
                        cn("max-sm:min-h-full max-sm:rounded-none rounded-xl w-full",
                            //@ts-ignore
                            design)
                    }
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </motion.div>
            </div>
        </motion.div>
    );
};


