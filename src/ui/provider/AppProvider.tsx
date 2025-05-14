"use client"
import React, {createContext, useContext, useEffect, useState} from "react";
import {authService} from "@/services";
import {User} from "@/models";
import {AnimatePresence, motion} from "framer-motion";
import {Loader2} from "lucide-react";
import {useNavigationStore} from "@/lib/nav-store";
import {$} from "@/lib/request";
import {toast} from "react-hot-toast";

interface AppContextType {
    user: User | null,
    signOut: Closure,
    pageLoading: boolean
}

const AppContext = createContext<AppContextType | null>(null)

export const AppProvider: React.FC<{
    children: React.ReactNode
}> = ({children}) => {
    const [user, setUser] = useState<User | null>(null)
    const [pageLoading, setPageLoading] = useState<boolean>(true)
    const signOut = async () => {
        const t_id = toast.loading("Loging out.")
        $.post<User>({
            url: "/api/auth",
            data: {
                action: "logout"
            },
            contentType: $.JSON
        }).then(async () => {
            await authService.signOut();
            location.reload();
        }).catch(() => {
            toast.error("unable to logout")
        }).done(() => {
            toast.dismiss(t_id)
        })
    }

    const handler: AppContextType = {
        user,
        signOut, pageLoading
    }

    async function er() {
        const {user} = await authService.getCurrentUser();
        setPageLoading(false)
        setUser(user);

    }

    useEffect(() => {
        er().then()
        // $.post<User>({
        //     url: "/api/auth",
        //     data: {
        //         action: "user"
        //     },
        //     contentType: $.JSON
        // }).then(res => {
        //     console.log(res.data)
        //     setUser(res.data)
        // }).catch(() => {
        //
        // })
    }, []);

    return (
        <AppContext.Provider value={handler}>
            {/* Loading Overlay */}
            <AnimatePresence>
                {pageLoading && <LoadingOverlay props={{pageLoading}}/>}
            </AnimatePresence>
            {children}
        </AppContext.Provider>
    )
}

const LoadingOverlay = ({props}: {
    props: {
        pageLoading: boolean
    }
}) => {
    const {isLoading: load} = useNavigationStore()
    const isLoading = props.pageLoading || load
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isLoading) {
            setProgress(0);
            const timer = setInterval(() => {
                setProgress(prev => {
                    // Slow down progress as it approaches 90%
                    const increment = 100 - prev < 20 ? 0.5 : 5;
                    return Math.min(prev + increment, 90);
                });
            }, 100);

            return () => clearInterval(timer);
        } else {
            // When loading completes, quickly finish the bar
            setProgress(100);
        }
    }, [isLoading]);

    if (!isLoading && progress === 100) return null;

    return (
        <div
            className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-70 dark:bg-opacity-80 flex items-center justify-center z-100">
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -20}}
                className="flex flex-col items-center"
            >
                <div className="relative">
                    <Loader2 className="h-12 w-12 text-green-600 dark:text-green-500 animate-spin"/>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span
                            className="text-xs font-medium text-green-800 dark:text-green-300">{Math.floor(progress)}%</span>
                    </div>
                </div>
                <div className="mt-4 w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-green-600 dark:bg-green-500"
                        initial={{width: 0}}
                        animate={{width: `${progress}%`}}
                        transition={{ease: "easeOut"}}
                    />
                </div>
            </motion.div>
        </div>
    );
};

const useApp = () => {
    const context = useContext(AppContext);
    if (!context)
        throw new Error("Use context must used inside appcontext")
    return context
}
export default useApp