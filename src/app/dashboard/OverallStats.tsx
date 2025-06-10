import React from 'react';
import {ArrowUpRightSquare, Smartphone, TrendingUp, WifiOff, Zap} from 'lucide-react';
import simService from "@/services/simService";
import useApp from "@/ui/provider/AppProvider";
import {to2dp} from "@/helper";
import Signal from "@/lib/Signal";
import {useRouter} from "next/navigation";

// Types
interface BreakdownItemProps {
    label: string;
    color: string;
    icon: React.ReactNode;
    dataFetcher: () => Promise<{ value: number; percentage: number }>;
}

interface SimAllocationData {
    total: number;
    active: number;
    inactive: number;
    pending: number;
}

// Loading Skeleton for breakdown items
const BreakdownSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white/20 rounded"></div>
                <div className="h-3 bg-white/20 rounded w-16"></div>
            </div>
            <div className="h-4 bg-white/20 rounded w-8"></div>
        </div>
        <div className="h-1 bg-white/10 rounded mb-1">
            <div className="h-1 bg-white/20 rounded w-1/2"></div>
        </div>
    </div>
);

// Individual Breakdown Item Component
const BreakdownItem: React.FC<BreakdownItemProps> = ({
                                                         label,
                                                         color,
                                                         icon,
                                                         dataFetcher
                                                     }) => {
    const [data, setData] = React.useState<{ value: number; percentage: number } | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
                const result = await dataFetcher();
                setData(result);
            } catch (err) {
                setError('Error');
                console.error(`Error fetching ${label}:`, err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [dataFetcher, label]);

    if (isLoading) return <BreakdownSkeleton/>;
    if (error) return (
        <div className="text-white/60 text-xs py-2">Failed to load {label}</div>
    );

    // Dynamic colors based on theme
    const getProgressColor = () => {
        if (label === "Registered SIMs") {
            return "linear-gradient(90deg, #dcfce7, #bbf7d0)"; // Light green for light mode
        } else if (label === "Assigned SIMs") {
            return "linear-gradient(90deg, #fed7aa, #fdba74)"; // Light orange for both
        } else {
            return "linear-gradient(90deg, #e0e7ff, #c7d2fe)"; // Light purple for both
        }
    };

    const getDarkProgressColor = () => {
        if (label === "Active SIMs") {
            return "linear-gradient(90deg, #10b981, #059669)"; // Bright green for dark mode
        } else if (label === "Inactive SIMs") {
            return "linear-gradient(90deg, #f59e0b, #d97706)"; // Bright orange for dark mode
        } else {
            return "linear-gradient(90deg, #8b5cf6, #7c3aed)"; // Bright purple for dark mode
        }
    };

    return (
        <div className="group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <div className="text-white/80 group-hover:text-white transition-colors">
                        {icon}
                    </div>
                    <span className="text-white/90 text-sm font-medium group-hover:text-white transition-colors">
            {label}
          </span>
                </div>
                <div className="text-white font-bold text-sm">
                    {data?.value.toLocaleString()}
                </div>
            </div>
            <div className="relative">
                <div className="h-1 bg-white/10 rounded-full mb-1">
                    <div
                        className="h-1 rounded-full transition-all duration-1000 ease-out dark:hidden"
                        style={{
                            width: `${data?.percentage}%`,
                            background: getProgressColor()
                        }}
                    ></div>
                    <div
                        className="h-1 rounded-full transition-all duration-1000 ease-out hidden dark:block"
                        style={{
                            width: `${data?.percentage}%`,
                            background: getDarkProgressColor()
                        }}
                    ></div>
                </div>
                <div className="text-white/70 text-xs">
                    {data?.percentage.toFixed(1)}% of total
                </div>
            </div>
        </div>
    );
};

// Data Fetchers
const fetchRegData = async (user: any) => {
    // const {count: registered} = await simService.countReg(user)
    const [v1, v2] = await Promise.all([
        simService.countAll(user),
        simService.countReg(user)
    ])
    const [all, registered] = [v1.count ?? 0, v2.count ?? 0]
    return {value: registered ?? 0, percentage: to2dp(((registered ?? 0) / (all ?? 0)) * 100) || 0,}
};

