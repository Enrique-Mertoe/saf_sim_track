'use client';

import React, {useState, useEffect, useRef} from 'react';
import {usePathname, useRouter} from "next/navigation";
import Link from 'next/link';
import {motion, AnimatePresence} from 'framer-motion';
import {
    Award, Grid, LogOut, Map, Phone, PieChart,
    RefreshCw, Settings, UserPlus, Users, Loader2
} from "lucide-react";
import useApp from "@/ui/provider/AppProvider";
import {create} from 'zustand';
import Signal from "@/lib/Signal";
import {$} from "@/lib/request";

// Store for tracking page loads and transitions
interface NavigationStore {
    isFirstLoad: boolean;
    isLoading: boolean;
    currentPath: string | null;
    setFirstLoadComplete: () => void;
    startLoading: () => void;
    finishLoading: (path: string) => void;
}

const useNavigationStore = create<NavigationStore>((set) => ({
    isFirstLoad: true,
    isLoading: false,
    currentPath: null,
    setFirstLoadComplete: () => set({isFirstLoad: false}),
    startLoading: () => set({isLoading: true}),
    finishLoading: (path) => set({isLoading: false, currentPath: path}),
}));

const getInitials = (fullName: string) => {
    if (!fullName) return '';
    return fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
};

type NavItemProps = {
    href: string;
    icon: React.ElementType;
    label: string;
    onClick?: (e: React.MouseEvent) => void;
};

const NavItem = ({href, icon: Icon, label, onClick}: NavItemProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const isActive = pathname === href;
    const {startLoading} = useNavigationStore();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (onClick) {
            onClick(e);
            return;
        }

        // Don't navigate if already on the page
        if (isActive) return;

        // Start loading state
        startLoading();

        // Smooth transition to new route
        const container = document.getElementById('main-content');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'translateY(10px)';
        }
        router.push(href, {scroll: false});

    };

    return (
        <Link href={href} onClick={handleClick} className="block">
            <motion.div
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive
                        ? 'bg-green-100 text-green-700 font-medium shadow-sm'
                        : 'hover:bg-gray-100 text-gray-700'
                }`}
            >
                <div className={`${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    <Icon size={20}/>
                </div>
                <span>{label}</span>
                {isActive && (
                    <motion.div
                        layoutId="active-indicator"
                        className="absolute right-0 w-1 h-8 bg-green-600 rounded-l-md"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{duration: 0.2}}
                    />
                )}
            </motion.div>
        </Link>
    );
};

