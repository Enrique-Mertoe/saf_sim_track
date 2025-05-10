"use client"
import {useState, useEffect} from 'react';
import {ArrowLeft, Search, Home, MapPin} from 'lucide-react';

export default function NotFound() {
    const [searchValue, setSearchValue] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [mapPoints, setMapPoints] = useState([]);
    const [blinkingDot, setBlinkingDot] = useState({x: 50, y: 50});

    // Generate random map points
    useEffect(() => {
        const points = [];
        for (let i = 0; i < 20; i++) {
            points.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 0.6 + 0.2,
                color: Math.random() > 0.7 ? '#4CAF50' : '#E0E0E0'
            });
        }
        setMapPoints(points);
    }, []);

    // Animate the main blinking dot
    useEffect(() => {
        const interval = setInterval(() => {
            setBlinkingDot(prev => ({
                x: prev.x + (Math.random() - 0.5) * 2,
                y: prev.y + (Math.random() - 0.5) * 2
            }));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleSearchSubmit = () => {
        if (!searchValue.trim()) {
            setErrorMessage('Please enter a search term');
            return;
        }

        // Simulate search functionality
        setErrorMessage('');
        window.location.href = `/search?q=${encodeURIComponent(searchValue)}`;
    };

    return (
        <div className="relative page-404 h-screen w-full overflow-hidden bg-slate-50 text-slate-800">
            {/* Top Green Banner */}
            <div
                className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-green-600 to-green-700 shadow-md z-10">
                <div className="container mx-auto px-4 h-full flex items-center">
                    <div className="flex items-center">
                        {/* Safaricom Logo */}
                        <svg width="120" height="20" viewBox="0 0 240 40" className="mr-2">
                            <circle cx="30" cy="20" r="15" fill="#ffffff"/>
                            <text x="55" y="25" fontFamily="Arial" fontSize="16" fontWeight="bold"
                                  fill="white">Safaricom
                            </text>
                        </svg>
                        <span className="text-white text-lg font-semibold ml-2">| SIM Tracker</span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col md:flex-row h-full pt-16">
                {/* Left Content */}
                <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
                    <div className="max-w-md">
                        <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800 mb-2">
                            404
                        </h1>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-slate-700">
                            Page Not Found
                        </h2>
                        <p className="text-slate-600 mb-8">
                            We couldn't locate the page you're looking for. It might have been moved, deleted, or
                            perhaps never existed.
                        </p>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md"
                            >
                                <ArrowLeft size={18}/> Go Back
                            </button>

                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-green-700 border border-green-600 rounded-lg hover:bg-slate-200 transition-all duration-300 shadow-sm"
                            >
                                <Home size={18}/> Dashboard
                            </button>

                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all duration-300 shadow-md"
                            >
                                <Search size={18}/> Search
                            </button>
                        </div>

                        {/* Search input */}
                        {showSearch && (
                            <div className="w-full animate-fade-in">
                                <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
                                    <div
                                        className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                                        <input
                                            type="text"
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            placeholder="What are you looking for?"
                                            className="flex-grow px-4 py-2 bg-transparent text-slate-800 outline-none"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearchSubmit();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleSearchSubmit}
                                            className="bg-green-600 text-white p-2 hover:bg-green-700"
                                        >
                                            <Search size={20}/>
                                        </button>
                                    </div>
                                    {errorMessage && (
                                        <p className="text-red-500 mt-2 text-sm">{errorMessage}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick links */}
                        <div className="mt-8">
                            <h3 className="text-slate-700 font-medium mb-3">Quick Links</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <a
                                    href="/dashboard"
                                    className="text-green-700 hover:text-green-800 flex items-center"
                                >
                                    <span className="w-1 h-1 bg-green-700 rounded-full mr-2"></span>
                                    Dashboard
                                </a>
                                <a
                                    href="/sim/register"
                                    className="text-green-700 hover:text-green-800 flex items-center"
                                >
                                    <span className="w-1 h-1 bg-green-700 rounded-full mr-2"></span>
                                    Register SIM
                                </a>
                                <a
                                    href="/reports"
                                    className="text-green-700 hover:text-green-800 flex items-center"
                                >
                                    <span className="w-1 h-1 bg-green-700 rounded-full mr-2"></span>
                                    Reports
                                </a>
                                <a
                                    href="/team/management"
                                    className="text-green-700 hover:text-green-800 flex items-center"
                                >
                                    <span className="w-1 h-1 bg-green-700 rounded-full mr-2"></span>
                                    Team Management
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content - Map Visualization */}
                <div className="hidden md:flex w-1/2 bg-slate-100 relative overflow-hidden border-l border-slate-200">
                    {/* Map-like background */}
                    <div className="absolute inset-0">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Map grid lines */}
                            {[...Array(10)].map((_, i) => (
                                <line
                                    key={`h-${i}`}
                                    x1="0"
                                    y1={i * 10}
                                    x2="100"
                                    y2={i * 10}
                                    stroke="#E5E7EB"
                                    strokeWidth="0.2"
                                />
                            ))}
                            {[...Array(10)].map((_, i) => (
                                <line
                                    key={`v-${i}`}
                                    x1={i * 10}
                                    y1="0"
                                    x2={i * 10}
                                    y2="100"
                                    stroke="#E5E7EB"
                                    strokeWidth="0.2"
                                />
                            ))}

                            {/* Random map points */}
                            {mapPoints.map(point => (
                                <circle
                                    key={point.id}
                                    cx={point.x}
                                    cy={point.y}
                                    r={point.size}
                                    fill={point.color}
                                />
                            ))}

                            {/* Connection lines */}
                            {mapPoints
                                .filter(point => point.color === '#4CAF50')
                                .map(point => (
                                    <line
                                        key={`line-${point.id}`}
                                        x1={point.x}
                                        y1={point.y}
                                        x2={blinkingDot.x}
                                        y2={blinkingDot.y}
                                        stroke="#4CAF50"
                                        strokeWidth="0.2"
                                        strokeDasharray="1,1"
                                    />
                                ))
                            }

                            {/* Main blinking dot */}
                            <circle
                                cx={blinkingDot.x}
                                cy={blinkingDot.y}
                                r="1.5"
                                fill="#4CAF50"
                                className="animate-ping-slow"
                            />
                            <circle
                                cx={blinkingDot.x}
                                cy={blinkingDot.y}
                                r="0.8"
                                fill="#4CAF50"
                            />
                        </svg>

                        {/* Question mark overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <svg width="60%" height="60%" viewBox="0 0 100 100">
                                <path
                                    d="M50,10 C27.9,10 10,27.9 10,50 C10,72.1 27.9,90 50,90 C72.1,90 90,72.1 90,50 C90,27.9 72.1,10 50,10 Z M50,78 C46.7,78 44,75.3 44,72 C44,68.7 46.7,66 50,66 C53.3,66 56,68.7 56,72 C56,75.3 53.3,78 50,78 Z M59,52.7 C56.5,54.3 55,56.7 55,60 L45,60 C45,53.3 48.5,48.7 53,45.7 C55.5,44 57,41.7 57,38.3 C57,33.7 53.7,30 50,30 C46.3,30 43,33.7 43,38.3 L33,38.3 C33,28.2 40.5,20 50,20 C59.5,20 67,28.2 67,38.3 C67,44.7 64,50 59,52.7 Z"
                                    fill="#4CAF50"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Location pin with pulsing effect */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                            <div
                                className="absolute -top-10 -left-20 bg-white px-4 py-2 rounded-lg shadow-lg z-20 w-40 text-center">
                                <p className="text-red-500 font-semibold">Location Not Found</p>
                            </div>
                            <MapPin size={40} className="text-red-500 drop-shadow-md"/>
                            <div
                                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-800 text-white py-3 px-4 text-center text-sm">
                <p>© {new Date().getFullYear()} Safaricom SIM Tracking System | <a href="/help"
                                                                                   className="text-green-400 hover:text-green-300">Help
                    Center</a></p>
            </div>
        </div>
    );
}