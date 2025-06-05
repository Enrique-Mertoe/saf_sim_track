import React, {useEffect, useState} from 'react';
import {Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip} from 'recharts';
import {AlertCircle, CheckCircle, Clock, TrendingUp} from 'lucide-react';
import {createSupabaseClient} from "@/lib/supabase/client";
import {admin_id} from "@/services/helper";
import useApp from "@/ui/provider/AppProvider";
import {SIMStatus} from "@/models";

interface ChartData {
    name: string;
    value: number;
    count: number;
    color: string;
    icon: React.ReactNode;
}

const ENHANCED_COLORS = [
    '#00D4AA', // Vibrant teal for activated
    '#FF6B6B', // Coral red for pending
    '#4ECDC4', // Turquoise for registered
];

const GRADIENT_COLORS = [
    'url(#activatedGradient)',
    'url(#pendingGradient)',
    'url(#registeredGradient)'
];

// Custom active shape for hover effect
const renderActiveShape = (props: any) => {
    const {cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value} = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                className="drop-shadow-lg"
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 10}
                outerRadius={outerRadius + 12}
                fill={fill}
                opacity={0.8}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2}/>
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#374151"
                  className="font-semibold text-sm">
                {payload.name}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#6B7280"
                  className="text-xs">
                {`${value} (${(percent * 100).toFixed(1)}%)`}
            </text>
        </g>
    );
};

// Custom label renderer
const renderCustomizedLabel = ({cx, cy, midAngle, innerRadius, outerRadius, percent}: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            className="text-xs font-bold drop-shadow-sm"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// Shimmer loading component
const ShimmerLoader = () => (
    <div className="animate-pulse">
        <div className="flex justify-center items-center h-80">
            <div
                className="w-64 h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-[shimmer_2s_infinite] opacity-30"></div>
            </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-12 mx-auto"></div>
                </div>
            ))}
        </div>
    </div>
);

const supabase = createSupabaseClient();
const SIMActivationChart: React.FC = () => {
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [totalCount, setTotalCount] = useState(0);
    const user = useApp().user
    const to2dp = (num: number) => Math.round(num * 100) / 100;

    const baseQry = (adminId: any) => (supabase
        .from('sim_cards')
        .select('*', {count: 'exact', head: true})
        .eq('admin_id', adminId))
    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const adminId = await admin_id(user);


            // Fetch counts for each category
            const [activatedRes, registeredRes, ttl] = await Promise.all([
                // Activated: has activation_date
                baseQry(adminId)
                    .eq('status', SIMStatus.ACTIVATED),

                // Registered: has registered_on but no activation_date
                baseQry(adminId)
                    .eq('status', SIMStatus.REGISTERED),

                // Pending: neither registered nor activated
                // baseQry(adminId)
                //     .eq('status', SIMStatus.PENDING),
                baseQry(adminId)
            ]);

            // Extract counts
            const activatedCount = activatedRes.count ?? 0;
            const registeredCount = registeredRes.count ?? 0;
            const totalSalesCount = ttl.count ?? 0;
            const pendingCount = totalSalesCount - activatedCount - registeredCount;
            setTotalCount(totalSalesCount);
            const pieData: ChartData[] = [
                {
                    name: 'Activated',
                    value: to2dp((activatedCount / totalSalesCount) * 100) || 0,

                    count: activatedCount,
                    color: ENHANCED_COLORS[0],
                    icon: <CheckCircle size={16}/>
                },
                {
                    name: 'Pending',
                    value: to2dp((pendingCount / totalSalesCount) * 100) || 0,

                    count: pendingCount,
                    color: ENHANCED_COLORS[1],
                    icon: <Clock size={16}/>
                },
                {
                    name: 'Registered',
                    value: to2dp((registeredCount / totalSalesCount) * 100) || 0,
                    count: registeredCount,
                    color: ENHANCED_COLORS[2],
                    icon: <AlertCircle size={16}/>
                }
            ];

            setChartData(pieData);
        } catch (error) {
            console.error('Error fetching SIM data:', error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData().then();
    }, [user]);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(-1);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="mx-auto">

                {/* Main Chart Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-sm  border border-white/20 p-2 mb-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-white"/>
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">Activation Status</h2>
                                <p className="text-gray-500 text-xs ">Distribution across all SIM cards</p>
                            </div>
                        </div>
                        {/*<div className="text-right">*/}
                        {/*    <div className="text-3xl font-bold text-gray-900">{totalCount.toLocaleString()}</div>*/}
                        {/*    <div className="text-sm text-gray-500 flex items-center">*/}
                        {/*        <Users size={14} className="mr-1"/>*/}
                        {/*        Total SIM Cards*/}
                        {/*    </div>*/}
                        {/*</div>*/}
                    </div>

                    <div className="h-70 relative">
                        {loading ? (
                            <ShimmerLoader/>
                        ) : chartData.length > 0 ? (
                            <>
                                {/* SVG Gradients */}
                                <svg width="0" height="0">
                                    <defs>
                                        <linearGradient id="activatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#00F5FF"/>
                                            <stop offset="100%" stopColor="#00D4AA"/>
                                        </linearGradient>
                                        <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#FF8A80"/>
                                            <stop offset="100%" stopColor="#FF6B6B"/>
                                        </linearGradient>
                                        <linearGradient id="registeredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#4ECDC4"/>
                                            <stop offset="100%" stopColor="#26A69A"/>
                                        </linearGradient>
                                    </defs>
                                </svg>

                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={100}
                                            innerRadius={40}
                                            fill="#8884d8"
                                            dataKey="value"
                                            animationBegin={0}
                                            animationDuration={2000}
                                            activeIndex={activeIndex}
                                            activeShape={renderActiveShape}
                                            onMouseEnter={onPieEnter}
                                            onMouseLeave={onPieLeave}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={GRADIENT_COLORS[index] || entry.color}
                                                    stroke="white"
                                                    strokeWidth={3}
                                                    className="hover:opacity-80 transition-opacity duration-300"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number, name: string, props: any) => [
                                                `${props.payload.count} cards (${value}%)`,
                                                name
                                            ]}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(10px)',
                                                color: '#1F2937',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                                fontSize: '14px',
                                                fontWeight: '500'
                                            }}
                                            cursor={false}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div
                                        className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-8 h-8 text-gray-400"/>
                                    </div>
                                    <p className="text-gray-500 text-lg">No data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {chartData.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white/70 backdrop-blur-sm rounded-sm p-2 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            style={{borderTop: `4px solid ${item.color}`}}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className="p-2 rounded-xl text-white"
                                    style={{backgroundColor: item.color}}
                                >
                                    {item.icon}
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-gray-900">{item.value}%</div>
                                    <div className="text-sm text-gray-500">of total</div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.name}</h3>
                                <p className="text-gray-600 text-xs">
                                    {item.count.toLocaleString()} SIM cards
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom CSS for shimmer animation */}
            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
};

export default SIMActivationChart;