"use client"

import {
    Bell,
    ChevronDown,
    CreditCard,
    LogOut,
    Menu,
    Search,
    Settings,
    User,
    X
} from "lucide-react";
import useApp from "@/ui/provider/AppProvider";
import {useEffect, useState, useRef} from "react";
import Signal from "@/lib/Signal";
import {motion, AnimatePresence} from "framer-motion";
import Sidebar from "@/ui/components/dash/Sidebar";

export default function Header() {
    const {user, signOut} = useApp();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [notifications, setNotifications] = useState([
        {id: 1, title: "New assignment", message: "You have a new SIM tracking task", time: "2 mins ago", read: false},
        {id: 2, title: "Status update", message: "Task #4872 has been completed", time: "1 hour ago", read: false},
        {id: 3, title: "System update", message: "Tracker system updated to v2.3", time: "5 hours ago", read: false},
    ]);

    const searchRef = useRef(null);
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

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
            Signal.off("mobile-open");
        };
    }, []);

    // Mock search function
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setSearchResults([]);
            return;
        }

        // Mock search results based on query
        const mockData = [
            {id: 1, title: "SIM #82745", category: "Active"},
            {id: 2, title: "SIM #47281", category: "Inactive"},
            {id: 3, title: "SIM #36159", category: "Pending"},
            {id: 4, title: "Dashboard overview", category: "Page"},
            {id: 5, title: "User settings", category: "Page"},
        ];

        const filtered = mockData.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
