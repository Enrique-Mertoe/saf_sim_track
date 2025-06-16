import React, {useState} from 'react';
import {Bell, Camera, Heart, Home, Map, MessageCircle, Search, Settings, ShoppingCart, User} from 'lucide-react';

const NavigationTabs = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [theme, setTheme] = useState('default');
    const [animationStyle, setAnimationStyle] = useState('bounce');
    const [showBadges, setShowBadges] = useState(true);
    const [tabStyle, setTabStyle] = useState('modern');

    // Mock data for counters
    const tabData = {
        home: { icon: Home, label: 'Home', count: 0, badge: null },
        discover: { icon: Search, label: 'Discover', count: 12, badge: 'new' },
        messages: { icon: MessageCircle, label: 'Messages', count: 3, badge: null },
        notifications: { icon: Bell, label: 'Alerts', count: 7, badge: 'hot' },
        cart: { icon: ShoppingCart, label: 'Cart', count: 2, badge: null },
        favorites: { icon: Heart, label: 'Favorites', count: 15, badge: null },
        profile: { icon: User, label: 'Profile', count: 0, badge: 'pro' },
        camera: { icon: Camera, label: 'Camera', count: 0, badge: null },
        map: { icon: Map, label: 'Map', count: 0, badge: null },
        settings: { icon: Settings, label: 'Settings', count: 1, badge: null }
    };

    const themes = {
        default: {
            bg: 'bg-white',
            border: 'border-gray-200',
            active: 'text-blue-600 bg-blue-50',
            inactive: 'text-gray-600 hover:text-gray-800',
            shadow: 'shadow-lg'
        },
        dark: {
            bg: 'bg-gray-900',
            border: 'border-gray-700',
            active: 'text-purple-400 bg-purple-900/30',
            inactive: 'text-gray-400 hover:text-gray-200',
            shadow: 'shadow-2xl shadow-purple-500/10'
        },
        vibrant: {
            bg: 'bg-gradient-to-r from-pink-500 to-violet-600',
            border: 'border-transparent',
            active: 'text-white bg-white/20 backdrop-blur-sm',
            inactive: 'text-white/70 hover:text-white',
            shadow: 'shadow-xl shadow-pink-500/25'
        },
        minimal: {
            bg: 'bg-gray-50',
            border: 'border-transparent',
            active: 'text-gray-900 bg-white',
            inactive: 'text-gray-500 hover:text-gray-700',
            shadow: 'shadow-sm'
        },
        neon: {
            bg: 'bg-black',
            border: 'border-cyan-500/30',
            active: 'text-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/25',
            inactive: 'text-gray-400 hover:text-cyan-300',
            shadow: 'shadow-2xl shadow-cyan-500/10'
        }
    };

    const animations = {
        bounce: 'transition-all duration-300 hover:scale-110 active:scale-95',
        slide: 'transition-all duration-300 hover:translate-y-1',
        fade: 'transition-all duration-300 hover:opacity-80',
        glow: 'transition-all duration-300 hover:shadow-lg',
        pulse: 'transition-all duration-300 hover:animate-pulse',
        rotate: 'transition-all duration-300 hover:rotate-12'
    };

    const selectedTabs = ['home', 'discover', 'messages', 'notifications', 'profile'];

    const renderBadge = (count, badgeType) => {
        if (!showBadges) return null;

        if (count > 0) {
            return (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 animate-pulse">
                {count > 99 ? '99+' : count}
            </div>
        );
        }

        if (badgeType) {
            const badgeColors = {
                new: 'bg-green-500',
                hot: 'bg-red-500',
                pro: 'bg-yellow-500'
            };

            return (
                <div className={`absolute -top-1 -right-1 ${badgeColors[badgeType]} text-white text-xs rounded-full w-3 h-3 animate-ping`}>
            </div>
        );
        }

        return null;
    };

    const renderTab = (tabKey, data) => {
        const { icon: Icon, label, count, badge } = data;
        const isActive = activeTab === tabKey;
        const currentTheme = themes[theme];

        return (
            <button
                key={tabKey}
        onClick={() => setActiveTab(tabKey)}
        className={`
          relative flex flex-col items-center justify-center flex-1 h-full px-2 py-2 rounded-lg
          ${isActive ? currentTheme.active : currentTheme.inactive}
          ${animations[animationStyle]}
          ${tabStyle === 'pills' ? 'mx-1' : ''}
        `}
    >
        <div className="relative">
        <Icon className={`h-6 w-6 ${isActive && animationStyle === 'bounce' ? 'animate-bounce' : ''}`} />
        {renderBadge(count, badge)}
        </div>
        <span className={`text-xs mt-1 font-medium ${tabStyle === 'compact' ? 'hidden' : ''}`}>
        {label}
        </span>

        {/* Active indicator */}
        {isActive && tabStyle === 'modern' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full animate-pulse"></div>
        )}
        </button>
    );
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
            {/* Controls */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
    <h3 className="text-lg font-semibold">Customization Controls</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div>
        <label className="block text-sm font-medium mb-2">Theme</label>
        <select
    value={theme}
    onChange={(e) => setTheme(e.target.value)}
    className="w-full p-2 border rounded-md"
    >
    <option value="default">Default</option>
        <option value="dark">Dark</option>
        <option value="vibrant">Vibrant</option>
        <option value="minimal">Minimal</option>
        <option value="neon">Neon</option>
    </select>
    </div>

    <div>
    <label className="block text-sm font-medium mb-2">Animation</label>
        <select
    value={animationStyle}
    onChange={(e) => setAnimationStyle(e.target.value)}
    className="w-full p-2 border rounded-md"
    >
    <option value="bounce">Bounce</option>
        <option value="slide">Slide</option>
        <option value="fade">Fade</option>
        <option value="glow">Glow</option>
        <option value="pulse">Pulse</option>
        <option value="rotate">Rotate</option>
    </select>
    </div>

    <div>
    <label className="block text-sm font-medium mb-2">Style</label>
        <select
    value={tabStyle}
    onChange={(e) => setTabStyle(e.target.value)}
    className="w-full p-2 border rounded-md"
    >
    <option value="modern">Modern</option>
        <option value="pills">Pills</option>
        <option value="compact">Compact</option>
    </select>
    </div>

    <div>
    <label className="block text-sm font-medium mb-2">Options</label>
        <label className="flex items-center">
    <input
        type="checkbox"
    checked={showBadges}
    onChange={(e) => setShowBadges(e.target.checked)}
    className="mr-2"
        />
        Show Badges
    </label>
    </div>
    </div>
    </div>

    {/* Navigation Component */}
    <div className={`
        ${themes[theme].bg} ${themes[theme].border} ${themes[theme].shadow}
        border rounded-2xl overflow-hidden
      `}>
    <div className="flex justify-around items-center h-20 px-2">
        {selectedTabs.map(tabKey => renderTab(tabKey, tabData[tabKey]))}
        </div>
        </div>

    {/* Content Area */}
    <div className={`
        p-8 rounded-lg text-center
        ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}
        ${themes[theme].shadow}
      `}>
    <div className="space-y-4">
    <div className="text-4xl">
        {React.createElement(tabData[activeTab].icon, { className: "h-16 w-16 mx-auto opacity-50" })}
        </div>
        <h2 className="text-2xl font-bold">
        {tabData[activeTab].label}
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
        You're currently viewing the {tabData[activeTab].label.toLowerCase()} section.
    This component demonstrates various states, animations, and styling options.
    </p>
    {tabData[activeTab].count > 0 && (
        <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {tabData[activeTab].count} items
    </div>
    )}
    </div>
    </div>

    {/* Code Example */}
    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
    <div className="mb-2 text-green-400">// Usage Example:</div>
        <pre>{`<NavigationTabs
  activeTab="${activeTab}"
  onTabChange={setActiveTab}
  theme="${theme}"
  animationStyle="${animationStyle}"
  showBadges={${showBadges}}
  tabStyle="${tabStyle}"
/>`}</pre>
    </div>
    </div>
);
};

export default NavigationTabs;