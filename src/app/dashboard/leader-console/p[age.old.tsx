
"use client"
import {useState, useEffect} from "react";
import {motion, AnimatePresence, MotionConfig} from "framer-motion";
import {
    Search, User, Calendar, ChevronDown, ChevronRight, Check,
    Plus, Filter, X, Smartphone, Users, CreditCard,
    FileText, CheckCircle, AlertTriangle, Loader2,
    ArrowRight, Zap, Settings, BarChart
} from "lucide-react";
import {createSupabaseClient} from "@/lib/supabase/client";
import {SIMCard, UserRole, User as UserInfo} from "@/models";
import Dashboard from "@/ui/components/dash/Dashboard";
import alert from "@/ui/alert";
import useApp from "@/ui/provider/AppProvider";

// Enums
const SIMStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    PENDING: "PENDING",
    SOLD: "SOLD",
};

const supabase = createSupabaseClient();

// Animation variants
const containerVariants = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: {opacity: 0, y: 10},
    visible: {opacity: 1, y: 0}
};

const badgeVariants = {
    initial: {scale: 0.8, opacity: 0},
    animate: {scale: 1, opacity: 1, transition: {type: "spring", stiffness: 500}}
};

export default function SimCardAssignment() {
    // State
    const {user} = useApp();
    const [activeView, setActiveView] = useState("unassigned"); // "unassigned" or "assigned"
    const [simCards, setSimCards] = useState<SIMCard[]>([]);
    const [selectedSims, setSelectedSims] = useState<string[]>([]);
    const [staffMembers, setStaffMembers] = useState<UserInfo[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedStaff, setExpandedStaff] = useState(null);
    const [dateFilter, setDateFilter] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Default to a week ago
        end: new Date().toISOString().split("T")[0], // Today
    });
    const [selectionMode, setSelectionMode] = useState("individual"); // 'individual', 'range', or 'search'
    const [rangeSelection, setRangeSelection] = useState({
        start: "",
        end: ""
    });
    const [isAssigning, setIsAssigning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [staffSimCounts, setStaffSimCounts] = useState({});
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [showFloatingAction, setShowFloatingAction] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Card statistics (sample data - replace with real data from your API)
    const [stats, setStats] = useState({
        totalCards: 0,
        assignedCards: 0,
        unassignedCards: 0,
        recentAssignments: 0
    });

    // Load data on initial render
    useEffect(() => {
        fetchData();
    }, [dateFilter, user]);

    // Show floating button when scrolling
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowFloatingAction(true);
            } else {
                setShowFloatingAction(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch data based on the active view
    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch staff members
            const {data: staffData, error: staffError} = await supabase
                .from('users')
                .select('*')
                .eq('role', UserRole.STAFF)
                .eq('team_id', user.team_id);

            if (staffError) throw staffError;
            setStaffMembers(staffData || []);

            // Fetch SIM cards with different queries for assigned/unassigned
            let query = supabase.from('sim_cards').select('*');

            if (activeView === "unassigned") {
                query = query.is('sold_by_user_id', null);
            } else {
                query = query.not('sold_by_user_id', 'is', null);

                // Apply date filter for assigned view
                if (dateFilter.start && dateFilter.end) {
                    query = query.gte('created_at', dateFilter.start)
                        .lte('created_at', dateFilter.end);
                }
            }

            const {data: d1, error: simError} = await query;
            if (simError) throw simError;
            const simData = d1 as SIMCard[];


            setSimCards(simData || []);

            // Calculate total stats for dashboard
            const {data: allSimsData, error: allSimsError} = await supabase
                .from('sim_cards')
                .select('*');

            if (!allSimsError && allSimsData) {
                const assigned = allSimsData.filter(sim => sim.sold_by_user_id !== null).length;
                setStats({
                    totalCards: allSimsData.length,
                    assignedCards: assigned,
                    unassignedCards: allSimsData.length - assigned,
                    recentAssignments: allSimsData.filter(sim =>
                        sim.sold_by_user_id !== null &&
                        new Date(sim.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length
                });
            }

            // Calculate counts for assigned SIMs
            if (activeView === "assigned") {
                const counts = {};
                simData.forEach(sim => {
                    if (sim.sold_by_user_id) {
                        //@ts-ignore
                        counts[sim.sold_by_user_id] = (counts[sim.sold_by_user_id] || 0) + 1;
                    }
                });
                setStaffSimCounts(counts);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            alert.error("Failed to load data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle sim card selection
    const toggleSimSelection = (simId: any) => {
        if (selectedSims.includes(simId)) {
            setSelectedSims(selectedSims.filter(id => id !== simId));
        } else {
            setSelectedSims([...selectedSims, simId]);
        }
    };

    // Select all SIMs matching the search query
    const selectSimsBySearch = () => {
        if (!searchQuery.trim()) return;

        const matchingSims = simCards
            .filter(sim => sim.serial_number.includes(searchQuery))
            .map(sim => sim.id);
//@ts-ignore
        setSelectedSims([...new Set([...selectedSims, ...matchingSims])]);
    };

    // Select SIM cards by range
    const selectSimsByRange = () => {
        if (!rangeSelection.start || !rangeSelection.end) return;

        const matchingSims = simCards
            .filter(sim =>
                sim.serial_number >= rangeSelection.start &&
                sim.serial_number <= rangeSelection.end
            )
            .map(sim => sim.id);
//@ts-ignore
        setSelectedSims([...new Set([...selectedSims, ...matchingSims])]);
    };

    // Clear all selections
    const clearSelections = () => {
        setSelectedSims([]);
        setRangeSelection({start: "", end: ""});
        setSearchQuery("");
    };

    // Assign selected SIMs to selected staff
    const assignSimsToStaff = async () => {
        if (!selectedStaff || selectedSims.length === 0) {
            alert.info("Please select both staff member and SIM cards");
            return;
        }

        setIsAssigning(true);
        try {
            const {error} = await supabase
                .from('sim_cards')
                .update({sold_by_user_id: selectedStaff})
                .in('id', selectedSims);

            if (error) throw error;

            alert.success(`Successfully assigned ${selectedSims.length} SIM cards`);
            setSelectedSims([]);
            setSelectedStaff(null);
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error assigning SIMs:", error);
            alert.error("Failed to assign SIM cards. Please try again.");
        } finally {
            setIsAssigning(false);
        }
    };

    // Toggle expanded staff view
    const toggleStaffExpand = (staffId: any) => {
        if (expandedStaff === staffId) {
            setExpandedStaff(null);
        } else {
            setExpandedStaff(staffId);
        }
    };

    // Filter SIMs by search query
    const filteredSims = searchQuery
        ? simCards.filter(sim => sim.serial_number.includes(searchQuery))
        : simCards;

    // Smooth scroll to top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <MotionConfig transition={{duration: 0.3}}>
            <Dashboard>
                {/* Header with stats */}
                <motion.div
                    className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-8 relative overflow-hidden"
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.1}}
                >
                    {/* Animated circles in background */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                        <div className="absolute w-40 h-40 rounded-full bg-white opacity-5 -top-10 -right-10"></div>
                        <div className="absolute w-60 h-60 rounded-full bg-white opacity-5 -bottom-20 -left-20"></div>
                        <motion.div
                            className="absolute w-20 h-20 rounded-full bg-white opacity-10"
                            animate={{
                                x: [0, 30, 0],
                                y: [0, -20, 0],
                            }}
                            transition={{repeat: Infinity, duration: 8, ease: "easeInOut"}}
                            style={{left: '30%', top: '30%'}}
                        ></motion.div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold flex items-center">
                                <Smartphone className="mr-3"/>
                                SIM Card Management
                            </h1>
                            <motion.button
                                className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-sm"
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                onClick={() => setShowStats(!showStats)}
                            >
                                {showStats ? <X size={20}/> : <BarChart size={20}/>}
                            </motion.button>
                        </div>

                        <AnimatePresence>
                            {showStats && (
                                <motion.div
                                    className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: 'auto'}}
                                    exit={{opacity: 0, height: 0}}
                                >
                                    <motion.div
                                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center"
                                        variants={itemVariants}
                                    >
                                        <div className="rounded-full bg-white/20 p-3 mr-3">
                                            <CreditCard size={24}/>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-80">Total SIM Cards</p>
                                            <p className="text-2xl font-bold">{stats.totalCards}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center"
                                        variants={itemVariants}
                                    >
                                        <div className="rounded-full bg-white/20 p-3 mr-3">
                                            <CheckCircle size={24}/>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-80">Assigned Cards</p>
                                            <p className="text-2xl font-bold">{stats.assignedCards}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center"
                                        variants={itemVariants}
                                    >
                                        <div className="rounded-full bg-white/20 p-3 mr-3">
                                            <AlertTriangle size={24}/>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-80">Unassigned Cards</p>
                                            <p className="text-2xl font-bold">{stats.unassignedCards}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center"
                                        variants={itemVariants}
                                    >
                                        <div className="rounded-full bg-white/20 p-3 mr-3">
                                            <Zap size={24}/>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-80">Recent Assignments</p>
                                            <p className="text-2xl font-bold">{stats.recentAssignments}</p>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Floating Action Button */}
                <AnimatePresence>
                    {showFloatingAction && (
                        <motion.button
                            className="fixed bottom-8 right-8 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg z-50 flex items-center justify-center"
                            initial={{scale: 0, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0, opacity: 0}}
                            whileHover={{scale: 1.1}}
                            whileTap={{scale: 0.9}}
                            onClick={scrollToTop}
                        >
                            <ChevronDown className="rotate-180"/>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="container mx-auto p-4 pb-16">
                    {/* View Toggle - Fancy Tabs */}
                    <motion.div
                        className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden relative z-10 border border-gray-100"
                        initial={{opacity: 0, y: 20, scale: 0.97}}
                        animate={{opacity: 1, y: 0, scale: 1}}
                        transition={{
                            duration: 0.5,
                            ease: "easeOut"
                        }}
                        whileHover={{
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                        }}
                    >
                        <div className="flex relative">
                            {/* Animated indicator bar */}
                            <motion.div
                                className="absolute h-1.5 bottom-0 bg-gradient-to-r from-green-500 to-green-600 rounded-t-md"
                                initial={false}
                                animate={{
                                    left: activeView === "unassigned" ? "0%" : "50%",
                                    width: "50%"
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                            />

                            {/* Unassigned Tab Button */}
                            <motion.button
                                className={`py-4 cursor-pointer px-6 flex-1 font-medium relative z-10 flex justify-center items-center ${
                                    activeView === "unassigned" ? "text-green-600" : "text-gray-700"
                                }`}
                                onClick={() => setActiveView("unassigned")}
                                whileHover={{backgroundColor: "rgba(16, 185, 129, 0.05)"}}
                                whileTap={{scale: 0.98}}
                            >
                                <motion.div
                                    className="flex items-center"
                                    initial={false}
                                    animate={{
                                        y: activeView === "unassigned" ? [0, -2, 0] : 0
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        times: [0, 0.6, 1],
                                        ease: "easeInOut"
                                    }}
                                >
                                    <motion.div
                                        animate={{
                                            rotate: activeView === "unassigned" ? [0, -10, 0] : 0,
                                            scale: activeView === "unassigned" ? 1.1 : 1
                                        }}
                                        transition={{duration: 0.3}}
                                    >
                                        <CreditCard
                                            size={20}
                                            className={`mr-2 ${activeView === "unassigned" ? "text-green-500" : "text-gray-600"}`}
                                        />
                                    </motion.div>
                                    <span>Unassigned SIM Cards</span>
                                </motion.div>
                            </motion.button>

                            {/* Assigned Tab Button */}
                            <motion.button
                                className={`py-4 px-6 cursor-pointer flex-1 font-medium relative z-10 flex justify-center items-center ${
                                    activeView === "assigned" ? "text-green-600" : "text-gray-700"
                                }`}
                                onClick={() => setActiveView("assigned")}
                                whileHover={{backgroundColor: "rgba(16, 185, 129, 0.05)"}}
                                whileTap={{scale: 0.98}}
                            >
                                <motion.div
                                    className="flex items-center"
                                    initial={false}
                                    animate={{
                                        y: activeView === "assigned" ? [0, -2, 0] : 0
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        times: [0, 0.6, 1],
                                        ease: "easeInOut"
                                    }}
                                >
                                    <motion.div
                                        animate={{
                                            rotate: activeView === "assigned" ? [0, -10, 0] : 0,
                                            scale: activeView === "assigned" ? 1.1 : 1
                                        }}
                                        transition={{duration: 0.3}}
                                    >
                                        <Users
                                            size={20}
                                            className={`mr-2 ${activeView === "assigned" ? "text-green-600" : "text-gray-600"}`}
                                        />
                                    </motion.div>
                                    <span>Assigned SIM Cards</span>
                                </motion.div>
                            </motion.button>
                        </div>

                        {/* Add a subtle glowing effect for active tab */}
                        <motion.div
                            className="absolute bottom-0 w-1/2 h-8 bg-green-500 opacity-5 blur-md"
                            initial={false}
                            animate={{
                                left: activeView === "unassigned" ? "0%" : "50%"
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}
                        />
                    </motion.div>

                    {/* Unassigned View */}
                    {activeView === "unassigned" && (
                        <motion.div
                            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.3}}
                        >
                            <div className="mb-8 border-b pb-4">
                                <h2 className="text-2xl font-semibold mb-2 text-gray-800 flex items-center">
                                    <motion.div
                                        initial={{rotate: 0}}
                                        animate={{rotate: 360}}
                                        transition={{duration: 0.5, delay: 0.4}}
                                    >
                                        <CreditCard className="mr-3 text-green-600"/>
                                    </motion.div>
                                    SIM Card Assignment
                                </h2>
                                <p className="text-gray-500">Assign unallocated SIM cards to staff members</p>
                            </div>

                            {/* Selection Tabs */}
                            <div className="mb-8">
                                <div className="border-b border-gray-200 dark:border-gray-700">
                                    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                                        {[
                                            {mode: "individual", icon: <Check size={18} className="w-4 h-4 me-2"/>},
                                            {mode: "range", icon: <ArrowRight size={18} className="w-4 h-4 me-2"/>},
                                            {mode: "search", icon: <Search size={18} className="w-4 h-4 me-2"/>}
                                        ].map((item, index) => (
                                            <li key={item.mode} className="me-2">
                                                <a
                                                    href="#"
                                                    className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg ${
                                                        selectionMode === item.mode
                                                            ? "text-green-600 border-green-600 dark:text-green-500 dark:border-green-500"
                                                            : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                                                    }`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setSelectionMode(item.mode);
                                                        setActiveTabIndex(index);
                                                    }}
                                                >
                                                      <span
                                                          className={`w-4 h-4 me-2 ${
                                                              selectionMode === item.mode
                                                                  ? "text-green-600 dark:text-green-500"
                                                                  : "text-gray-400 hover:text-gray-500 dark:text-gray-500"
                                                          }`}
                                                      >
                                                        {item.icon}
                                                      </span>
                                                    {item.mode.charAt(0).toUpperCase() + item.mode.slice(1)} Selection
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Range Selection */}
                                <AnimatePresence mode="wait">
                                    {selectionMode === "range" && (
                                        <motion.div
                                            className="mb-6 bg-gray-50 p-6 rounded-lg"
                                            initial={{opacity: 0, height: 0}}
                                            animate={{opacity: 1, height: 'auto'}}
                                            exit={{opacity: 0, height: 0}}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1 relative">
                                                    <motion.div
                                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-600"
                                                        initial={{opacity: 0, x: -10}}
                                                        animate={{opacity: 1, x: 0}}
                                                        transition={{delay: 0.2}}
                                                    >
                                                        <CreditCard size={18}/>
                                                    </motion.div>
                                                    <input
                                                        type="text"
                                                        placeholder="Start Serial Number"
                                                        className="border rounded-lg pl-10 pr-4 py-3 flex-1 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                        value={rangeSelection.start}
                                                        onChange={(e) => setRangeSelection({
                                                            ...rangeSelection,
                                                            start: e.target.value
                                                        })}
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <motion.div animate={{x: [0, 5, 0]}}
                                                                transition={{repeat: Infinity, duration: 1.5}}>
                                                        <ArrowRight className="text-green-600"/>
                                                    </motion.div>
                                                </div>
                                                <div className="flex-1 relative">
                                                    <motion.div
                                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-600"
                                                        initial={{opacity: 0, x: -10}}
                                                        animate={{opacity: 1, x: 0}}
                                                        transition={{delay: 0.3}}
                                                    >
                                                        <CreditCard size={18}/>
                                                    </motion.div>
                                                    <input
                                                        type="text"
                                                        placeholder="End Serial Number"
                                                        className="border rounded-lg pl-10 pr-4 py-3 flex-1 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                        value={rangeSelection.end}
                                                        onChange={(e) => setRangeSelection({
                                                            ...rangeSelection,
                                                            end: e.target.value
                                                        })}
                                                    />
                                                </div>
                                                <motion.button
                                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                                                    onClick={selectSimsByRange}
                                                    whileHover={{scale: 1.05}}
                                                    whileTap={{scale: 0.95}}
                                                >
                                                    <Plus size={18} className="mr-2"/>
                                                    Select Range
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Search Selection */}
                                    {selectionMode === "search" && (
                                        <motion.div
                                            className="mb-6 bg-gray-50 p-6 rounded-lg"
                                            initial={{opacity: 0, height: 0}}
                                            animate={{opacity: 1, height: 'auto'}}
                                            exit={{opacity: 0, height: 0}}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="relative flex-1">
                                                    <motion.div
                                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-600"
                                                        initial={{opacity: 0}}
                                                        animate={{opacity: 1}}
                                                    >
                                                        <Search size={18}/>
                                                    </motion.div>
                                                    <input
                                                        type="text"
                                                        placeholder="Search by serial number..."
                                                        className="border rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                                <motion.button
                                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                                                    onClick={selectSimsBySearch}
                                                    whileHover={{scale: 1.05}}
                                                    whileTap={{scale: 0.95}}
                                                >
                                                    <Plus size={18} className="mr-2"/>
                                                    Select Matching
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Staff Selection */}
                                <motion.div
                                    className="mb-6 bg-gray-50 p-6 rounded-lg"
                                    initial={{opacity: 0, y: 20}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: 0.4}}
                                >
                                    <div
                                        className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                                        <div className="flex items-center space-x-3 text-gray-700 whitespace-nowrap">
                                            <User size={18} className="text-green-600"/>
                                            <span className="font-medium">Assign To:</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <select
                                                className="border rounded-lg px-4 py-3 w-full appearance-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                value={
                                                    //@ts-ignore
                                                    selectedStaff || ""}
                                                onChange={
                                                    //@ts-ignore
                                                    (e) => setSelectedStaff(e.target.value)}
                                            >
                                                <option value="">-- Select Staff Member --</option>
                                                {staffMembers.map(staff => (
                                                    <option key={staff.id} value={staff.id}>
                                                        {staff.full_name || staff.email}
                                                    </option>
                                                ))}
                                            </select>
                                            <div
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                                <ChevronDown size={18}/>
                                            </div>
                                        </div>
                                        <motion.button
                                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center md:whitespace-nowrap"
                                            disabled={isAssigning || !selectedStaff || selectedSims.length === 0}
                                            onClick={assignSimsToStaff}
                                            whileHover={{scale: isAssigning || !selectedStaff || selectedSims.length === 0 ? 1 : 1.05}}
                                            whileTap={{scale: isAssigning || !selectedStaff || selectedSims.length === 0 ? 1 : 0.95}}
                                        >
                                            {isAssigning ? (
                                                <>
                                                    <Loader2 size={18} className="mr-2 animate-spin"/>
                                                    Assigning...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={18} className="mr-2"/>
                                                    Assign ({selectedSims.length})
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </motion.div>

                                {/* Selection Actions */}
                                <AnimatePresence>
                                    {selectedSims.length > 0 && (
                                        <motion.div
                                            className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center"
                                            initial={{opacity: 0, y: -10}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -10}}
                                        >
                                            <div className="flex items-center">
                                                <motion.div
                                                    className="bg-green-100 text-green-800 rounded-full h-8 w-8 flex items-center justify-center mr-3"
                                                    initial={{scale: 0}}
                                                    animate={{scale: 1}}
                                                    transition={{type: "spring", stiffness: 500}}
                                                >
                                                    <Check size={16}/>
                                                </motion.div>
                                                <span className="text-green-800">
                          <strong>{selectedSims.length}</strong> SIM card{selectedSims.length !== 1 && 's'} selected
                        </span>
                                            </div>
                                            <motion.button
                                                className="text-green-800 hover:text-green-700 flex items-center"
                                                onClick={clearSelections}
                                                whileHover={{scale: 1.05}}
                                                whileTap={{scale: 0.95}}
                                            >
                                                <X size={16} className="mr-1"/> Clear selection
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* SIM Card List */}
                            <motion.div
                                className="border rounded-lg overflow-hidden shadow-sm"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div
                                    className="grid grid-cols-12 bg-gradient-to-r from-gray-50 to-gray-100 font-medium border-b">
                                    {selectionMode === "individual" && (
                                        <div className="col-span-1 p-4 text-center">Select</div>
                                    )}
                                    <div
                                        className={`${selectionMode === "individual" ? 'col-span-11' : 'col-span-12'} p-4`}>
                                        Serial Number
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                                        <motion.div
                                            animate={{rotate: 360}}
                                            transition={{duration: 1.5, repeat: Infinity, ease: "linear"}}
                                        >
                                            <Loader2 size={48} className="text-green-600 mb-4"/>
                                        </motion.div>
                                        <p>Loading SIM cards...</p>
                                    </div>
                                ) : filteredSims.length === 0 ? (
                                    <motion.div
                                        className="p-16 text-center text-gray-500 flex flex-col items-center"
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                    >
                                        <FileText size={48} className="text-gray-400 mb-4"/>
                                        <p>No SIM cards found</p>
                                        {searchQuery && (
                                            <p className="mt-2 text-sm">Try adjusting your search query</p>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {filteredSims.map((sim, index) => (
                                            <motion.div
                                                key={sim.id}
                                                className={`grid grid-cols-12 border-b hover:bg-gray-50 transition-colors ${

                                                    selectedSims.includes(sim.id) ? "bg-green-50" : ""
                                                }`}
                                                variants={itemVariants}
                                                initial={{opacity: 0, y: 10}}
                                                animate={{opacity: 1, y: 0}}
                                                transition={{delay: 0.03 * index, duration: 0.2}}
                                                whileHover={{backgroundColor: selectedSims.includes(sim.id) ? "#e0f2f1" : "#f5f5f5"}}
                                            >
                                                {selectionMode === "individual" && (
                                                    <div className="col-span-1 p-4 flex justify-center items-center">
                                                        <motion.button
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                                selectedSims.includes(sim.id)
                                                                    ? "bg-green-600 text-white"
                                                                    : "border-2 border-gray-300"
                                                            }`}
                                                            onClick={() => toggleSimSelection(sim.id)}
                                                            whileHover={{scale: 1.1}}
                                                            whileTap={{scale: 0.9}}
                                                        >
                                                            {selectedSims.includes(sim.id) && <Check size={14}/>}
                                                        </motion.button>
                                                    </div>
                                                )}
                                                <div
                                                    className={`${selectionMode === "individual" ? 'col-span-11' : 'col-span-12'} p-4 flex items-center`}
                                                    onClick={() => selectionMode !== "individual" && toggleSimSelection(sim.id)}
                                                >
                                                    <motion.div
                                                        className="flex items-center cursor-pointer"
                                                        whileHover={{x: 5}}
                                                    >
                                                        <CreditCard size={16} className="text-gray-500 mr-3"/>
                                                        <span>{sim.serial_number}</span>

                                                        {selectedSims.includes(sim.id) && selectionMode !== "individual" && (
                                                            <motion.div
                                                                className="ml-3 bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs flex items-center"
                                                                {...badgeVariants}
                                                            >
                                                                <Check size={12} className="mr-1"/> Selected
                                                            </motion.div>
                                                        )}
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Assigned View */}
                    {activeView === "assigned" && (
                        <motion.div
                            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.3}}
                        >
                            <div className="mb-8 border-b pb-4">
                                <h2 className="text-2xl font-semibold mb-2 text-gray-800 flex items-center">
                                    <motion.div
                                        initial={{rotate: 0}}
                                        animate={{rotate: 360}}
                                        transition={{duration: 0.5, delay: 0.4}}
                                    >
                                        <Users className="mr-3 text-green-600"/>
                                    </motion.div>
                                    Assigned SIM Cards
                                </h2>
                                <p className="text-gray-500">View SIM cards assigned to staff members</p>
                            </div>

                            {/* Date Filter */}
                            <motion.div
                                className="mb-6 p-6 bg-gray-50 rounded-lg"
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.4}}
                            >
                                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0">
                                    <div className="flex items-center mr-4 whitespace-nowrap">
                                        <Calendar size={18} className="text-green-600 mr-2"/>
                                        <span className="font-medium text-gray-700">Date Range:</span>
                                    </div>
                                    <div
                                        className="flex-1 flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="date"
                                                className="border rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                value={dateFilter.start}
                                                onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                                            />
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <motion.div animate={{x: [0, 5, 0]}}
                                                        transition={{repeat: Infinity, duration: 1.5}}>
                                                <ArrowRight className="text-green-600"/>
                                            </motion.div>
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                type="date"
                                                className="border rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                value={dateFilter.end}
                                                onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                                            />
                                        </div>
                                        <motion.button
                                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center whitespace-nowrap"
                                            onClick={fetchData}
                                            whileHover={{scale: 1.05}}
                                            whileTap={{scale: 0.95}}
                                        >
                                            <Filter size={18} className="mr-2"/>
                                            Apply Filter
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Search Filter */}
                            <motion.div
                                className="mb-6"
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.5}}
                            >
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="text-gray-400" size={18}/>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by serial number or staff name..."
                                        className="border rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </motion.div>

                            {/* Staff Members with SIM Cards */}
                            {isLoading ? (
                                <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                                    <motion.div
                                        animate={{rotate: 360}}
                                        transition={{duration: 1.5, repeat: Infinity, ease: "linear"}}
                                    >
                                        <Loader2 size={48} className="text-green-600 mb-4"/>
                                    </motion.div>
                                    <p>Loading assigned SIM cards...</p>
                                </div>
                            ) : (
                                <motion.div
                                    className="space-y-4"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {staffMembers
                                        //@ts-ignore
                                        .filter(staff => staffSimCounts[staff.id] > 0)
                                        .map((staff, index) => (
                                            <motion.div
                                                key={staff.id}
                                                className="border rounded-lg overflow-hidden shadow-sm bg-white"
                                                variants={itemVariants}
                                            >
                                                <motion.div
                                                    className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 flex justify-between items-center cursor-pointer"
                                                    onClick={() => toggleStaffExpand(staff.id)}
                                                    whileHover={{backgroundColor: "#f5f7fa"}}
                                                >
                                                    <div className="flex items-center">
                                                        <motion.div
                                                            className="bg-green-100 text-green-600 p-2 rounded-full mr-3"
                                                            whileHover={{scale: 1.1}}
                                                            whileTap={{scale: 0.9}}
                                                        >
                                                            <User size={20}/>
                                                        </motion.div>
                                                        <span className="font-medium">{staff.full_name || staff.email}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <motion.div
                                                            className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm mr-3 flex items-center"
                                                            {...badgeVariants}
                                                        >
                                                            <CreditCard size={14} className="mr-1"/>

                                                            {
                                                                //@ts-ignore
                                                                staffSimCounts[staff.id] || 0} SIM cards
                                                        </motion.div>
                                                        <motion.div
                                                            animate={{
                                                                rotate: expandedStaff === staff.id ? 90 : 0
                                                            }}
                                                            transition={{duration: 0.3}}
                                                        >
                                                            <ChevronRight size={20} className="text-gray-400"/>
                                                        </motion.div>
                                                    </div>
                                                </motion.div>

                                                <AnimatePresence>
                                                    {expandedStaff === staff.id && (
                                                        <motion.div
                                                            initial={{height: 0, opacity: 0}}
                                                            animate={{height: "auto", opacity: 1}}
                                                            exit={{height: 0, opacity: 0}}
                                                            transition={{duration: 0.3}}
                                                        >
                                                            <div className="border-t">
                                                                <div
                                                                    className="grid grid-cols-12 bg-gradient-to-r from-gray-50 to-gray-100 font-medium border-b">
                                                                    <div className="col-span-8 p-3 flex items-center">
                                                                        <CreditCard size={16}
                                                                                    className="text-green-600 mr-2"/>
                                                                        Serial Number
                                                                    </div>
                                                                    <div className="col-span-4 p-3 flex items-center">
                                                                        <Settings size={16}
                                                                                  className="text-green-600 mr-2"/>
                                                                        Status
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className="max-h-72 overflow-y-auto custom-scrollbar">
                                                                    {simCards
                                                                        .filter(sim => sim.sold_by_user_id === staff.id)
                                                                        .filter(sim => !searchQuery || sim.serial_number.includes(searchQuery))
                                                                        .map((sim, idx) => (
                                                                            <motion.div
                                                                                key={sim.id}
                                                                                className="grid grid-cols-12 border-b hover:bg-gray-50 transition-colors"
                                                                                initial={{opacity: 0, x: -10}}
                                                                                animate={{opacity: 1, x: 0}}
                                                                                transition={{delay: 0.05 * idx}}
                                                                            >
                                                                                <div
                                                                                    className="col-span-8 p-3 flex items-center">
                                                                                    <motion.div
                                                                                        className="flex items-center"
                                                                                        whileHover={{x: 5}}
                                                                                    >
                                                                                        <CreditCard size={16}
                                                                                                    className="text-gray-500 mr-3"/>
                                                                                        {sim.serial_number}
                                                                                    </motion.div>
                                                                                </div>
                                                                                <div className="col-span-4 p-3">
                                                                                    <motion.span
                                                                                        className={`rounded-full px-3 py-1 text-sm inline-flex items-center ${
                                                                                            sim.status === SIMStatus.SOLD
                                                                                                ? "bg-green-100 text-green-800"
                                                                                                : sim.status === SIMStatus.ACTIVE
                                                                                                    ? "bg-blue-100 text-blue-800"
                                                                                                    : sim.status === SIMStatus.PENDING
                                                                                                        ? "bg-yellow-100 text-yellow-800"
                                                                                                        : "bg-gray-100 text-gray-800"
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
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}

                                    {//@ts-ignore
                                        staffMembers.filter(staff => staffSimCounts[staff.id] > 0).length === 0 && (
                                        <motion.div
                                            className="p-16 text-center text-gray-500 border rounded-lg flex flex-col items-center"
                                            initial={{opacity: 0}}
                                            animate={{opacity: 1}}
                                        >
                                            <FileText size={48} className="text-gray-400 mb-4"/>
                                            <p>No assigned SIM cards found for the selected date range</p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Add custom CSS for the scrollbar */}
                    <style jsx global>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 8px;
                            height: 8px;
                        }

                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: #f1f1f1;
                            border-radius: 10px;
                        }

                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #c5e0c5;
                            border-radius: 10px;
                        }

                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #4ade80;
                        }
                    `}</style>
                </div>
            </Dashboard>
        </MotionConfig>
    );
}