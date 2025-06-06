import React from 'react';
import {Signal, Smartphone, TrendingUp, WifiOff, Zap} from 'lucide-react';
import simService from "@/services/simService";
import useApp from "@/ui/provider/AppProvider";
import {to2dp} from "@/helper";

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
    const user = useApp().user
    const [isLoading, setIsLoading] = React.useState(!user);
    React.useEffect(() => {
        const fetchTotal = async () => {
            if (!user) return
            const {count} = await simService.countAll(user)
            setTotalSims(count ?? 0);
            setIsLoading(false);
        };
        fetchTotal().then();
    }, [user]);
    if (!user)
        return <Skeleton/>

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
                            <>
                                <div className="text-3xl font-bold text-white">
                                    {totalSims?.toLocaleString()}
                                </div>
                                <div className="text-white/60 text-sm flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1"/>
                                    Total SIMs
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Breakdown Items */}
            <div className="relative z-10 space-y-4">
                <BreakdownItem
                    label="Registered SIMs"
                    color="#dcfce7"
                    icon={<Signal className="w-4 h-4"/>}
                    dataFetcher={() => fetchRegData(user)}
                />

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

            <SimAllocationCard/>
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