const fetchAssignedData = async (user: any) => {
    const [v1, v2] = await Promise.all([
        simService.countAll(user),
        simService.countAssigned(user)
    ])
    const [all, assigned] = [v1.count ?? 0, v2.count ?? 0]
    return {value: assigned, percentage: to2dp((assigned / all) * 100) || 0,}
};

const fetchUnhandledData = async (user: any) => {
    const [v1, v2] = await Promise.all([
        simService.countAll(user),
        simService.countAssigned(user)
    ])

    const [all, assigned] = [v1.count ?? 0, v2.count ?? 0]
    const value = all - assigned
    return {value: value, percentage: to2dp((value / all) * 100) || 0,}
};

// Main SIM Allocation Card
const SimAllocationCard: React.FC = () => {
    const [totalSims, setTotalSims] = React.useState<number | null>(null);
    const [picklist, sP] = React.useState<number | null>(null);
    const [extra, sE] = React.useState<number | null>(null);
    const user = useApp().user
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(!user);
    React.useEffect(() => {
        const fetchTotal = async () => {
            if (!user) return
            const [v1, v2] = await Promise.all([
                simService.countAll(user),
                simService.countAll(user, [[
                    "batch_id", "BATCH-UNKNOWN"
                ]])
            ])
            setTotalSims(v1.count ?? 0);
            sE(v2.count ?? 0)
            sP((v1.count ?? 0) - (v2.count ?? 0))
            setIsLoading(false);
        };
        fetchTotal().then();
    }, [user]);
    if (!user)
        return <Skeleton/>

    return (
        <div
            className="relative h-full overflow-hidden rounded-2xl p-2 shadow-2xl border border-green-500/30 dark:border-slate-700/50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                {/* Light mode green patterns */}
                <div className="absolute inset-0 dark:hidden" style={{
                    backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(5, 150, 105, 0.3) 0%, transparent 50%)
          `
                }}></div>

                {/* Dark mode slate patterns */}
                <div className="absolute inset-0 hidden dark:block" style={{
                    backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(78, 205, 196, 0.3) 0%, transparent 50%)
          `
                }}></div>

                <div className="absolute inset-0" style={{
                    backgroundImage: `
            linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.02) 49%, rgba(255,255,255,0.02) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.02) 49%, rgba(255,255,255,0.02) 51%, transparent 52%)
          `,
                    backgroundSize: '20px 20px'
                }}></div>
            </div>

            {/* Header */}
            <div className="relative z-10 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <div
                            className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 dark:from-blue-500 dark:to-purple-600 backdrop-blur-sm border border-white/20 dark:border-0 rounded-xl flex items-center justify-center shadow-lg">
                            <Smartphone className="w-5 h-5 text-white"/>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">SIM Allocations</h3>
                            <p className="text-white/60 text-sm">Real-time distribution</p>
                        </div>
                    </div>
                    <div className="text-right">
                        {isLoading ? (
                            <div className="animate-pulse">
                                <div className="h-8 bg-white/20 rounded w-16 mb-1"></div>
                                <div className="h-3 bg-white/20 rounded w-12"></div>
                            </div>
                        ) : (
                            <div className={"bg-black/20 p-2 rounded"}>
                                <div className="text-4xl font-bold text-white tracking-tight">
                                    {totalSims?.toLocaleString()} <span className="text-white/80 text-sm font-medium">Lines</span>
                                </div>
                                <div className="flex flex-col gap-1 mt-3">
                                    <div className="text-white/70 text-sm flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-md backdrop-blur-sm">
                                        <TrendingUp className="w-4 h-4 text-emerald-400"/>
                                        <span className="font-medium">Picklist:</span>
                                        <span className="text-green-200 font-semibold">{picklist}</span>
                                    </div>
                                    <div className="text-white/70 text-sm flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-md backdrop-blur-sm">
                                        <TrendingUp className="w-4 h-4 text-blue-400"/>
                                        <span className="font-medium">Extra sources:</span>
                                        <span className="text-blue-200 font-semibold">{extra}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Breakdown Items */}
            <div className="relative z-10 space-y-4">
                <BreakdownItem
                    label="Assigned SIMs"
                    color="#fed7aa"
                    icon={<WifiOff className="w-4 h-4"/>}
                    dataFetcher={() => fetchAssignedData(user)}
                />

                <BreakdownItem
                    label="Unhandled SIMs"
                    color="#e0e7ff"
                    icon={<Zap className="w-4 h-4"/>}
                    dataFetcher={() => fetchUnhandledData(user)}
                />
            </div>
            <div className={"mt-4 relative z-10 flex"}>
                <button
                    onClick={e=>{
                        e.stopPropagation();
                        Signal.trigger("app-page-loading", true)
                        router.push("/dashboard/transfers", {scroll: false});
                    }}

                    className={"text-white cursor-pointer flex items-center justify-center gap-2  rounded-sm ms-auto bg-black/20 px-4 py-2"}>
                    see distribution
                    <ArrowUpRightSquare className="w-5 h-5"/>
                </button>
            </div>

            {/* Subtle glow effect */}
            <div
                className="absolute -inset-1 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-green-600/30 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-teal-600/20 rounded-2xl blur opacity-30"></div>
        </div>
    );
};

