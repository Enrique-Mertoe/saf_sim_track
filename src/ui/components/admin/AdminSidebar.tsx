'use client';

import React, {useEffect, useState} from 'react';
import {usePathname, useRouter} from "next/navigation";
import Link from 'next/link';
import {motion} from 'framer-motion';
import {BarChart, CreditCard, Grid, LogOut, Settings, Users,} from "lucide-react";
import Signal from "@/lib/Signal";

type NavItemProps = {
    href: string;
    icon: React.ElementType;
    label: string;
    onClick?: (e: React.MouseEvent) => void;
};

const NavItem = ({ href, icon: Icon, label, onClick }: NavItemProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const isActive = pathname === href;

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        Signal.trigger("mobile-open", false);
        if (onClick) {
            onClick(e);
            return;
        }

        // Don't navigate if already on the page
        if (isActive) return;

        Signal.trigger("app-page-loading", true);
        router.push(href, { scroll: false });
    };

    return (
        <Link href={href} onClick={handleClick} className="block">
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium shadow-sm'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
            >
                <div
                    className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <Icon size={20} />
                </div>
                <span>{label}</span>
                {isActive && (
                    <motion.div
                        layoutId="admin-active-indicator"
                        className="absolute right-0 w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-l-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </motion.div>
        </Link>
    );
};

export default function AdminSidebar() {
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const pathname = usePathname();

    // Handle mobile menu
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        // Initial check
        handleResize();

        // Listen for window resize
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Listen for mobile menu toggle signal
    useEffect(() => {
        const handleMobileToggle = (isOpen: boolean) => {
            setShowMobileMenu(isOpen);
        };

        Signal.on("mobile-open", handleMobileToggle);
        return () => {
            Signal.off("mobile-open", handleMobileToggle);
        };
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setShowMobileMenu(false);
    }, [pathname]);

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/system/admin/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                window.location.href = '/system/admin/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Admin navigation items
    const navItems = [
        { href: '/system/admin/dashboard', icon: Grid, label: 'Dashboard' },
        { href: '/system/admin/users', icon: Users, label: 'Users' },
        { href: '/system/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
        { href: '/system/admin/analytics', icon: BarChart, label: 'Analytics' },
        { href: '/system/admin/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <div
                id="admin-sidebar"
                className={`hidden lg:flex flex-col w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ease-in-out`}
            >
                {/* Logo */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <Link href="/system/admin/dashboard">
                        <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Admin Panel</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                        />
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <NavItem
                        href="/system/admin/logout"
                        icon={LogOut}
                        label="Logout"
                        onClick={handleLogout}
                    />
                </div>
            </div>

            {/* Mobile Sidebar */}
            <div
                className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
                    showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                        showMobileMenu ? 'opacity-50' : 'opacity-0'
                    }`}
                    onClick={() => Signal.trigger("mobile-open", false)}
                />

                {/* Sidebar */}
                <div
                    className={`absolute top-0 left-0 w-64 h-full bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ${
                        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    {/* Logo */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <Link href="/system/admin/dashboard">
                            <div className="flex items-center space-x-2">
                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Admin Panel</span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                        {navItems.map((item) => (
                            <NavItem
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                            />
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <NavItem
                            href="/system/admin/logout"
                            icon={LogOut}
                            label="Logout"
                            onClick={handleLogout}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Toggle Button */}
            <button
                className="lg:hidden fixed bottom-4 right-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg"
                onClick={() => Signal.trigger("mobile-open", true)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </>
    );
}