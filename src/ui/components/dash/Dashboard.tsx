"use client"
import Sidebar from "@/ui/components/dash/Sidebar";
import Header from "@/ui/components/dash/Header";
import React, {useEffect, useState} from "react";
import PageTransition from "@/lib/page-transition";
import Signal from "@/lib/Signal";
import {motion} from "framer-motion";


const Dashboard: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [mobile, setIsMobile] = useState<boolean | null>(null);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);

        function handler(collapse: boolean) {
            setCollapsed(collapse)
        }

        Signal.on("param-change", handler);
        Signal.on("mobile-change", m => setIsMobile(m));
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            Signal.off("param-change", handler);
            Signal.off("mobile-change");
            window.removeEventListener('resize', checkMobile);
        };
    }, []);
    if (mobile === null) {
        return null;
    }
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header/>
            <div className="flex w-full mt-24 md:mt-14">
                {/* Sidebar - Desktop */}
                <motion.div
                    initial={false}
                    animate={'expanded'}
                    transition={{type: 'spring', damping: 20}}
                    className={`hidden w-64 md:block bg-white shadow-md z-30 h-screen fixed`}>
                    <Sidebar/>
                </motion.div>
                {/* Main Content */}

                <motion.div
                    initial={false}
                    animate={'expanded'}
                    transition={{type: 'spring', damping: 20}}
                    className={`flex-1 w-full max-sm:pt-14  md:ml-64 overflow-x-hidden  relative`}>
                    <PageTransition>
                        {children}
                    </PageTransition>
                </motion.div>

            </div>
        </div>
    );
};

export default Dashboard;