export default function Sidebar() {
    const {user, signOut} = useApp();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const initialRenderRef = useRef(true);
    const pathname = usePathname();

    // Get navigation store values
    const {
        isFirstLoad,
        isLoading,
        setFirstLoadComplete,
        finishLoading
    } = useNavigationStore();

    // Handle responsive states
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            Signal.trigger("mobile-change", window.innerWidth < 768)
            if (window.innerWidth > 768) {
                setShowMobileMenu(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // First load detection
    useEffect(() => {
        // Set first load complete after initial render
        if (isFirstLoad) {
            // Short delay to allow initial animations to complete
            const timer = setTimeout(() => {
                setFirstLoadComplete();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isFirstLoad, setFirstLoadComplete]);

    // Handle navigation completion
    useEffect(() => {
        if (initialRenderRef.current) {
            initialRenderRef.current = false;
            return;
        }

        const container = document.getElementById('main-content');
        if (container && !isLoading) {
            // Apply transition effects
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';

            // Complete loading state
            finishLoading(pathname);
        }
    }, [pathname, isLoading, finishLoading]);

    const handleSignOut = (e: React.MouseEvent) => {
        e.preventDefault();

        // Fade out effect before logout
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.opacity = '0.5';
        }

        setTimeout(() => {
            signOut();
        }, 300);
    };

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const v = !isCollapsed;
            Signal.trigger("param-change", v)
            return v
        });

    };

    const sidebarVariants = {
        expanded: {width: '280px'},
        collapsed: {width: '80px'}
    };

    // Navigation items based on user role
    const getNavItems = () => {
        const navItems = [];
        navItems.push(
            {href: '/dashboard', icon: Grid, label: 'Dashboard'},
            {href: '/analytics', icon: PieChart, label: 'Analytics'}
        );
        // Role-specific items
        if (user?.role === 'admin') {
            navItems.push(
                {href: '/users', icon: Users, label: 'Users'},
                {href: '/team', icon: UserPlus, label: 'Teams'},
                {href: '/map', icon: Map, label: 'Location'},
                {href: '/settings', icon: Settings, label: 'Settings'}
            );
        } else if (user?.role === 'teamLeader') {
            navItems.push(
                {href: '/team', icon: UserPlus, label: 'My Team'},
                {href: '/map', icon: Map, label: 'Location'},
                {href: '/settings', icon: Settings, label: 'Settings'}
            );
        } else if (user?.role === 'staff') {
            navItems.push(
                {href: '/contacts', icon: Phone, label: 'Contacts'},
                {href: '/achievements', icon: Award, label: 'Achievements'}
            );
        }

        return navItems;
    };
    const renderSidebarContent = () => (
        <>
            <div className="px-4 py-6">
                <motion.div
                    className="flex items-center space-x-3"
                    initial={isFirstLoad ? {opacity: 0, y: -10} : {opacity: 1, y: 0}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: isFirstLoad ? 0.2 : 0}}
                >
                    <div className="relative">
                        <motion.div
                            className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
                            whileHover={{scale: 1.05, rotate: 5}}
                        >
                            {getInitials(user?.full_name ?? 'N/A')}
                        </motion.div>
                        <motion.div
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                            animate={{
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                repeat: Infinity,
                                repeatDelay: 4,
                                duration: 1
                            }}
                        />
                    </div>

                    {!isCollapsed && (
                        <motion.div
                            initial={isFirstLoad ? {opacity: 0, x: -10} : {opacity: 1, x: 0}}
                            animate={{opacity: 1, x: 0}}
                            className="flex flex-col"
                        >
                            <span className="font-medium text-gray-800">{user?.full_name}</span>
                            <span className="text-sm text-gray-500 capitalize">{user?.role}</span>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            <div className="mt-2 px-3">
                <AnimatePresence>
                    {getNavItems().map((item, index) => (
                        <motion.div
                            key={item.href}
                            initial={isFirstLoad ? {opacity: 0, x: -20} : {opacity: 1, x: 0}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: isFirstLoad ? index * 0.05 : 0}}
                            className="relative mb-1"
                        >
                            <NavItem
                                href={item.href}
                                icon={item.icon}
                                label={!isCollapsed ? item.label : ''}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="mt-auto px-3 pb-6">
                <motion.button
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                    onClick={handleSignOut}
                    className={`flex items-center space-x-3 p-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-all duration-200`}
                >
                    <LogOut size={20}/>
                    {!isCollapsed && <span>Logout</span>}
                </motion.button>
            </div>
        </>
    );

    // Mobile menu button
    const mobileMenuButton = (
        <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden fixed top-4 right-4 z-50 bg-green-600 text-white p-2 rounded-full shadow-lg"
        >
            <motion.div
                animate={{rotate: showMobileMenu ? 180 : 0}}
                transition={{duration: 0.3}}
            >
                {showMobileMenu ? <LogOut size={24}/> : <Users size={24}/>}
            </motion.div>
        </button>
    );

    // Desktop sidebar collapse toggle
    const collapseButton = (
        <button
            onClick={toggleSidebar}
            className="hidden md:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md"
        >
            <motion.div
                animate={{rotate: isCollapsed ? 180 : 0}}
                transition={{duration: 0.3}}
            >
                <RefreshCw size={16} className="text-gray-500"/>
            </motion.div>
        </button>
    );

    return (
        <div className={""}>
            {isMobile && mobileMenuButton}

            {/* Mobile Sidebar (Slide-in drawer) */}
            {isMobile && (
                <AnimatePresence>
                    {showMobileMenu && (
                        <>
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 0.5}}
                                exit={{opacity: 0}}
                                className="fixed inset-0 bg-black z-30"
                                onClick={() => setShowMobileMenu(false)}
                            />
                            <motion.div
                                id="sidebar"
                                initial={{x: '-100%'}}
                                animate={{x: 0}}
                                exit={{x: '-100%'}}
                                transition={{type: 'spring', damping: 20}}
                                className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-40 flex flex-col"
                            >
                                {renderSidebarContent()}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            )}

            {/* Desktop Sidebar */}
            {!isMobile && (
                <motion.div
                    id="sidebar"
                    variants={sidebarVariants}
                    initial={false} // Disable initial animation after first render
                    animate={isCollapsed ? 'collapsed' : 'expanded'}
                    transition={{type: 'spring', damping: 20}}
                    className="sticky top-0 h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col"
                >
                    {collapseButton}
                    {renderSidebarContent()}
                </motion.div>
            )}

            {/* Add a wrapper for main content elsewhere in your layout */}
            <script dangerouslySetInnerHTML={{
                __html: `
        // Setup main content wrapper if it doesn't exist
        document.addEventListener('DOMContentLoaded', () => {
          if (!document.getElementById('main-content')) {
            const mainContent = document.querySelector('main');
            if (mainContent) {
              mainContent.id = 'main-content';
              mainContent.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            }
          }
        });
      `
            }}/>
        </div>
    );
}