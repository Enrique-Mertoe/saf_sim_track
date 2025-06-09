'use client';

import React, {useEffect, useRef, useState} from 'react';
import {usePathname, useRouter} from "next/navigation";
import Link from 'next/link';
import {AnimatePresence, motion} from 'framer-motion';
import {
    ArrowLeftRight,
    Award,
    BarChart,
    ClipboardList,
    Cpu,
    CreditCard,
    Crown,
    Grid,
    LogOut,
    Phone,
    PieChart,
    Settings,
    Shield,
    Star,
    User,
    UserPlus,
    Users,
    Zap,
} from "lucide-react";
import useApp from "@/ui/provider/AppProvider";
import {create} from 'zustand';
import Signal from "@/lib/Signal";
import {UserRole} from "@/models";

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
        Signal.trigger("mobile-open", false)
        if (onClick) {
            onClick(e);
            return;
        }

        // Don't navigate if already on the page
        if (isActive) return;

        // Start loading state
        // startLoading();
        Signal.trigger("app-page-loading", true)
        router.push(href, {scroll: false});

    };

    return (
        <Link href={href} onClick={handleClick} className="block">
            <motion.div
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium shadow-sm'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
            >
                <div
                    className={`${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <Icon size={20}/>
                </div>
                <span>{label}</span>
                {isActive && (
                    <motion.div
                        layoutId="active-indicator"
                        className="absolute right-0 w-1 h-8 bg-green-600 dark:bg-green-500 rounded-l-md"
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
        signOut();
    };

    // Navigation items based on user role
    const getNavItems = () => {
        const navItems = [];
        navItems.push(
            {href: '/dashboard', icon: Grid, label: 'Dashboard'},
        );
        // Role-specific items
        if (user?.role === UserRole.ADMIN) {
            navItems.push(
                {href: '/dashboard/users', icon: Users, label: 'Users'},
                {href: '/dashboard/team', icon: UserPlus, label: 'Teams'},
                {href: '/dashboard/pick', icon: ClipboardList, label: 'PickList'},
                {href: '/dashboard/analysis', icon: BarChart, label: 'Analysis'},
                {href: '/dashboard/report', icon: PieChart, label: 'Reports'},
                // {href: '/dashboard/filemanager', icon: Folder, label: 'FileManager'},
                {href: '/dashboard/invoices', icon: CreditCard, label: 'Invoices'},
                {href: '/dashboard/transfers', icon: ArrowLeftRight, label: 'SIM Distribution'},
                {href: '/settings', icon: Settings, label: 'Settings'},
            );
        } else if (user?.role === UserRole.TEAM_LEADER) {
            navItems.push(
                {href: '/dashboard/my-team', icon: UserPlus, label: 'My Team'},
                {href: '/dashboard/leader-console', icon: PieChart, label: 'Sim Assignment'},
                {href: '/dashboard/analysis', icon: BarChart, label: 'Analysis'},
                {href: '/dashboard/transfers', icon: ArrowLeftRight, label: 'SIM Transfers'},
                {href: '/settings', icon: Settings, label: 'Settings'},
            );
        } else if (user?.role === UserRole.STAFF) {
            navItems.push(
                {href: '/dashboard/sim', icon: Phone, label: 'Sim Registration'},
                {href: '/dashboard/cards', icon: Cpu, label: 'Registered Cards'},
                {href: '/achievements', icon: Award, label: 'Achievements'}
            );
        }

        return navItems;
    };
    const getRoleConfig = (userRole: UserRole) => {
        const isAdmin = userRole === UserRole.ADMIN;
        const isTeamLeader = userRole === UserRole.TEAM_LEADER;

        if (isAdmin) {
            return {
                gradient: 'from-green-500/80 via-emerald-600/80 to-green-700/80 dark:from-green-600/70 dark:via-emerald-700/70 dark:to-green-800/70',
                avatarBg: 'bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-700 dark:to-emerald-800',
                statusColor: 'bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600',
                borderGlow: 'ring-2 ring-green-400/60 dark:ring-green-500/40',
                shadowColor: 'shadow-lg shadow-green-500/30 dark:shadow-green-600/20',
                icon: Crown,
                iconColor: 'text-green-300 dark:text-green-400',
                roleColor: 'text-green-200 dark:text-green-300',
                nameColor: 'text-white dark:text-gray-100',
                roleLabel: 'Administrator',
                hasSpecialEffects: true
            };
        } else if (isTeamLeader) {
            return {
                gradient: 'from-emerald-500/80 via-green-600/80 to-emerald-700/80 dark:from-emerald-600/70 dark:via-green-700/70 dark:to-emerald-800/70',
                avatarBg: 'bg-gradient-to-br from-emerald-600 to-green-700 dark:from-emerald-700 dark:to-green-800',
                statusColor: 'bg-gradient-to-r from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600',
                borderGlow: 'ring-2 ring-emerald-400/60 dark:ring-emerald-500/40',
                shadowColor: 'shadow-lg shadow-emerald-500/30 dark:shadow-emerald-600/20',
                icon: Shield,
                iconColor: 'text-emerald-300 dark:text-emerald-400',
                roleColor: 'text-emerald-200 dark:text-emerald-300',
                nameColor: 'text-white dark:text-gray-100',
                roleLabel: 'Team Leader',
                hasSpecialEffects: true
            };
        } else {
            return {
                gradient: 'from-green-600/70 via-emerald-700/70 to-green-800/70 dark:from-green-700/60 dark:via-emerald-800/60 dark:to-green-900/60',
                avatarBg: 'bg-green-600 dark:bg-green-700',
                statusColor: 'bg-green-500 dark:bg-green-400',
                borderGlow: '',
                shadowColor: 'shadow-md dark:shadow-lg',
                icon: User,
                iconColor: 'text-green-300 dark:text-green-400',
                roleColor: 'text-gray-400 dark:text-gray-500',
                nameColor: 'text-white dark:text-gray-200',
                roleLabel: userRole,
                hasSpecialEffects: false
            };
        }

    };
    const renderSidebarContent = () => {
        if (!user)
            return (
                <div className="py-6">
                    <div className="px-2">
                        <UserCardSkeleton isCollapsed={isCollapsed}/>
                    </div>
                </div>
            )
        const roleConfig = getRoleConfig(user?.role);
        return (
            <>
                <div className="py-6">
                    <div className="px-2">
                        {
                            user ?

                                <motion.div
                                    className={`flex px-1 py-1 bg-gradient-to-r ${roleConfig.gradient} rounded-xl items-center space-x-3 relative overflow-hidden ${getRoleConfig(user?.role).borderGlow} ${getRoleConfig(user?.role).shadowColor}`}
                                    initial={isFirstLoad ? {opacity: 0, y: -10} : {opacity: 1, y: 0}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: isFirstLoad ? 0.2 : 0}}
                                    whileHover={roleConfig.hasSpecialEffects ? {
                                        scale: 1.02,
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                                    } : {}}
                                >
                                    {/* Special background effect for admin/team leader */}
                                    {roleConfig.hasSpecialEffects && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-white/10 dark:from-white/5 to-transparent"
                                            animate={{
                                                x: ['-100%', '100%'],
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                repeatDelay: 3,
                                                duration: 2,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    )}

                                    <div className="relative z-10">
                                        <motion.div
                                            className={`w-12 h-12 ${getRoleConfig(user?.role).avatarBg} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg relative overflow-hidden`}
                                            whileHover={{
                                                scale: 1.05,
                                                rotate: getRoleConfig(user?.role).hasSpecialEffects ? 10 : 5
                                            }}
                                        >
                                            {/* Role icon overlay for special roles */}
                                            {getRoleConfig(user?.role).hasSpecialEffects && (
                                                <motion.div
                                                    className="absolute top-0 right-0 w-5 h-5 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center"
                                                    animate={{
                                                        rotate: [0, 360],
                                                    }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 8,
                                                        ease: "linear"
                                                    }}
                                                >
                                                    <roleConfig.icon className={`w-3 h-3 ${roleConfig.iconColor}`}/>
                                                </motion.div>
                                            )}

                                            {getInitials(user?.full_name ?? 'N/A')}
                                        </motion.div>

                                        <motion.div
                                            className={`absolute -bottom-1 -right-1 w-4 h-4 ${roleConfig.statusColor} rounded-full border-2 border-white dark:border-gray-900 ${getRoleConfig(user?.role).hasSpecialEffects ? 'shadow-lg' : ''}`}
                                            animate={{
                                                scale: [1, 1.3, 1],
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                repeatDelay: roleConfig.hasSpecialEffects ? 2 : 4,
                                                duration: 1
                                            }}
                                        />

                                        {/* Special sparkle effect for admins */}
                                        {user?.role === 'admin' && (
                                            <motion.div
                                                className="absolute -top-1 -left-1 w-3 h-3"
                                                animate={{
                                                    rotate: [0, 360],
                                                    scale: [0.8, 1.2, 0.8]
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 3,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                <Star
                                                    className="w-3 h-3 text-green-300 dark:text-green-400 fill-green-300 dark:fill-green-400"/>
                                            </motion.div>
                                        )}

                                        {/* Special bolt effect for team leaders */}
                                        {user?.role === UserRole.TEAM_LEADER && (
                                            <motion.div
                                                className="absolute -top-1 -left-1 w-3 h-3"
                                                animate={{
                                                    scale: [0.8, 1.2, 0.8]
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 2,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                <Zap
                                                    className="w-3 h-3 text-emerald-300 dark:text-emerald-400 fill-emerald-300 dark:fill-emerald-400"/>
                                            </motion.div>
                                        )}
                                    </div>

                                    {!isCollapsed && (
                                        <motion.div
                                            initial={isFirstLoad ? {opacity: 0, x: -10} : {opacity: 1, x: 0}}
                                            animate={{opacity: 1, x: 0}}
                                            className="flex flex-col z-10"
                                        >
                                            <div className="flex items-center space-x-2">
                <span className={`font-medium ${roleConfig.nameColor}`}>
                    {user?.full_name}
                </span>
                                                {roleConfig.hasSpecialEffects && (
                                                    <motion.div
                                                        animate={{
                                                            rotate: [0, 360],
                                                        }}
                                                        transition={{
                                                            repeat: Infinity,
                                                            duration: 10,
                                                            ease: "linear"
                                                        }}
                                                    >
                                                        <roleConfig.icon className={`w-4 h-4 ${roleConfig.iconColor}`}/>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <span
                                                className={`text-sm ${getRoleConfig(user?.role).roleColor} capitalize font-medium`}>
                {getRoleConfig(user?.role).roleLabel}
            </span>
                                        </motion.div>
                                    )}
                                </motion.div>
                                :
                                <UserCardSkeleton isCollapsed={isCollapsed}/>
                        }
                    </div>
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
                        className={`flex items-center space-x-3 p-3 rounded-lg w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200`}
                    >
                        <LogOut size={20}/>
                        {!isCollapsed && <span>Logout</span>}
                    </motion.button>
                </div>
            </>
        );
    }


    return (
        <motion.div
            id="sidebar"
            // variants={sidebarVariants}
            initial={false} // Disable initial animation after first render
            animate={'expanded'}
            transition={{type: 'spring', damping: 20}}
            className="sticky w-full top-0 h-screen bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-800 shadow-sm flex flex-col"
        >
            {renderSidebarContent()}
        </motion.div>
    );
}

const UserCardSkeleton = ({isCollapsed = false}) => {
    return (
        <div
            className="flex px-4 py-3 bg-gradient-to-r from-gray-600/70 via-gray-700/70 to-gray-800/70 rounded-xl items-center space-x-3 relative overflow-hidden animate-pulse">
            {/* Avatar skeleton */}
            <div className="relative">
                <div className="w-12 h-12 bg-gray-500/60 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="w-6 h-6 bg-gray-400/60 rounded"></div>
                </div>

                {/* Status indicator skeleton */}
                <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-400/60 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>

            {/* Text content skeleton */}
            {!isCollapsed && (
                <div className="flex flex-col space-y-2 flex-1">
                    {/* Name skeleton */}
                    <div className="h-4 bg-gray-400/60 rounded w-24"></div>

                    {/* Role skeleton */}
                    <div className="h-3 bg-gray-500/60 rounded w-16"></div>
                </div>
            )}

            {/* Shimmer effect */}
            <div
                className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
    );
};