// Container Component
const OverallStats: React.FC = () => {
    return (
        <div className="w-full h-full transition-colors duration-300">
            <Card>
                <SimAllocationCard/>
            </Card>
        </div>
    );
};

export default OverallStats;


const Skeleton: React.FC = () => {
    return (
        <div
            className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-2 shadow-2xl border border-green-500/30 dark:border-slate-700/50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                {/* Light mode green patterns */}
                <div className="absolute inset-0 dark:hidden" style={{
                    backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(5, 150, 105, 0.3) 0%, transparent 50%)
          `
                }}></div>

                {/* Dark mode slate patterns */}
                <div className="absolute inset-0 hidden dark:block" style={{
                    backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(78, 205, 196, 0.3) 0%, transparent 50%)
          `
                }}></div>

                <div className="absolute inset-0" style={{
                    backgroundImage: `
            linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.02) 49%, rgba(255,255,255,0.02) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.02) 49%, rgba(255,255,255,0.02) 51%, transparent 52%)
          `,
                    backgroundSize: '20px 20px'
                }}></div>
            </div>

            {/* Header Skeleton */}
            <div className="relative z-10 mb-6 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <div
                            className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 dark:from-blue-500 dark:to-purple-600 backdrop-blur-sm border border-white/20 dark:border-0 rounded-xl flex items-center justify-center shadow-lg">
                            <Smartphone className="w-5 h-5 text-white/60"/>
                        </div>
                        <div>
                            <div className="h-5 bg-white/20 rounded w-32 mb-1"></div>
                            <div className="h-3 bg-white/15 rounded w-28"></div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="h-8 bg-white/20 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-white/15 rounded w-12"></div>
                    </div>
                </div>
            </div>

            {/* Breakdown Items Skeleton */}
            <div className="relative z-10 space-y-4 animate-pulse">
                {/* First Item */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-white/20 rounded"></div>
                            <div className="h-3 bg-white/20 rounded w-24"></div>
                        </div>
                        <div className="h-4 bg-white/20 rounded w-12"></div>
                    </div>
                    <div className="relative">
                        <div className="h-1 bg-white/10 rounded-full mb-1">
                            <div className="h-1 bg-white/25 rounded-full w-3/5"></div>
                        </div>
                        <div className="h-3 bg-white/15 rounded w-16"></div>
                    </div>
                </div>

                {/* Second Item */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-white/20 rounded"></div>
                            <div className="h-3 bg-white/20 rounded w-20"></div>
                        </div>
                        <div className="h-4 bg-white/20 rounded w-10"></div>
                    </div>
                    <div className="relative">
                        <div className="h-1 bg-white/10 rounded-full mb-1">
                            <div className="h-1 bg-white/25 rounded-full w-2/5"></div>
                        </div>
                        <div className="h-3 bg-white/15 rounded w-14"></div>
                    </div>
                </div>

                {/* Third Item */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-white/20 rounded"></div>
                            <div className="h-3 bg-white/20 rounded w-28"></div>
                        </div>
                        <div className="h-4 bg-white/20 rounded w-8"></div>
                    </div>
                    <div className="relative">
                        <div className="h-1 bg-white/10 rounded-full mb-1">
                            <div className="h-1 bg-white/25 rounded-full w-1/4"></div>
                        </div>
                        <div className="h-3 bg-white/15 rounded w-12"></div>
                    </div>
                </div>
            </div>

            {/* Subtle glow effect */}
            <div
                className="absolute -inset-1 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-green-600/30 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-teal-600/20 rounded-2xl blur opacity-30"></div>
        </div>
    );
};

const Card = ({children}: any) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div
            className={`relative size-full bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800    rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all duration-300 ${
                isHovered ? 'transform -translate-y-1 shadow-3xl' : ''
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* SVG Background Pattern */}
            <svg
                className="absolute top-0 left-0 w-full h-full opacity-10"
                viewBox="0 0 320 192"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Gradient Definitions */}
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="1"/>
                    </linearGradient>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1"/>
                    </linearGradient>
                    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#d97706" stopOpacity="1"/>
                    </linearGradient>
                    <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="1"/>
                    </linearGradient>
                    <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#be185d" stopOpacity="1"/>
                    </linearGradient>
                    <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#0891b2" stopOpacity="1"/>
                    </linearGradient>
                </defs>

                {/* Geometric shapes */}
                <circle
                    cx="270"
                    cy="40"
                    r="45"
                    fill="url(#grad1)"
                    opacity="0.9"
                    className={`transition-transform duration-600 ${isHovered ? 'scale-110' : ''}`}
                />
                <circle
                    cx="290"
                    cy="60"
                    r="28"
                    fill="url(#grad2)"
                    opacity="0.6"
                    className={`transition-transform duration-700 ${isHovered ? 'scale-110' : ''}`}
                />
                <circle
                    cx="250"
                    cy="25"
                    r="18"
                    fill="url(#grad3)"
                    opacity="0.8"
                    className={`transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}
                />

                {/* Floating elements */}
                <rect
                    x="230"
                    y="100"
                    width="35"
                    height="35"
                    rx="7"
                    fill="url(#grad4)"
                    opacity="0.5"
                    transform="rotate(15 247.5 117.5)"
                    className={`transition-transform duration-800 ${isHovered ? 'scale-110 rotate-12' : ''}`}
                />
                <rect
                    x="280"
                    y="120"
                    width="25"
                    height="25"
                    rx="5"
                    fill="url(#grad5)"
                    opacity="0.6"
                    transform="rotate(-20 292.5 132.5)"
                    className={`transition-transform duration-600 ${isHovered ? 'scale-110 -rotate-12' : ''}`}
                />

                {/* Wave patterns */}
                <path
                    d="M170 192 Q220 172 270 192 Q240 212 170 192"
                    fill="url(#grad6)"
                    opacity="0.3"
                    className={`transition-transform duration-700 ${isHovered ? 'scale-105' : ''}`}
                />
                <path
                    d="M200 0 Q240 20 280 0 Q260 -20 200 0"
                    fill="url(#grad1)"
                    opacity="0.4"
                    className={`transition-transform duration-500 ${isHovered ? 'scale-105' : ''}`}
                />

                {/* Dots pattern */}
                <circle cx="60" cy="170" r="4" fill="white" opacity="0.5"/>
                <circle cx="85" cy="160" r="3" fill="white" opacity="0.4"/>
                <circle cx="110" cy="175" r="3.5" fill="white" opacity="0.2"/>
                <circle cx="135" cy="165" r="2.5" fill="white" opacity="0.5"/>

                {/* Mobile device silhouettes */}
                <rect x="25" y="25" width="15" height="25" rx="4" fill="white" opacity="0.1"/>
                <rect x="50" y="40" width="12" height="20" rx="3" fill="white" opacity="0.15"/>
                <rect x="35" y="65" width="17" height="28" rx="4" fill="white" opacity="0.08"/>
            </svg>

            {/* Gradient overlay */}
            <div
                className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-br from-green-500 to-green-600 opacity-10 z-10"></div>

            {/* Content */}
            <div className="relative z-20 h-full flex flex-col justify-between">
                {children}
            </div>
        </div>
    );
};