//@ts-ignore
        setSearchResults(filtered);
    }, [searchQuery]);

    // Mark all notifications as read
    const markAllRead = () => {
        setNotifications(prev => prev.map(notif => ({...notif, read: true})));
    };

    // Get unread notification count
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <header className="bg-green-600 text-white fixed top-0 end-0 start-0 z-40 shadow-lg">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <motion.div
                            className="font-bold text-xl flex items-center"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{duration: 0.5}}
                        >
                            <CreditCard className="mr-2" size={24}/>
                            <span>Safaricom SIM Tracker</span>
                        </motion.div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Search bar */}
                        <div ref={searchRef} className="relative hidden md:block">
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2 rounded-full hover:bg-green-500 transition-colors duration-200"
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
                                        className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl overflow-hidden z-50"
                                    >
                                        <div className="p-2">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search SIMs, tasks..."
                                                    className="w-full p-2 pl-8 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    autoFocus
                                                />
                                                <Search size={16} className="absolute left-2 top-3 text-gray-400"/>
                                                {searchQuery && (
                                                    <button
                                                        onClick={() => setSearchQuery("")}
                                                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X size={16}/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {searchResults.length > 0 ? (
                                            <div className="max-h-64 overflow-y-auto">
                                                {searchResults.map(result => (
                                                    <div
                                                        key={
                                                            //@ts-ignore
                                                            result.id}
                                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                                                    >
                                                        <span className="text-gray-800">{
                                                            //@ts-ignore
                                                            result.title}</span>
                                                        <span
                                                            className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded-full">
                              {
                                  //@ts-ignore
                                  result.category}
                            </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : searchQuery ? (
                                            <div className="p-4 text-center text-gray-500">
                                                No results found for "{searchQuery}"
                                            </div>
                                        ) : null}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notifications */}
                        <div ref={notificationRef} className="relative">
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="relative p-2 rounded-full hover:bg-green-500 transition-colors duration-200"
                            >
                                <Bell size={20}/>
                                {unreadCount > 0 && (
                                    <motion.span
                                        initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
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
                                        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50"
                                    >
                                        <div className="flex justify-between items-center px-4 py-2 bg-green-50">
                                            <h3 className="font-semibold text-green-700">Notifications</h3>
                                            <button
                                                onClick={markAllRead}
                                                className="text-xs text-green-600 hover:text-green-800"
                                            >
                                                Mark all as read
                                            </button>
                                        </div>

                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map(notification => (
                                                    <div
                                                        key={notification.id}
                                                        className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                                                            !notification.read ? 'bg-green-50' : ''
                                                        }`}
                                                    >
                                                        <div className="flex justify-between">
                                                            <h4 className="font-medium text-sm text-gray-800">{notification.title}</h4>
                                                            <span
                                                                className="text-xs text-gray-500">{notification.time}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-gray-500">
                                                    No notifications yet
                                                </div>
                                            )}
                                        </div>

                                        <div className="px-4 py-2 bg-gray-50">
                                            <button
                                                className="text-sm text-green-600 hover:text-green-800 w-full text-center">
                                                View all notifications
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* User profile dropdown */}
                        <div ref={profileRef} className="relative hidden md:block">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-2 p-1 rounded-md hover:bg-green-500 transition-colors duration-200"
                            >
                                <div
                                    className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-white font-bold">
                                    {user?.full_name ? user.full_name.charAt(0) : "U"}
                                </div>
                                <span className="max-w-32 capitalize truncate">{user?.full_name || "User"}</span>
                                <ChevronDown size={16}
                                             className={`transform transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}/>
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: -10}}
                                        transition={{duration: 0.2}}
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl overflow-hidden z-50"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm capitalize font-medium text-gray-700">{user?.full_name || "User"}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</p>
                                        </div>

                                        <div className="py-1">
                                            <a href="/profile"
                                               className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                <User size={16} className="mr-2 text-gray-500"/>
                                                Profile
                                            </a>
                                            <a href="/settings"
                                               className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                <Settings size={16} className="mr-2 text-gray-500"/>
                                                Settings
                                            </a>
                                        </div>

                                        <div className="py-1 border-t border-gray-100">
                                            <a href="/accounts/logout"
                                               onClick={e => {
                                                   e.preventDefault();
                                                   signOut()
                                               }}
                                               className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                                <LogOut size={16} className="mr-2"/>
                                                Sign out
                                            </a>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile menu toggle */}
                        <motion.div
                            animate={{rotate: isMobileMenuOpen ? 180 : 0}}
                            transition={{duration: 0.3}}
                        >
                            <button
                                className="md:hidden p-2 rounded-full hover:bg-green-500 transition-colors duration-200"
                                onClick={() => Signal.trigger("mobile-open", !isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* Mobile search bar - shows below header on smaller screens */}
                <div className="md:hidden px-4 pb-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search SIMs, tasks..."
                            className="w-full p-2 pl-8 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search size={16} className="absolute left-2 top-3 text-gray-400"/>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
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
                                className="absolute left-4 right-4 mt-1 bg-white rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto"
                            >
                                {searchResults.map(result => (
                                    <div
                                        //@ts-ignore
                                        key={result.id}
                                        className="px-4 py-2 border-b border-gray-100 hover:bg-gray-50 flex justify-between"
                                    >
                                        <span className="text-gray-800">{
                                            //@ts-ignore
                                            result.title}</span>
                                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded-full">
                      {
                          //@ts-ignore
                          result.category}
                    </span>
                                    </div>
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
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/*<motion.div*/}
                        {/*    initial={{opacity: 0}}*/}
                        {/*    animate={{opacity: 0.5}}*/}
                        {/*    exit={{opacity: 0}}*/}
                        {/*    className="fixed inset-0 bg-black z-40 md:hidden"*/}
                        {/*    onClick={() => Signal.trigger("mobile-open", false)}*/}
                        {/*/>*/}
                        {/*<motion.div*/}
                        {/*    initial={{x: "-100%"}}*/}
                        {/*    animate={{x: 0}}*/}
                        {/*    exit={{x: "-100%"}}*/}
                        {/*    transition={{type: "tween", duration: 0.3}}*/}
                        {/*    className="fixed left-0 top-0 h-screen w-74 bg-white z-50 md:hidden shadow-xl"*/}
                        {/*>*/}
                        <Sidebar/>
                        {/*</motion.div>*/}
                    </>
                )}
            </AnimatePresence>
        </>
    );
}