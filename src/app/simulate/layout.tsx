"use client"
import React, {useState} from "react";
import {usePathname} from "next/navigation";
import 'nprogress/nprogress.css';
import CircularLoader from "@/ui/components/CircularLoader";
import {AppProvider} from "@/ui/provider/AppProvider";

// NProgress.configure({showSpinner: false});

export default function SimulateLayout({
                                           children,
                                       }: Readonly<{
    children: React.ReactNode;
}>) {
    const [loading, setLoading] = useState(false);
    const pathname = usePathname();

    // useEffect(() => {
    //     setLoading(false);
    //     const container = document.getElementById('main-content');
    //     if (container) {
    //         container.style.opacity = '0';
    //         container.style.transform = 'translateY(10px)';
    //     }
    // }, [pathname]);
    //
    // useEffect(() => {
    //     Signal.on("app-page-loading", e => setLoading(true));
    //     return () => {
    //         Signal.off("app-page-loading");
    //     };
    // }, []);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <CircularLoader isVisible={loading}/>
            <div id="main-content" className="transition-all duration-300 ease-in-out">
                <AppProvider>
                    {children}
                </AppProvider>
            </div>
        </div>
    );
}