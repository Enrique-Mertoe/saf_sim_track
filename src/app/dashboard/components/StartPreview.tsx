import {useEffect, useRef, useState} from "react";
import {useDialog} from "@/app/_providers/dialog";
import {Calendar, X} from "lucide-react";
import ReportDateRangeTemplate from "@/ui/components/ReportDateModal";
import MaterialSelect from "@/ui/components/MaterialSelect";
import {Team as Team1, User} from "@/models";
import {teamService} from "@/services";
import alert from "@/ui/alert";

type Team = Team1 & {
    users?: User,
    leader: string
}
export default function StartPreview({
                                         card,
                                         onClose,
                                     }: {
    card: any,
    onClose: Closure,
}) {
    const [selectedTab, setSelectedTab] = useState('daily');
    const [dateRange, setDateRange] = useState('week');
    const dialogRef = useRef(null);
    const [teams, setTeams] = useState<Team[]>([])
    useEffect(() => {
        async function fetchTeams() {
            const {data, error} = await teamService.getAllTeams()
            if (error)
                return alert.error(error.message)
            setTeams((data as Team[])?.map(team => {
                team.leader = team.users?.full_name ?? 'No leader'
                return team
            }))
        }

        fetchTeams().then()
    }, []);
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
                           <span className="flex gap-2 items-center">
                               <span>Team:</span>

                               <MaterialSelect
                                   className={"!w-[250px]"}
                                   animation={"slide"}
                                   options={teams}
                                   valueKey={"id"}
                                   displayKey={"name,leader"}
                                   onChange={(value) => console.log(value)}
                               />
                           </span>

                            <button
                                onClick={() => {
                                    const d = dialog.create({
                                        content: <ReportDateRangeTemplate
                                            onConfirm={() => {
                                                d.dismiss()
                                            }}
                                            onClose={() => d.dismiss()}/>,
                                        size: "lg",
                                        // design: ["scrollable"]

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
                                                    height: `${(
                                                        //@ts-ignore
                                                        detailedData[selectedTab].values[index] / Math.max(...detailedData[selectedTab].values)) * 100}px`,
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