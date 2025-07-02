"use client"
import {AppProvider} from "@/ui/provider/AppProvider";
import React, {useEffect, useState} from "react";
import {usePathname} from "next/navigation";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import Signal from "@/lib/Signal";
import CircularLoader from "@/ui/components/CircularLoader";
import CopilotView from "@/ui/components/CopilotView";

NProgress.configure({showSpinner: false});
export default function DashLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const [loading, setLoading] = useState(false)
    const pathname = usePathname();

    const [copilot, setCopilot] = useState({
        open: false,
        params: {},
    })
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
        Signal.on("ssm-copilot", e => {
            setCopilot({open: true, params: e.params})
        });
        return () => {
            Signal.off("app-page-loading")
            Signal.off("ssm-copilot")
        };
    }, []);
    return (
        <AppProvider>
            <CircularLoader isVisible={loading}/>
            <div className="flex bg-green-700 min-h-screen w-full">
                <div className="flex-1">
                    {children}
                </div>
                {/* Mantix AI Copilot */}
                <CopilotView 
                    isOpen={copilot.open}
                    onClose={() => setCopilot({open: false, params: {}})}
                    context={copilot.params}
                />
            </div>
        </AppProvider>
    );
}


