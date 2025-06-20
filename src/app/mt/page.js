"use client"
import React, {useEffect, useState} from 'react';
import {
    BarChart3,
    Bell,
    Calendar,
    ChevronDown,
    FileText,
    HelpCircle,
    Home,
    LogOut,
    Mail,
    Menu,
    Search,
    Settings,
    Shield,
    User,
    UserCircle,
    Users,
    X
} from 'lucide-react';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleDropdown = (dropdown) => {
        setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
        // Close search when opening dropdowns
        if (activeDropdown !== dropdown) {
            setSearchExpanded(false);
        }
    };

    const closeDropdown = () => {
        setActiveDropdown(null);
    };

    const toggleSearch = () => {
        setSearchExpanded(!searchExpanded);
        // Close other dropdowns when search is opened
        if (!searchExpanded) {
            setActiveDropdown(null);
        }
    };

    const closeSearch = () => {
        setSearchExpanded(false);
    };

    const searchResults = [
        { id: 1, title: 'User Management', type: 'page', description: 'Manage users and permissions' },
        { id: 2, title: 'Analytics Dashboard', type: 'page', description: 'View analytics and reports' },
        { id: 3, title: 'John Doe', type: 'user', description: 'john@example.com' },
        { id: 4, title: 'Revenue Report Q4', type: 'document', description: 'Quarterly revenue analysis' },
        { id: 5, title: 'Team Meeting Notes', type: 'document', description: 'Meeting notes from last week' },
    ];

    const filteredResults = searchQuery.trim()
        ? searchResults.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const sidebarItems = [
        { icon: Home, label: 'Dashboard', active: true },
        { icon: BarChart3, label: 'Analytics' },
        { icon: Users, label: 'Users' },
        { icon: FileText, label: 'Reports' },
        { icon: Calendar, label: 'Calendar' },
        { icon: Mail, label: 'Messages' },
        { icon: Settings, label: 'Settings' },
    ];

    const notificationItems = [
        { id: 1, title: 'New user registered', time: '2 min ago', unread: true },
        { id: 2, title: 'Report generated', time: '1 hour ago', unread: true },
        { id: 3, title: 'System update completed', time: '3 hours ago', unread: false },
    ];

    const userMenuItems = [
        { icon: UserCircle, label: 'Profile' },
        { icon: Settings, label: 'Settings' },
        { icon: Shield, label: 'Privacy' },
        { icon: HelpCircle, label: 'Help' },
        { icon: LogOut, label: 'Sign out' },
    ];

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
                        <span className="text-xl font-semibold text-gray-800">Dashboard</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="mt-6 px-3">
                    {sidebarItems.map((item, index) => (
                        <a
                            key={index}
                            href="#"
                            className={`
                flex items-center space-x-3 px-3 py-3 rounded-lg mb-1 transition-all duration-200
                ${item.active
                                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
              `}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </a>
                    ))}
                </nav>
            </div>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between relative z-30 overflow-hidden">
                    {/* Normal Header Content */}
                    <div className={`
            flex items-center justify-between w-full px-4 lg:px-6 transition-transform duration-300 ease-in-out
            ${searchExpanded ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
          `}>
                        {/* Left side */}
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setSidebarOpen(true);
                                    setSearchExpanded(false);
                                }}
                                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Menu size={20} />
                            </button>

                            {/* Desktop Search - Always visible on larger screens */}
                            <div className="relative hidden lg:block">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80 transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center space-x-3">
                            {/* Search icon for mobile/tablet */}
                            <button
                                onClick={toggleSearch}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Search size={20} />
                            </button>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => toggleDropdown('notifications')}
                                    className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <Bell size={20} />
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    2
                  </span>
                                </button>

                                {/* Notifications Dropdown/Bottom Sheet */}
                                {activeDropdown === 'notifications' && (
                                    <>
                                        {/* Overlay */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={closeDropdown}
                                        ></div>

                                        {/* Desktop Dropdown */}
                                        <div className={`
                      absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50
                      transform transition-all duration-200 ease-out
                      ${isMobile ? 'hidden' : 'opacity-100 scale-100'}
                      origin-top-right
                    `}>
                                            <div className="p-4 border-b border-gray-200">
                                                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {notificationItems.map(item => (
                                                    <div key={item.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-start space-x-3">
                                                            <div className={`w-2 h-2 rounded-full mt-2 ${item.unread ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                                                                <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mobile Bottom Sheet */}
                                        {isMobile && (
                                            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 z-50 transform transition-transform duration-300 ease-out translate-y-0">
                                                <div className="p-4 border-b border-gray-200">
                                                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                                                    <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto">
                                                    {notificationItems.map(item => (
                                                        <div key={item.id} className="p-4 border-b border-gray-100">
                                                            <div className="flex items-start space-x-3">
                                                                <div className={`w-2 h-2 rounded-full mt-2 ${item.unread ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                                                                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Settings */}
                            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <Settings size={20} />
                            </button>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => toggleDropdown('user')}
                                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <User size={16} className="text-white" />
                                    </div>
                                    <ChevronDown size={16} className="text-gray-500" />
                                </button>

                                {/* User Dropdown/Bottom Sheet */}
                                {activeDropdown === 'user' && (
                                    <>
                                        {/* Overlay */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={closeDropdown}
                                        ></div>

                                        {/* Desktop Dropdown */}
                                        <div className={`
                      absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50
                      transform transition-all duration-200 ease-out
                      ${isMobile ? 'hidden' : 'opacity-100 scale-100'}
                      origin-top-right
                    `}>
                                            <div className="p-4 border-b border-gray-200">
                                                <p className="text-sm font-medium text-gray-800">John Doe</p>
                                                <p className="text-xs text-gray-500">john@example.com</p>
                                            </div>
                                            <div className="py-2">
                                                {userMenuItems.map((item, index) => (
                                                    <a
                                                        key={index}
                                                        href="#"
                                                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <item.icon size={16} />
                                                        <span>{item.label}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mobile Bottom Sheet */}
                                        {isMobile && (
                                            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 z-50 transform transition-transform duration-300 ease-out translate-y-0">
                                                <div className="p-4 border-b border-gray-200">
                                                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                            <User size={20} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">John Doe</p>
                                                            <p className="text-xs text-gray-500">john@example.com</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="py-2">
                                                    {userMenuItems.map((item, index) => (
                                                        <a
                                                            key={index}
                                                            href="#"
                                                            className="flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <item.icon size={18} />
                                                            <span>{item.label}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp-style Search Interface */}
                    <div className={`
            absolute inset-0 bg-white flex items-center px-4 lg:px-6 transition-transform duration-300 ease-in-out
            ${searchExpanded ? 'translate-x-0' : 'translate-x-full'}
          `}>
                        <div className="flex items-center space-x-3 w-full">
                            <button
                                onClick={closeSearch}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                            >
                                <X size={20} />
                            </button>

                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search everything..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Search Results */}
                {searchExpanded && (
                    <div className="bg-white shadow-lg border-b border-gray-200 relative z-20">
                        {searchQuery.trim() === '' ? (
                            <div className="p-6 text-center text-gray-500">
                                <Search size={48} className="mx-auto mb-3 text-gray-300" />
                                <p className="text-lg font-medium mb-1">Search Dashboard</p>
                                <p className="text-sm">Find pages, users, documents, and more</p>
                            </div>
                        ) : filteredResults.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto">
                                {filteredResults.map((result) => (
                                    <div
                                        key={result.id}
                                        className="flex items-center space-x-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                    >
                                        <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${result.type === 'user' ? 'bg-purple-100 text-purple-600' :
                                            result.type === 'document' ? 'bg-blue-100 text-blue-600' :
                                                'bg-green-100 text-green-600'}
                    `}>
                                            {result.type === 'user' ? <User size={20} /> :
                                                result.type === 'document' ? <FileText size={20} /> :
                                                    <Home size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{result.description}</p>
                                        </div>
                                        <div className="text-xs text-gray-400 capitalize px-2 py-1 bg-gray-100 rounded">
                                            {result.type}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Search size={24} className="text-gray-400" />
                                </div>
                                <p className="text-lg font-medium mb-1">No results found</p>
                                <p className="text-sm">Try a different search term</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Content Area (placeholder) */}
                <main className={`
          flex-1 overflow-hidden bg-gray-50 p-6 transition-all duration-300
          ${searchExpanded ? 'opacity-50 pointer-events-none' : 'opacity-100'}
        `}>
                    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <h2 className="text-2xl font-semibold mb-2">Dashboard Content</h2>
                            <p>Your main dashboard content goes here</p>
                            <p className="text-sm mt-2 text-gray-400">Try clicking the search icon to see the WhatsApp-style animation!</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;