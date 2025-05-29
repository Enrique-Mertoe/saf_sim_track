import {motion} from "framer-motion";
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronRight,
    CreditCard,
    FileText,
    Loader2,
    Settings,
    User,
    Zap
} from "lucide-react";
import {SIMCard, User as User1} from "@/models";
import {useEffect, useState} from "react";
import {formatDate} from "@/helper";
import {userService} from "@/services";
import simService from "@/services/simService";
import useApp from "@/ui/provider/AppProvider";

const SIMStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    PENDING: "PENDING",
    SOLD: "SOLD",
};

export default function StaffList({team_id}: {
    team_id: string
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [expandedStaff, setExpandedStaff] = useState(null);
    const [staffMembers, setStaffMembers] = useState<User1[]>([]);
    const [simCards, setSimCards] = useState<SIMCard[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<any | undefined>(undefined);
    const [staffSimCounts, setStaffSimCounts] = useState<Record<string, number>>({});
const {user} = useApp()
    const toggleStaffExpand = (staffId: any) => {
        if (expandedStaff === staffId) {
            setExpandedStaff(null);
        } else {
            setExpandedStaff(staffId);
        }
    };
    useEffect(() => {
        const loadStaffs = async () => {
           if (!user) return;
            try {
                const {data, error} = await userService.getUsersByTeam(team_id,user);
                setStaffMembers(data as any)
            } finally {
                setIsLoading(false);
            }
        }
        const loadsims = async () => {
            try {
                const data = await simService.getSIMCardsByTeamId(team_id);
                setSimCards(data)
            } finally {
                setIsLoading(false);
            }
        }
        loadsims().then()
        loadStaffs().then()
    }, [team_id,user]);

    useEffect(() => {
        // Calculate staff SIM counts based on filtered SIM cards
        const filteredSimCards = getFilteredSimCards();
        const counts: Record<string, number> = {};

        filteredSimCards.forEach(sim => {
            if (!counts[sim.sold_by_user_id]) {
                counts[sim.sold_by_user_id] = 0;
            }
            counts[sim.sold_by_user_id]++;
        });

        setStaffSimCounts(counts);
    }, [simCards, searchQuery, dateRange]);

    const getFilteredSimCards = () => {
        return simCards
        //     .filter(sim => {
        //     // Text search filter
        //     const matchesSearch = !searchQuery ||
        //         sim.serial_number.toLowerCase().includes(searchQuery.toLowerCase());
        //
        //     // Date range filter
        //     let matchesDateRange = true;
        //     if (dateRange?.from) {
        //         const simDate = new Date(sim.assigned_on || "");
        //         const fromDate = new Date(dateRange.from);
        //         fromDate.setHours(0, 0, 0, 0);
        //
        //         if (dateRange.to) {
        //             // Date range case
        //             const toDate = new Date(dateRange.to);
        //             toDate.setHours(23, 59, 59, 999);
        //             matchesDateRange = simDate >= fromDate && simDate <= toDate;
        //         } else {
        //             // Single date case
        //             const singleDate = new Date(dateRange.from);
        //             const nextDay = new Date(singleDate);
        //             nextDay.setDate(nextDay.getDate() + 1);
        //             matchesDateRange = simDate >= fromDate && simDate < nextDay;
        //         }
        //     }
        //
        //     return matchesSearch && matchesDateRange;
        // });
    };

    const clearDateRange = () => {
        setDateRange(undefined);
    };

    const filterSimCardsForStaff = (staffId: string) => {
        return getFilteredSimCards().filter(sim => sim.sold_by_user_id === staffId);
    };
    return (
        <>
            {
                isLoading ? (
                    <div
                        className="p-16 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                        <motion.div
                            animate={{rotate: 360}}
                            transition={{duration: 1.5, repeat: Infinity, ease: "linear"}}
                        >
                            <Loader2 size={48} className="text-green-600 dark:text-green-500 mb-4"/>
                        </motion.div>
                        <p>Loading assigned SIM cards...</p>
                    </div>
                ) : (
                    <motion.div
                        className="space-y-4"
                        initial="hidden"
                        animate="visible"
                    >
                        {staffMembers
                            .filter(staff => staffSimCounts[staff.id] > 0)
                            .map((staff, index) => (
                                <motion.div
                                    key={staff.id}
                                    className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800"
                                >
                                    <motion.div
                                        className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 flex justify-between items-center cursor-pointer"
                                        onClick={() => toggleStaffExpand(staff.id)}
                                        whileHover={{backgroundColor: "#f5f7fa"}}
                                    >
                                        <div className="flex items-center">
                                            <motion.div
                                                className="bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-300 p-2 rounded-full mr-3"
                                                whileHover={{scale: 1.1}}
                                                whileTap={{scale: 0.9}}
                                            >
                                                <User size={20}/>
                                            </motion.div>
                                            <span
                                                className="font-medium dark:text-gray-200">{staff.full_name || staff.email}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <motion.div
                                                className="bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300 rounded-full px-3 py-1 text-sm mr-3 flex items-center"
                                            >
                                                <CreditCard size={14} className="mr-1"/>
                                                {staffSimCounts[staff.id] || 0} SIM cards
                                            </motion.div>
                                            <motion.div
                                                animate={{
                                                    rotate: expandedStaff === staff.id ? 90 : 0
                                                }}
                                                transition={{duration: 0.3}}
                                            >
                                                <ChevronRight size={20}
                                                              className="text-gray-400 dark:text-gray-500"/>
                                            </motion.div>
                                        </div>
                                    </motion.div>

                                    <>
                                        {expandedStaff === staff.id && (
                                            <motion.div
                                                initial={{height: 0, opacity: 0}}
                                                animate={{height: "auto", opacity: 1}}
                                            >
                                                <div className="border-t dark:border-gray-700">
                                                    <div
                                                        className="grid grid-cols-12 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 font-medium border-b dark:border-gray-700">
                                                        <div
                                                            className="col-span-7 p-3 flex items-center dark:text-gray-300">
                                                            <CreditCard size={16}
                                                                        className="text-green-600 dark:text-green-500 mr-2"/>
                                                            Serial Number
                                                        </div>
                                                        <div
                                                            className="col-span-3 p-3 flex items-center dark:text-gray-300">
                                                            <Calendar size={16}
                                                                      className="text-green-600 dark:text-green-500 mr-2"/>
                                                            Date Sold
                                                        </div>
                                                        <div
                                                            className="col-span-2 p-3 flex items-center dark:text-gray-300">
                                                            <Settings size={16}
                                                                      className="text-green-600 dark:text-green-500 mr-2"/>
                                                            Status
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="max-h-72 overflow-y-auto custom-scrollbar">
                                                        {filterSimCardsForStaff(staff.id).length > 0 ? (
                                                            filterSimCardsForStaff(staff.id).map((sim, idx) => (
                                                                <motion.div
                                                                    key={sim.id}
                                                                    className="grid grid-cols-12 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                                    initial={{opacity: 0, x: -10}}
                                                                    animate={{opacity: 1, x: 0}}
                                                                    transition={{delay: 0.05 * idx}}
                                                                >
                                                                    <div
                                                                        className="col-span-7 p-3 flex items-center dark:text-gray-300">
                                                                        <motion.div
                                                                            className="flex items-center"
                                                                            whileHover={{x: 5}}
                                                                        >
                                                                            <CreditCard size={16}
                                                                                        className="text-gray-500 dark:text-gray-400 mr-3"/>
                                                                            {sim.serial_number}
                                                                        </motion.div>
                                                                    </div>
                                                                    <div className="col-span-3 p-3 dark:text-gray-300">
                                                                        {formatDate(sim.assigned_on || "")}
                                                                    </div>
                                                                    <div className="col-span-2 p-3">
                                                                        <motion.span
                                                                            className={`rounded-full px-3 py-1 text-sm inline-flex items-center ${
                                                                                sim.status === SIMStatus.SOLD
                                                                                    ? "bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300"
                                                                                    : sim.status === SIMStatus.ACTIVE
                                                                                        ? "bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-300"
                                                                                        : sim.status === SIMStatus.PENDING
                                                                                            ? "bg-yellow-100 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-300"
                                                                                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                                                            }`}
                                                                            initial={{
                                                                                scale: 0.8,
                                                                                opacity: 0
                                                                            }}
                                                                            animate={{scale: 1, opacity: 1}}
                                                                            transition={{delay: 0.08 * idx}}
                                                                        >
                                                                            {sim.status === SIMStatus.SOLD &&
                                                                                <CheckCircle size={14}
                                                                                             className="mr-1"/>}
                                                                            {sim.status === SIMStatus.ACTIVE &&
                                                                                <Zap size={14}
                                                                                     className="mr-1"/>}
                                                                            {sim.status === SIMStatus.PENDING &&
                                                                                <Loader2 size={14}
                                                                                         className="mr-1 animate-spin"/>}
                                                                            {sim.status === SIMStatus.INACTIVE &&
                                                                                <AlertTriangle size={14}
                                                                                               className="mr-1"/>}
                                                                            {sim.status}
                                                                        </motion.span>
                                                                    </div>
                                                                </motion.div>
                                                            ))
                                                        ) : (
                                                            <div
                                                                className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                                No SIM cards match the current filters
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </>
                                </motion.div>
                            ))}

                        {staffMembers.filter(staff => staffSimCounts[staff.id] > 0).length === 0 && (
                            <motion.div
                                className="p-16 text-center text-gray-500 dark:text-gray-400 border rounded-lg flex flex-col items-center"
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                            >
                                <FileText size={48} className="text-gray-400 mb-4"/>
                                {dateRange ? (
                                    <p>No SIM cards found for the selected date range</p>
                                ) : searchQuery ? (
                                    <p>No SIM cards match your search</p>
                                ) : (
                                    <p>No assigned SIM cards found</p>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )
            }
        </>
    )

}