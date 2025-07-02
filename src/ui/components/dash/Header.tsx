"use client"

import {ArrowLeft, Bell, ChevronDown, LogOut, Menu, Search, Settings, User, X} from "lucide-react";
import useApp from "@/ui/provider/AppProvider";
import {useEffect, useRef, useState} from "react";
import Signal from "@/lib/Signal";
import {AnimatePresence, motion} from "framer-motion";
import Sidebar from "@/ui/components/dash/Sidebar";
import {createSupabaseClient} from "@/lib/supabase/client";
import {useTheme} from "next-themes";
import {notificationService} from "@/services";
import Image from "next/image";
import favicon from "@/app/favicon.ico"
import Fixed from "@/ui/components/Fixed";
import {admin_id} from "@/services/helper";
import {showModal} from "@/ui/shortcuts";
import SearchResult from "@/ui/components/search/SearchResult";
import AIIconButton from "@/ui/components/dash/AiButton";

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

    const [isSearching, sIs] = useState(false);

    useEffect(() => {
        async function performSearch() {
            if (!user || searchQuery.trim() === "") {
                setSearchResults([]);
                return;
            }

            setSearchResults([]);
            sIs(true);

            setTimeout(async () => {
                try {
                    let count = 3;
                    // First search for SIM cards in the database
                    supabase
                        .from('sim_cards')
                        .select('id, serial_number')
                        .eq('admin_id', await admin_id(user))
                        .or(`serial_number.ilike.%${searchQuery}%,batch_id.ilike.%${searchQuery}%,mobigo.ilike.%${searchQuery}%,lot.ilike.%${searchQuery}%`)
                        .not('serial_number', 'is', null)
                        .not('batch_id', 'is', null)
                        .limit(5)
                        .then(({data: simData}) => {
                            const data = (simData ?? []).map(sim => ({
                                id: sim.id,
                                title: `SIM #${sim.serial_number.slice(-5)}`,
                                fullTitle: sim.serial_number,
                                category: 'SIM',
                                url: `/sim/${sim.id}`
                            }));
                            count -= 1;
                            sIs(count > 0);
                            setSearchResults((prev: any) => [...prev, ...data])
                        });

                    // Search for teams
                    supabase
                        .from('teams')
                        .select('id, name')
                        .eq('admin_id', await admin_id(user))
                        .ilike('name', `%${searchQuery}%`)
                        .limit(5).then(({data: teamData}) => {
                        setSearchResults((prev: any) => [...prev, ...(
                            (teamData ?? []).map(team => ({
                                id: team.id,
                                title: team.name,
                                category: 'Team',
                                url: `/teams/${team.id}`
                            }))
                        )])
                        count -= 1;
                        sIs(count > 0);

                    })
                    supabase
                        .from('users')
                        .select('id, full_name')
                        .eq('admin_id', await admin_id(user))
                        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
                        .not('full_name', 'is', null)
                        .not('email', 'is', null)
                        .not('username', 'is', null)
                        .limit(5).then(({data: teamData}) => {
                        setSearchResults((prev: any) => [...prev, ...(
                            (teamData ?? []).map(team => ({
                                id: team.id,
                                title: team.full_name,
                                category: 'User',
                                url: `/teams/${team.id}`
                            }))
                        )])
                        count -= 1;
                        sIs(count > 0);
                    })

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
                    const allResults = [...matchingNavItems];
                    let Interval: NodeJS.Timeout | null = null;
                    (new Promise<any[]>(resolve => {
                        Interval = setInterval(() => {
                            if (count == 0) {
                                resolve([searchResults.length == 0 ? {
                                    id: 'assistant',
                                    title: `Ask assistant about "${searchQuery}"`,
                                    category: 'Assistant',
                                    url: `/assistant?query=${encodeURIComponent(searchQuery)}`
                                } : {}]);
                                if (Interval)
                                    clearInterval(Interval);
                                sIs(false);
                            }
                        }, 300)
                    })).then(res => {
                        setSearchResults((prev: any) => [...prev, ...(
                            (res ?? []).map(item => ({
                                id: item.id,
                                title: item.title,
                                category: item.category,
                                url: item.url
                            }))
                        )])
                    });

                    setSearchResults((prev: any) => [...prev, ...allResults]);
                } catch (error) {
                    console.error("Search error:", error);
                    setSearchResults([]);
                }
            }, 50)
        }

        // Use a debounce timer for better performance
        const timer = setTimeout(() => {
            performSearch().then();
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


    // Mobile fullscreen overlay component
    const MobileFullscreenOverlay = ({isOpen, onClose, title, children}: any) => (
        <AnimatePresence>
            {isOpen && (
                <Fixed>
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{y: "100%"}}
                        animate={{y: 0}}
                        exit={{y: "100%"}}
                        transition={{type: "tween", duration: 0.3}}
                        className="fixed inset-x-0 bottom-0 top-16 bg-white dark:bg-gray-800 z-50 md:hidden overflow-hidden rounded-t-2xl"
                    >
                        <div className="h-full flex flex-col">
                            <div
                                className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <X size={20}/>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </Fixed>
            )}
        </AnimatePresence>
    );

    const processSearch = (results: any) => {
        if (results.category !== 'Page') {
            showModal({
                content: onClose => <SearchResult onClose={onClose} result={results}/>
            })
        }
    }

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
                            <Image src={favicon} alt={"Logo"}
                                   width={34} height={34}
                            />
                            <span className="text-gray-800  ms-2 dark:text-white">SSM</span>
                        </motion.div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user && (
                            <>
                                <AIIconButton/>
                                {/* Enhanced Search - Desktop Card Style */}
                                <div ref={searchRef}
                                     className={`relative bg-gray-100 dark:bg-gray-700 transition-all duration-200 rounded-full justify-center items-center flex ${isSearchOpen ? 'rounded-md' : 'rounded-full'}`}>
                                    <AnimatePresence>

                                        <div className={`order-last transition-all duration-200 ${
                                            isSearchOpen && 'hidden'
                                        }`}>
                                            <motion.button
                                                key="search-icon"
                                                initial={{scale: 1}}
                                                whileHover={{scale: 1.05}}
                                                whileTap={{scale: 0.95}}
                                                onClick={() => setIsSearchOpen(true)}
                                                className={`p-2 rounded-full text-gray-800 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-700 transition-all duration-200`}
                                                aria-label="Search"
                                            >
                                                <Search size={20}/>
                                            </motion.button>
                                        </div>

                                        {
                                            isSearchOpen && (
                                                <>
                                                    <div
                                                        className="fixed md:relative   bottom-0 md:h-auto -screen left-0 right-0 top-0 z-50">
                                                        <div className="flex h-full overflow-hidden flex-col">
                                                            <motion.div
                                                                initial={{
                                                                    width: 0
                                                                }}
                                                                animate={{
                                                                    width: '500px',
                                                                    boxShadow: 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;'
                                                                }}
                                                                key="search-card"
                                                                className="right-0 w-full md:w-[500px] md:roundded-lg md:shdadow-sm bg-white mx-auto dark:bg-gray-800"
                                                            >
                                                                {/* Card Header - Search Input */}
                                                                <div
                                                                    className="bg-swhite z-1 p-1 md:p-0 relative rounded-t-md  md:bg-gray-100 dark:from-green-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                                                                    <motion.div
                                                                        initial={{
                                                                            x: 50, opacity: 0,
                                                                            width: 0
                                                                        }}
                                                                        animate={{
                                                                            x: 0, opacity: 1,
                                                                            width: 'initial'
                                                                        }}
                                                                        transition={{duration: 0.2}}
                                                                        className="relative px-2 max-sm:bg-gray-100 max-sm:rounded-full  focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center">
                                                                        <button
                                                                            onClick={() => {
                                                                                setIsSearchOpen(false);
                                                                                setSearchQuery("");
                                                                            }}
                                                                            className="cursor-pointer p-2 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                                                        >
                                                                            <ArrowLeft size={24}/>
                                                                        </button>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Search SIMs, teams, pages..."
                                                                            className="outline-0 py-4 flex-grow text-sm text-gray-700  transition-all duration-200"
                                                                            value={searchQuery}
                                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                                            autoFocus
                                                                        />

                                                                        {isSearching && (
                                                                            <motion.button
                                                                                initial={{
                                                                                    x: 10, opacity: 0,
                                                                                }}
                                                                                transition={{
                                                                                    duration: 0.15,
                                                                                    ease: "easeInOut"
                                                                                }}
                                                                                animate={{x: 0, opacity: 1}}
                                                                                exit={{x: 0, opacity: 0}}
                                                                                className="p-2 rounded-full cursor-pointer  text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                                                            >
                                                                                <div role="status">
                                                                                    <svg aria-hidden="true"
                                                                                         className="inline w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-green-500"
                                                                                         viewBox="0 0 100 101"
                                                                                         fill="none"
                                                                                         xmlns="http://www.w3.org/2000/svg">
                                                                                        <path
                                                                                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                                                                            fill="currentColor"/>
                                                                                        <path
                                                                                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                                                                            fill="currentFill"/>
                                                                                    </svg>
                                                                                </div>
                                                                            </motion.button>
                                                                        )
                                                                        }
                                                                        {
                                                                            searchQuery && (
                                                                                <motion.button
                                                                                    initial={{
                                                                                        x: 10, opacity: 0,
                                                                                    }}
                                                                                    transition={{
                                                                                        duration: 0.15,
                                                                                        ease: "easeInOut"
                                                                                    }}
                                                                                    animate={{x: 0, opacity: 1}}
                                                                                    exit={{x: 0, opacity: 0}}
                                                                                    title={"Clear"}
                                                                                    onClick={() => {
                                                                                        setSearchQuery("");
                                                                                    }}
                                                                                    className="p-2 rounded-full cursor-pointer  text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                                                                >
                                                                                    <X size={24}/>
                                                                                </motion.button>
                                                                            )
                                                                        }
                                                                    </motion.div>
                                                                </div>
                                                            </motion.div>
                                                            <motion.div
                                                                initial={{
                                                                    y: 50, opacity: 0
                                                                }}
                                                                animate={{
                                                                    y: 0, opacity: 1
                                                                }}
                                                                transition={{delay: .15}}
                                                                className={"flex-1 md:absolute z-0 left-0 right-0 shadow-smv dark:bg-gray-800 md:rounded-md  md:pt-15 top-0"}>
                                                                {/* Card Body - Search Results */}
                                                                <div
                                                                    className=" min-h-full rounded-inherit  overflow-y-auto  bg-white md:min-h-[500px] md:max-h-[70vh]  ">
                                                                    {searchResults.length > 0 ? (
                                                                        <div className=" h-full w-full">
                                                                            {searchResults.map((result: any, index: number) => (
                                                                                <motion.button
                                                                                    key={result.id}
                                                                                    initial={{opacity: 0, y: 10}}
                                                                                    animate={{opacity: 1, y: 0}}
                                                                                    transition={{delay: index * 0.05}}
                                                                                    className="px-4 py-3 w-full  cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700  flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors duration-200"
                                                                                    onClick={() => {
                                                                                        setIsSearchOpen(false);
                                                                                        processSearch(result)
                                                                                    }}
                                                                                >
                                                                                    <div className="">
                                                                        <span
                                                                            className="text-gray-800 dark:text-gray-200 font-medium">
                                                                            {result.title}
                                                                        </span>
                                                                                        {result.fullTitle && (
                                                                                            <span
                                                                                                className="text-xs ml-2 text-gray-500 dark:text-gray-400">
                                                                                ({result.fullTitle})
                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <span
                                                                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                                                            result.category === 'SIM' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                                                                                result.category === 'Team' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                                                                                                    result.category === 'Assistant' ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200' :
                                                                                                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                                                        }`}>
                                                                        {result.category}
                                                                    </span>
                                                                                </motion.button>
                                                                            ))}
                                                                        </div>
                                                                    ) : searchQuery ? (
                                                                        <div
                                                                            className="p-6 text-center text-gray-500 dark:text-gray-400">
                                                                            <Search size={32}
                                                                                    className="mx-auto mb-2 opacity-50"/>
                                                                            <p>No results found for "{searchQuery}"</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div
                                                                            className="p-6 text-center text-gray-500 dark:text-gray-400">
                                                                            <Search size={32}
                                                                                    className="mx-auto mb-2 opacity-50"/>
                                                                            <p>Start typing to search...</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </div>
                                                    </div>

                                                </>
                                            )
                                        }

                                    </AnimatePresence>
                                </div>

                                {/* Notifications - Desktop Dropdown / Mobile Fullscreen */}
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

                                    {/* Desktop Notifications Dropdown */}
                                    <AnimatePresence>
                                        {isNotificationOpen && (
                                            <motion.div
                                                initial={{opacity: 0, y: -10}}
                                                animate={{opacity: 1, y: 0}}
                                                exit={{opacity: 0, y: -10}}
                                                transition={{duration: 0.2}}
                                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200 dark:border-gray-700 hidden md:block"
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

                                    {/* Mobile Notifications Fullscreen */}
                                    <MobileFullscreenOverlay
                                        isOpen={isNotificationOpen}
                                        onClose={() => setIsNotificationOpen(false)}
                                        title="Notifications"
                                    >
                                        {unreadCount > 0 && (
                                            <div
                                                className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
                                                <button
                                                    onClick={markAllRead}
                                                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium"
                                                >
                                                    Mark all as read ({unreadCount})
                                                </button>
                                            </div>
                                        )}

                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {isLoading ? (
                                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                    <Bell size={32} className="mx-auto mb-4 opacity-50"/>
                                                    Loading notifications...
                                                </div>
                                            ) : error ? (
                                                <div className="p-8 text-center text-red-500">
                                                    <X size={32} className="mx-auto mb-4"/>
                                                    Error loading notifications
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                notifications.map((notification: any) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                                                            !notification.read ? 'bg-green-50 dark:bg-green-900/20' : ''
                                                        }`}
                                                        onClick={() => markNotificationAsRead(notification.id)}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-medium text-gray-800 dark:text-gray-200">{notification.title}</h4>
                                                            <span
                                                                className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                                {formatNotificationTime(notification.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                    <Bell size={32} className="mx-auto mb-4 opacity-50"/>
                                                    No notifications yet
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 mt-auto">
                                            <a
                                                href="/notifications"
                                                className="block text-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium"
                                            >
                                                View all notifications
                                            </a>
                                        </div>
                                    </MobileFullscreenOverlay>
                                </div>

                                {/* User Profile - Desktop Dropdown / Mobile Fullscreen */}
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

                                {/* Mobile Profile Button */}
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="md:hidden p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-700 transition-colors duration-200"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white font-bold">
                                        {user?.full_name ? user.full_name.charAt(0) : "U"}
                                    </div>
                                </button>

                                {/* Mobile Profile Fullscreen */}
                                <MobileFullscreenOverlay
                                    isOpen={isProfileOpen}
                                    onClose={() => setIsProfileOpen(false)}
                                    title="Profile"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center space-x-4 mb-6">
                                            <div
                                                className="w-16 h-16 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white font-bold text-2xl">
                                                {user?.full_name ? user.full_name.charAt(0) : "U"}
                                            </div>
                                            <div>
                                                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                                                    {user?.full_name || "User"}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {user?.email || "user@example.com"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <a href="/profile"
                                               className="flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                            >
                                                <User size={20} className="mr-3 text-gray-500 dark:text-gray-400"/>
                                                Profile Settings
                                            </a>
                                            <a href="/settings"
                                               className="flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                            >
                                                <Settings size={20} className="mr-3 text-gray-500 dark:text-gray-400"/>
                                                App Settings
                                            </a>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <a href="/accounts/logout"
                                               onClick={e => {
                                                   e.preventDefault();
                                                   signOut()
                                               }}
                                               className="flex items-center p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                                            >
                                                <LogOut size={20} className="mr-3"/>
                                                Sign out
                                            </a>
                                        </div>
                                    </div>
                                </MobileFullscreenOverlay>
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
                            <Fixed>
                                <motion.div
                                    initial={{x: "-100%"}}
                                    animate={{x: 0}}
                                    exit={{x: "-100%"}}
                                    transition={{type: "tween", duration: 0.3}}
                                    className="fixed left-0 top-0 h-screen min-h-screen w-74 bg-white z-51 md:hidden shadow-xl"
                                >
                                    <Sidebar/>
                                    <button
                                        className="md:hidden p-2 fixed top-5 right-5 rounded-full text-light bg-gray-500 hover:bg-green-500 transition-colors duration-200"
                                        onClick={() => Signal.trigger("mobile-open", false)}
                                    >
                                        {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
                                    </button>
                                </motion.div>
                            </Fixed>
                        </>
                    )}
                </AnimatePresence>
            )}
        </>
    );
}