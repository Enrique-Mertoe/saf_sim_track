import {useState, useEffect, useRef} from 'react';
import {ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar, Filter, X, BarChart} from 'lucide-react';
import {useDeepMemo} from "@react-aria/utils";
import {useDialog} from "@/app/_providers/dialog";
import ReportDateRangeTemplate from "@/ui/components/ReportDateModal";

// Main component
export default function StatCardWithWhatsappStyleExpansion() {

    // Sample data for the cards
    const statCards = [
        {
            id: 1,
            title: "Total Revenue",
            value: 124500,
            todayValue: 4800,
            weekValue: 18750,
            color: "green",
            icon: <BarChart size={18}/>
        },
        {
            id: 2,
            title: "Active Users",
            value: 8420,
            todayValue: 350,
            weekValue: 1240,
            color: "blue",
            icon: <BarChart size={18}/>
        }
    ];


    const dialog = useDialog()
    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {statCards.map(card => (
                    <StatCard
                        key={card.id}
                        {...card}
                        isRefreshing={false}
                        onExpandClick={() => {
                            const d = dialog.create({
                                content: <DetailDialog
                                    card={card}
                                    onClose={() => d.dismiss()}
                                />,
                                size: "lg"
                            })
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// Statistic Card Component
function StatCard({
                      title, value, percentage, color, isRefreshing,
                      todayValue = 0, weekValue = 0, icon, onExpandClick
                  }) {
    const [prevValue, setPrevValue] = useState(value);
    const [prevTodayValue, setPrevTodayValue] = useState(todayValue);
    const [prevWeekValue, setPrevWeekValue] = useState(weekValue);
    const [isAnimating, setIsAnimating] = useState(false);
    const cardRef = useRef<HTMLDivElement | null>(null);

    // Handle value changes with animation
    useEffect(() => {
        if ((value !== prevValue || todayValue !== prevTodayValue || weekValue !== prevWeekValue) && !isRefreshing) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setPrevValue(value);
                setPrevTodayValue(todayValue);
                setPrevWeekValue(weekValue);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [value, prevValue, todayValue, weekValue, prevTodayValue, prevWeekValue, isRefreshing]);

    const colorClasses = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-900/30",
            text: "text-blue-600 dark:text-blue-400",
            value: "text-blue-800 dark:text-blue-300",
            percent: "text-blue-700 dark:text-blue-400",
            iconBg: "bg-blue-100 dark:bg-blue-800/50",
            iconColor: "text-blue-600 dark:text-blue-400"
        },
        green: {
            bg: "bg-green-50 dark:bg-green-900/30",
            text: "text-green-600 dark:text-green-400",
            value: "text-green-800 dark:text-green-300",
            percent: "text-green-700 dark:text-green-400",
            iconBg: "bg-green-100 dark:bg-green-800/50",
            iconColor: "text-green-600 dark:text-green-400"
        },
        red: {
            bg: "bg-red-50 dark:bg-red-900/30",
            text: "text-red-600 dark:text-red-400",
            value: "text-red-800 dark:text-red-300",
            percent: "text-red-700 dark:text-red-400",
            iconBg: "bg-red-100 dark:bg-red-800/50",
            iconColor: "text-red-600 dark:text-red-400"
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-900/30",
            text: "text-purple-600 dark:text-purple-400",
            value: "text-purple-800 dark:text-purple-300",
            percent: "text-purple-700 dark:text-purple-400",
            iconBg: "bg-purple-100 dark:bg-purple-800/50",
            iconColor: "text-purple-600 dark:text-purple-400"
        }
    };

    const trendPercentage = weekValue > 0
        ? Math.round(((todayValue - weekValue) / weekValue) * 100)
        : 0;

    const isTrendPositive = trendPercentage >= 0;

    function calcTPercentage() {
        return Math.abs(trendPercentage);
    }

    const handleExpand = () => {
        if (cardRef.current && onExpandClick) {
            // const rect = cardRef.current.getBoundingClientRect();

            onExpandClick(cardRef.current);
        }
    };

    return (
        <div
            ref={cardRef}
            className={`${colorClasses[color].bg} p-5 w-full rounded-lg transition-all duration-200 transform ${
                isAnimating ? 'scale-105' : ''
            } ${isRefreshing ? 'opacity-70' : 'opacity-100'} shadow-sm hover:shadow-md`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                    <div className={`${colorClasses[color].iconBg} p-2 rounded-lg mr-3`}>
                        <div className={colorClasses[color].iconColor}>
                            {icon}
                        </div>
                    </div>
                    <p className={`text-sm font-medium ${colorClasses[color].text}`}>{title}</p>
                </div>

                {percentage !== undefined && (
                    <span className={`text-sm font-semibold ${colorClasses[color].percent} flex items-center`}>
            {percentage}%
          </span>
                )}
            </div>

            {/* General value */}
            <div className="mb-4">
                <p className={`text-2xl font-bold ${colorClasses[color].value} ${
                    isAnimating ? 'animate-pulse' : ''
                }`}>
                    {isRefreshing ? (
                        <span
                            className="inline-block w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                    ) : <div className="flex items-center">
                        Total: <div className="w-1"></div>
                        {value.toLocaleString()}
                    </div>}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                {/* Today's value */}
                <div className="border-r border-gray-200 dark:border-gray-700 pr-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today</p>
                    <p className={`text-xl font-bold ${colorClasses[color].value} ${
                        isAnimating ? 'animate-pulse' : ''
                    }`}>
                        {isRefreshing ? (
                            <span
                                className="inline-block w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                        ) : todayValue.toLocaleString()}
                    </p>
                </div>

                {/* This week's value */}
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Week</p>
                    <div className="flex items-center">
                        <p className={`text-xl font-bold ${colorClasses[color].value} ${
                            isAnimating ? 'animate-pulse' : ''
                        }`}>
                            {isRefreshing ? (
                                <span
                                    className="inline-block w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                            ) : weekValue.toLocaleString()}
                        </p>

                        {/* Trend indicator */}
                        {!isRefreshing && trendPercentage !== 0 && (
                            <div
                                className={`flex items-center ml-2 ${isTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isTrendPositive ?
                                    <TrendingUp size={16}/> :
                                    <TrendingDown size={16}/>
                                }
                                <span className="text-xs font-medium ml-1">{calcTPercentage()}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* View More / Expand Section */}
            <div className="pt-2 text-center">
                <button
                    onClick={handleExpand}
                    className={`inline-flex items-center justify-center text-sm font-medium ${colorClasses[color].text} hover:opacity-80 transition-opacity`}
                >
                    <span>View More</span>
                    <ChevronDown size={16} className="ml-1"/>
                </button>
            </div>
        </div>
    );
}

// Detail Dialog Component that appears to expand from the card
function DetailDialog({
                          card,
                          onClose,
                      }: {
    card: any,
    onClose: Closure,
}) {
    const [selectedTab, setSelectedTab] = useState('daily');
    const [dateRange, setDateRange] = useState('week');
    const dialogRef = useRef(null);


    const dialog = useDialog()
    if (!card) return null;

    const colorClasses = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-900/20",
            lightBg: "bg-blue-50/50",
            border: "border-blue-200 dark:border-blue-800",
            text: "text-blue-600 dark:text-blue-400",
            activeBg: "bg-blue-100 dark:bg-blue-800"
        },
        green: {
            bg: "bg-green-50 dark:bg-green-900/20",
            lightBg: "bg-green-50/50",
            border: "border-green-200 dark:border-green-800",
            text: "text-green-600 dark:text-green-400",
            activeBg: "bg-green-100 dark:bg-green-800"
        },
        red: {
            bg: "bg-red-50 dark:bg-red-900/20",
            lightBg: "bg-red-50/50",
            border: "border-red-200 dark:border-red-800",
            text: "text-red-600 dark:text-red-400",
            activeBg: "bg-red-100 dark:bg-red-800"
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-900/20",
            lightBg: "bg-purple-50/50",
            border: "border-purple-200 dark:border-purple-800",
            text: "text-purple-600 dark:text-purple-400",
            activeBg: "bg-purple-100 dark:bg-purple-800"
        }
    };

    // Sample detailed data
    const detailedData = {
        daily: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            values: [1200, 1550, 950, 1800, 2100, 1600, 1300]
        },
        weekly: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            values: [8500, 7900, 9200, 10500]
        },
        monthly: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            values: [35000, 29500, 32000, 41000, 38000]
        }
    };
    return (
        <div
            ref={dialogRef}
            className={`${
                //@ts-ignore
                colorClasses[card.color].bg} rounded-lg shadow-xl border ${
                //@ts-ignore
                colorClasses[card.color].border} 
        overflow-hidden`}
        >
            <>
                {/* Header */}
                <div
                    className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className={`${
                            //@ts-ignore
                            colorClasses[card.color].activeBg} p-2 rounded-lg mr-3`}>
                            <div className={
                                //@ts-ignore
                                colorClasses[card.color].text}>
                                {card.icon}
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{card.title} Details</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X size={20}/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-auto">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{card.value.toLocaleString()}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Today</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{card.todayValue.toLocaleString()}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">This Week</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{card.weekValue.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap justify-between mb-6">
                        {/* Tabs */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 sm:mb-0">
                            {['daily', 'weekly', 'monthly'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setSelectedTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                      ${selectedTab === tab
                                        ? `${
                                            //@ts-ignore
                                            colorClasses[card.color].activeBg} ${colorClasses[card.color].text}`
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Date Range */}
                        <div className="flex space-x-2 items-center">


                            <button
                                onClick={() => {
                                    const d = dialog.create({
                                        content: <ReportDateRangeTemplate
                                            onConfirm={() => {
                                            }}
                                            onClose={() => d.dismiss()}/>,
                                        size:"lg"

                                    })
                                }}
                                className={`${
                                    //@ts-ignore
                                    colorClasses[card.color].lightBg} ${colorClasses[card.color].text} p-1 rounded-md flex items-center justify-center gap-2 cursor-pointer ml-2`}
                            >
                                <Calendar size={16} className="text-gray-500  dark:text-gray-400"/>
                                Select period
                            </button>
                        </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div
                        className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 h-64 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400 mb-2">
                                Chart Visualization
                                for {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Data
                            </p>
                            <div className="flex justify-center space-x-6">
                                {
                                    //@ts-ignore
                                    detailedData[selectedTab].labels.map((label, index) => (
                                        <div key={index} className="flex flex-col items-center">
                                            <div
                                                className={`w-4 bg-${card.color}-500`}
                                                style={{
                                                    height: `${(detailedData[selectedTab].values[index] / Math.max(...detailedData[selectedTab].values)) * 100}px`,
                                                    minHeight: '20px'
                                                }}
                                            ></div>
                                            <span className="text-xs mt-1 text-gray-500">{label}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </>

        </div>
    );
}