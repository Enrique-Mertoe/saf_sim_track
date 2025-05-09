'use client';

import {usePathname} from 'next/navigation';
import React, {useState, useEffect} from 'react';
import {useNavigationStore} from "@/lib/nav-store";

/**
 * PageTransition component that handles animations between page navigations
 *
 * Place this component at the root layout to enable smooth page transitions
 * without requiring animations on every page load
 */
export default function PageTransition({children}: { children: React.ReactNode }) {
    const pathname = usePathname();
    const {isFirstLoad, isLoading} = useNavigationStore();
    const [prevPathname, setPrevPathname] = useState(pathname);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Skip transition on first load
        if (isFirstLoad) return;

        // Only trigger transition if pathname changed
        if (pathname !== prevPathname) {
            setIsTransitioning(true);

            // Update previous pathname after a delay
            // to prevent flicker during transitions
            const timer = setTimeout(() => {
                setPrevPathname(pathname);
                setIsTransitioning(false);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [pathname, prevPathname, isFirstLoad]);

    return (
        <div id="main-content" className={`
      w-full transition-all duration-300 ease-in-out
      ${isTransitioning || isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
    `}>
            {children}
        </div>
    );
}