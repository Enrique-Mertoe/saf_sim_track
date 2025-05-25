"use client"

import {Bell, ChevronDown, CreditCard, LogOut, Menu, Moon, Search, Settings, Sun, User, X} from "lucide-react";
import useApp from "@/ui/provider/AppProvider";
import {useEffect, useRef, useState} from "react";
import Signal from "@/lib/Signal";
import {AnimatePresence, motion} from "framer-motion";
import Sidebar from "@/ui/components/dash/Sidebar";
import {createSupabaseClient} from "@/lib/supabase/client";
import {useTheme} from "next-themes";
import {notificationService} from "@/services";

const supabase = createSupabaseClient();
export default function Header() {
    const {user, signOut} = useApp();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any>([]);
    const [notifications, setNotifications] = useState<any>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const {theme, setTheme} = useTheme();
    const searchRef = useRef(null);
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        let subscription: { unsubscribe: () => void } | null = null;

        async function fetchNotifications() {
            try {
                setIsLoading(true);

                // Use notification service to fetch notifications
                const {data, error} = await notificationService.getUserNotifications(user?.id || '', 10);

                if (error) {
                    throw error;
                }

                // If no data is available, use empty array
                if (!data || data.length === 0) {
                    setNotifications([]);
                } else {
                    setNotifications(data);
                }

                // Subscribe to real-time notifications
                if (user?.id) {
                    subscription = notificationService.subscribeToUserNotifications(
                        user.id,
                        (newNotification) => {
                            // Add the new notification to the list
                            setNotifications((prev: any) => [newNotification, ...prev]);
                        }
                    );
                }
            } catch (err) {
                // @ts-ignore
                setError(err.message);
                console.error("Error fetching notifications:", err);

                // Fallback to empty array
                setNotifications([]);
            } finally {
                setIsLoading(false);
            }
        }

        if (user?.id) {
            fetchNotifications();
        }

        // Clean up subscription when component unmounts or user changes
        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [user?.id]);

    // Handle clicks outside dropdowns
    useEffect(() => {
        function handleClickOutside(event: any) {
            //@ts-ignore
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
            //@ts-ignore
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
            //@ts-ignore
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        Signal.on("mobile-open", function (v) {
            setIsMobileMenuOpen(v);
        });
        return () => {
            // Signal.off("mobile-open");
        };
    }, []);

    useEffect(() => {
        async function performSearch() {
            if (searchQuery.trim() === "") {
                setSearchResults([]);
                return;
            }

            try {
                // First search for SIM cards in the database
                const {data: simData, error: simError} = await supabase
                    .from('sim_cards')
                    .select('id, serial_number')
                    .ilike('serial_number', `%${searchQuery}%`)
                    .limit(5);

                if (simError) throw simError;

                // Format SIM results
                const simResults = simData.map(sim => ({
                    id: sim.id,
                    title: `SIM #${sim.serial_number.slice(-5)}`,
                    fullTitle: sim.serial_number,
                    category: 'SIM',
                    url: `/sim/${sim.id}`
                }));

                // Search for teams
                const {data: teamData, error: teamError} = await supabase
                    .from('teams')
                    .select('id, name')
                    .ilike('name', `%${searchQuery}%`)
                    .limit(3);

                if (teamError) throw teamError;

                // Format team results
                const teamResults = teamData.map(team => ({
                    id: team.id,
                    title: team.name,
                    category: 'Team',
                    url: `/teams/${team.id}`
                }));

                // Include navigation items that match
                const navigationItems = [
                    {id: 'nav1', title: 'Dashboard', category: 'Page', url: '/dashboard'},
                    {id: 'nav2', title: 'SIM Management', category: 'Page', url: '/sim-management'},
                    {id: 'nav3', title: 'Team Performance', category: 'Page', url: '/team-performance'},
                    {id: 'nav4', title: 'Reports', category: 'Page', url: '/reports'},
                    {id: 'nav5', title: 'User Settings', category: 'Page', url: '/settings'},
                ];

                const matchingNavItems = navigationItems
                    .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 3);

                // Combine all results
                const allResults = [...simResults, ...teamResults, ...matchingNavItems];

                // If no database results, check if we need to show AI assistant suggestion
                if (allResults.length === 0) {
                    allResults.push({
                        id: 'assistant',
                        title: `Ask assistant about "${searchQuery}"`,
                        category: 'Assistant',
                        url: `/assistant?query=${encodeURIComponent(searchQuery)}`
                    });
                }

                setSearchResults(allResults);
            } catch (error) {
                console.error("Search error:", error);
                setSearchResults([]);
            }
        }

        // Use a debounce timer for better performance
        const timer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Mark a notification as read
    const markNotificationAsRead = async (notificationId: any) => {
        try {
            // Use notification service to mark as read
            if (user?.id) {
                await notificationService.markAsRead(notificationId);
            }

            // Update local state
            //@ts-ignore
            setNotifications(prev => prev.map(notif =>
                notif.id === notificationId ? {...notif, read: true} : notif
            ));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    // Mark all notifications as read
    const markAllRead = async () => {
        try {
            // Use notification service to mark all as read
            if (user?.id) {
                await notificationService.markAllAsRead(user.id);
            }

            // Update local state
            //@ts-ignore
            setNotifications(prev => prev.map(notif => ({...notif, read: true})));
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };
    const formatNotificationTime = (isoString: any) => {
        const date = new Date(isoString);
        const now = new Date();
        //@ts-ignore
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    };

    // Get unread notification count
    const unreadCount = notifications.filter((n: any) => !n.read).length;

    // Toggle theme
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };
    return (
        <>
            <header
                className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white fixed top-0 end-0 start-0 z-40 border border-b-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <motion.div
                            className="font-bold text-xl flex items-center"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{duration: 0.5}}
                        >
                            <CreditCard className="mr-2 text-green-600 dark:text-green-400" size={24}/>
                            <span className="text-gray-800 dark:text-white">Safaricom SIM Tracker</span>
                        </motion.div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-700 transition-colors duration-200"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun size={20} className="text-amber-300"/>
                            ) : (
                                <Moon size={20} className="text-indigo-600"/>
                            )}
                        </button>
                        {user && (
                            <>                        {/* Search bar */}
                                <div ref={searchRef} className="relative hidden md:block">
                                    <button
                                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-700 transition-colors duration-200"
                                        aria-label="Search"
                                    >
                                        <Search size={20}/>
                                    </button>

                                    <AnimatePresence>
                                        {isSearchOpen && (
                                            <motion.div
                                                initial={{opacity: 0, y: -10}}
                                                animate={{opacity: 1, y: 0}}
                                                exit={{opacity: 0, y: -10}}
                                                transition={{duration: 0.2}}
                                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="p-2">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Search SIMs, teams, pages..."
                                                            className="w-full p-2 pl-8 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <Search size={16}
                                                                className="absolute left-2 top-3 text-gray-400 dark:text-gray-500"/>
                                                        {searchQuery && (
                                                            <button
                                                                onClick={() => setSearchQuery("")}
                                                                className="absolute right-2 top-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                                            >
                                                                <X size={16}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {searchResults.length > 0 ? (
                                                    <div className="max-h-64 overflow-y-auto">
                                                        {searchResults.map((result: any) => (
                                                            <a
                                                                key={result.id}
                                                                href={result.url}
                                                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                            >
                                                        <span className="text-gray-800 dark:text-gray-200">
                                                            {result.title}
                                                            {result.fullTitle && (
                                                                <span className="text-xs ml-2 text-gray-500">
                                                                    ({result.fullTitle})
                                                                </span>
                                                            )}
                                                        </span>
                                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                                    result.category === 'SIM' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                                                        result.category === 'Team' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                                                                            result.category === 'Assistant' ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200' :
                                                                                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                                }`}>
                                                            {result.category}
                                                        </span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : searchQuery ? (
                                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                        No results found for "{searchQuery}"
                                                    </div>
                                                ) : null}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/*// Notifications*/}
                                <div ref={notificationRef} className="relative">
                                    <button
                                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                        className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-700 transition-colors duration-200"
                                        aria-label="Notifications"
                                    >
                                        <Bell size={20}/>
                                        {unreadCount > 0 && (
                                            <motion.span
                                                initial={{scale: 0}}
                                                animate={{scale: 1}}
                                                className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold text-white"
                                            >
                                                {unreadCount}
                                            </motion.span>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isNotificationOpen && (
                                            <motion.div
                                                initial={{opacity: 0, y: -10}}
                                                animate={{opacity: 1, y: 0}}
                                                exit={{opacity: 0, y: -10}}
                                                transition={{duration: 0.2}}
                                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200 dark:border-gray-700"
                                            >
                                                <div
                                                    className="flex justify-between items-center px-4 py-2 bg-green-50 dark:bg-green-900">
                                                    <h3 className="font-semibold text-green-700 dark:text-green-300">Notifications</h3>
                                                    {unreadCount > 0 && (
                                                        <button
                                                            onClick={markAllRead}
                                                            className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                                                        >
                                                            Mark all as read
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="max-h-80 overflow-y-auto">
                                                    {isLoading ? (
                                                        <div
                                                            className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                            Loading notifications...
                                                        </div>
                                                    ) : error ? (
                                                        <div className="p-4 text-center text-red-500">
                                                            Error loading notifications
                                                        </div>
                                                    ) : notifications.length > 0 ? (
                                                        notifications.map((notification: any) => (
                                                            <div
                                                                key={notification.id}
                                                                className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                                                                    !notification.read ? 'bg-green-50 dark:bg-green-900/20' : ''
                                                                }`}
                                                                onClick={() => markNotificationAsRead(notification.id)}
                                                            >
                                                                <div className="flex justify-between">
                                                                    <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">{notification.title}</h4>
                                                                    <span
                                                                        className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatNotificationTime(notification.created_at)}
                                                            </span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div
                                                            className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                            No notifications yet
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700">
                                                    <a
                                                        href="/notifications"
                                                        className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 w-full text-center block"
                                                    >
                                                        View all notifications
                                                    </a>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>


                                {/*User profile dropdown */}

                                <div ref={profileRef} className="relative hidden md:block">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center space-x-2 p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-700 transition-colors duration-200"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white font-bold">
                                            {user?.full_name ? user.full_name.charAt(0) : "U"}
                                        </div>
                                        <span className="max-w-32 truncate text-gray-800 dark:text-gray-200">
                                        {user?.full_name || "User"}
                                    </span>
                                        <ChevronDown size={16}
                                                     className={`transform transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <motion.div
                                                initial={{opacity: 0, y: -10}}
                                                animate={{opacity: 1, y: 0}}
                                                exit={{opacity: 0, y: -10}}
                                                transition={{duration: 0.2}}
                                                className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200 dark:border-gray-700"
                                            >
                                                <div
                                                    className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                        {user?.full_name || "User"}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {user?.email || "user@example.com"}
                                                    </p>
                                                </div>

                                                <div className="py-1">
                                                    <a href="/profile"
                                                       className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <User size={16}
                                                              className="mr-2 text-gray-500 dark:text-gray-400"/>
                                                        Profile
                                                    </a>
                                                    <a href="/settings"
                                                       className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <Settings size={16}
                                                                  className="mr-2 text-gray-500 dark:text-gray-400"/>
                                                        Settings
                                                    </a>
                                                </div>

                                                <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                                                    <a href="/accounts/logout"
                                                       onClick={e => {
                                                           e.preventDefault();
                                                           signOut()
                                                       }}
                                                       className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <LogOut size={16} className="mr-2"/>
                                                        Sign out
                                                    </a>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}

                        {user ? (
                            /* Mobile menu toggle */
                            <motion.div
                                animate={{rotate: isMobileMenuOpen ? 180 : 0}}
                                transition={{duration: 0.3}}
                            >
                                <button
                                    className="md:hidden p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-700 transition-colors duration-200"
                                    onClick={() => Signal.trigger("mobile-open", !isMobileMenuOpen)}
                                    aria-label="Toggle menu"
                                >
                                    {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
                                </button>
                            </motion.div>
                        ) : (
                            <a
                                href="/login"
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors duration-200"
                            >
                                Get Started
                            </a>
                        )}
                    </div>
                </div>

                {/* Mobile search bar - shows below header on smaller screens */}
                <div className="md:hidden px-4 pb-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search SIMs, teams, pages..."
                            className="w-full p-2 pl-8 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search size={16} className="absolute left-2 top-3 text-gray-400 dark:text-gray-500"/>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={16}/>
                            </button>
                        )}
                    </div>

                    {/* Mobile search results */}
                    <AnimatePresence>
                        {searchQuery && searchResults.length > 0 && (
                            <motion.div
                                initial={{opacity: 0, y: -10}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -10}}
                                className="absolute left-4 right-4 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700"
                            >
                                {searchResults.map((result: any) => (
                                    <a
                                        key={result.id}
                                        href={result.url}
                                        className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center last:border-0"
                                    >
                                        <span className="text-gray-800 dark:text-gray-200">{result.title}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            result.category === 'SIM' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                                result.category === 'Team' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                                                    result.category === 'Assistant' ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200' :
                                                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                        }`}>
                                            {result.category}
                                        </span>
                                    </a>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* No results message */}
                    <AnimatePresence>
                        {searchQuery && searchResults.length === 0 && (
                            <motion.div
                                initial={{opacity: 0, y: -10}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -10}}
                                className="absolute left-4 right-4 mt-1 bg-white rounded-lg shadow-lg z-40 p-3 text-center"
                            >
                                <p className="text-gray-500">No results found for "{searchQuery}"</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Mobile Sidebar Menu */}
            {user && (
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 0.5}}
                                exit={{opacity: 0}}
                                className="fixed inset-0 bg-black z-40 md:hidden"
                                onClick={() => {
                                    Signal.trigger("mobile-open", !isMobileMenuOpen)

                                }}
                            />
                            <motion.div
                                initial={{x: "-100%"}}
                                animate={{x: 0}}
                                exit={{x: "-100%"}}
                                transition={{type: "tween", duration: 0.3}}
                                className="fixed left-0 top-0 h-screen w-74 bg-white z-50 md:hidden shadow-xl"
                            >
                                <Sidebar/>
                                <button
                                    className="md:hidden p-2 fixed top-5 right-5 z-[10406757] rounded-full text-light bg-gray-500 hover:bg-green-500 transition-colors duration-200"
                                    onClick={() => Signal.trigger("mobile-open", false)}
                                >
                                    {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            )}
        </>
    );
}
