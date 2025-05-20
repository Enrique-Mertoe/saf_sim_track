"use client"
import {AppProvider} from "@/ui/provider/AppProvider";
import React, {useEffect, useState} from "react";
import {usePathname} from "next/navigation";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import {useNavigationStore} from "@/lib/nav-store";
import Signal from "@/lib/Signal";
import CircularLoader from "@/ui/components/CircularLoader";

NProgress.configure({showSpinner: false});
export default function DashLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const [loading, setLoading] = useState(false)
    const pathname = usePathname();
    useEffect(() => {
        setLoading(false);
        const container = document.getElementById('main-content');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'translateY(10px)';
        }
    }, [pathname]);

    useEffect(() => {
        Signal.on("app-page-loading", e => setLoading(true));
        return () => {
            Signal.off("app-page-loading")
        };
    }, []);
    return (
        <AppProvider>
            <CircularLoader isVisible={loading}/>
            {children}
        </AppProvider>
    );
}


