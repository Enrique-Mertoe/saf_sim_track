"use client"
import {useState, useEffect} from "react";
import {AnimatePresence, motion} from "framer-motion";
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
import SerialList from "@/app/dashboard/leader-console/components/SerialList";
import {itemVariants} from "@/app/dashboard/leader-console/components/Design";
import {now} from "@/helper";

// Enums
const SIMStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    PENDING: "PENDING",
    SOLD: "SOLD",
};

const supabase = createSupabaseClient();

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
    const [showStats, setShowStats] = useState(true);

    // Card statistics
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
                .update({sold_by_user_id: selectedStaff, assigned_on: now()})
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
        <Dashboard>
            {/*<Screentester/>*/}
            {/* Header with stats */}
            <motion.div
                className="bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-700 dark:to-emerald-600 text-white p-8 relative overflow-hidden"
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.1}}
            >
                {/* Animated circles in background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div
                        className="absolute w-40 h-40 rounded-full bg-white opacity-5 dark:opacity-10 -top-10 -right-10"></div>
                    <div
                        className="absolute w-60 h-60 rounded-full bg-white opacity-5 dark:opacity-10 -bottom-20 -left-20"></div>
                    <motion.div
                        className="absolute w-20 h-20 rounded-full bg-white opacity-10 dark:opacity-15"
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
                        <h1 className="text-3xl font-bold flex items-center text-white">
                            <Smartphone className="mr-3"/>
                            SIM Card Management
                        </h1>
                        <motion.button
                            className="bg-white/20 hover:bg-white/30 dark:bg-white/15 dark:hover:bg-white/25 text-white rounded-full p-2 backdrop-blur-sm"
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
                                    className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 flex items-center"
                                    variants={itemVariants}
                                >
                                    <div className="rounded-full bg-white/20 dark:bg-white/15 p-3 mr-3">
                                        <CreditCard size={24}/>
                                    </div>
                                    <div>
                                        <p className="text-sm opacity-80 dark:opacity-70">Total SIM Cards</p>
                                        <p className="text-2xl font-bold">{stats.totalCards}</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 flex items-center"
                                    variants={itemVariants}
                                >
                                    <div className="rounded-full bg-white/20 dark:bg-white/15 p-3 mr-3">
                                        <CheckCircle size={24}/>
                                    </div>
                                    <div>
                                        <p className="text-sm opacity-80 dark:opacity-70">Assigned Cards</p>
                                        <p className="text-2xl font-bold">{stats.assignedCards}</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 flex items-center"
                                    variants={itemVariants}
                                >
                                    <div className="rounded-full bg-white/20 dark:bg-white/15 p-3 mr-3">
                                        <AlertTriangle size={24}/>
                                    </div>
                                    <div>
                                        <p className="text-sm opacity-80 dark:opacity-70">Unassigned Cards</p>
                                        <p className="text-2xl font-bold">{stats.unassignedCards}</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 flex items-center"
                                    variants={itemVariants}
                                >
                                    <div className="rounded-full bg-white/20 dark:bg-white/15 p-3 mr-3">
                                        <Zap size={24}/>
                                    </div>
                                    <div>
                                        <p className="text-sm opacity-80 dark:opacity-70">Recent Assignments</p>
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
            <div className="container mx-auto p-4 pb-16 dark:bg-gray-900">
                {/* View Toggle - Tabs */}
                <div
                    className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative border border-gray-200 dark:border-gray-700">
                    <div className="flex relative">
                        {/* Indicator bar */}
                        <div
                            className={`absolute h-[2px] bottom-0 bg-green-600 dark:bg-green-500 rounded-t ${
                                activeView === "unassigned" ? "left-0 w-1/2" : "left-1/2 w-1/2"
                            }`}
                        />

                        {/* Unassigned Tab Button */}
                        <button
                            className={`py-4 cursor-pointer px-6 flex-1 font-medium relative z-10 flex justify-center items-center ${
                                activeView === "unassigned" ? "text-green-600 dark:text-green-500" : "text-gray-700 dark:text-gray-300"
                            }`}
                            onClick={() => setActiveView("unassigned")}
                        >
                            <div className="flex items-center">
                                <CreditCard
                                    size={18}
                                    className={`mr-2 ${activeView === "unassigned" ? "text-green-600 dark:text-green-500" : "text-gray-600 dark:text-gray-400"}`}
                                />
                                <span>Unassigned SIM Cards</span>
                            </div>
                        </button>

                        {/* Assigned Tab Button */}
                        <button
                            className={`py-4 px-6 cursor-pointer flex-1 font-medium relative z-10 flex justify-center items-center ${
                                activeView === "assigned" ? "text-green-600 dark:text-green-500" : "text-gray-700 dark:text-gray-300"
                            }`}
                            onClick={() => setActiveView("assigned")}
                        >
                            <div className="flex items-center">
                                <Users
                                    size={18}
                                    className={`mr-2 ${activeView === "assigned" ? "text-green-600 dark:text-green-500" : "text-gray-600 dark:text-gray-400"}`}
                                />
                                <span>Assigned SIM Cards</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Unassigned View */}
                {activeView === "unassigned" && (
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.3}}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <div className="mb-6 border-b dark:border-gray-700 pb-4">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center">
                                <CreditCard className="mr-3 text-green-600 dark:text-green-500"/>
                                SIM Card Assignment
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">Assign unallocated SIM cards to staff
                                members</p>
                        </div>

                        {/* Selection Tabs */}
                        <div className="mb-6">
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                                    {[
                                        {mode: "individual", icon: <Check size={16} className="w-4 h-4 me-2"/>},
                                        {mode: "range", icon: <ArrowRight size={16} className="w-4 h-4 me-2"/>},
                                        {mode: "search", icon: <Search size={16} className="w-4 h-4 me-2"/>}
                                    ].map((item, index) => (
                                        <li key={item.mode} className="me-2">
                                            <a
                                                href="#"
                                                className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg ${
                                                    selectionMode === item.mode
                                                        ? "text-green-600 dark:text-green-500 border-green-600 dark:border-green-500"
                                                        : "border-transparent hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
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
                                                            : "text-gray-400 dark:text-gray-500"
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
                            {selectionMode === "range" && (
                                <div className="mb-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mt-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1 relative">
                                            <div
                                                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-600 dark:text-green-500">
                                                <CreditCard size={18}/>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Start Serial Number"
                                                className="border dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 flex-1 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-200"
                                                value={rangeSelection.start}
                                                onChange={(e) => setRangeSelection({
                                                    ...rangeSelection,
                                                    start: e.target.value
                                                })}
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <ArrowRight className="text-green-600 dark:text-green-500"/>
                                        </div>
                                        <div className="flex-1 relative">
                                            <div
                                                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-600 dark:text-green-500">
                                                <CreditCard size={18}/>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="End Serial Number"
                                                className="border dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 flex-1 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-200"
                                                value={rangeSelection.end}
                                                onChange={(e) => setRangeSelection({
                                                    ...rangeSelection,
                                                    end: e.target.value
                                                })}
                                            />
                                        </div>
                                        <button
                                            className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center"
                                            onClick={selectSimsByRange}
                                        >
                                            <Plus size={16} className="mr-2"/>
                                            Select Range
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Search Selection */}
                            {selectionMode === "search" && (
                                <div className="mb-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mt-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative flex-1">
                                            <div
                                                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-600 dark:text-green-500">
                                                <Search size={18}/>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search by serial number..."
                                                className="border dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-200"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center"
                                            onClick={selectSimsBySearch}
                                        >
                                            <Plus size={16} className="mr-2"/>
                                            Select Matching
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Staff Selection */}
                            <div className="mb-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mt-4">
                                <div
                                    className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                                    <div
                                        className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                        <User size={16} className="text-green-600 dark:text-green-500"/>
                                        <span className="font-medium">Assign To:</span>
                                    </div>
                                    <div className="relative flex-1">
                                        <select
                                            className="border dark:border-gray-700 rounded-lg px-4 py-2 w-full appearance-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-200"
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
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">
                                            <ChevronDown size={16}/>
                                        </div>
                                    </div>
                                    <button
                                        className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center md:whitespace-nowrap"
                                        disabled={isAssigning || !selectedStaff || selectedSims.length === 0}
                                        onClick={assignSimsToStaff}
                                    >
                                        {isAssigning ? (
                                            <>
                                                <Loader2 size={16} className="mr-2 animate-spin"/>
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} className="mr-2"/>
                                                Assign ({selectedSims.length})
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Selection Actions */}
                            {selectedSims.length > 0 && (
                                <div
                                    className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div
                                            className="bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300 rounded-full h-7 w-7 flex items-center justify-center mr-3">
                                            <Check size={14}/>
                                        </div>
                                        <span className="text-green-800 dark:text-green-300">
                                          <strong>{selectedSims.length}</strong> SIM card{selectedSims.length !== 1 && 's'} selected
                                        </span>
                                    </div>
                                    <button
                                        className="text-green-800 dark:text-green-300 hover:text-green-700 dark:hover:text-green-400 flex items-center"
                                        onClick={clearSelections}
                                    >
                                        <X size={14} className="mr-1"/> Clear selection
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* SIM Card List */}
                        <div className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                            <div
                                className="grid grid-cols-12 bg-gray-50 dark:bg-gray-900 font-medium border-b dark:border-gray-700">
                                {selectionMode === "individual" && (
                                    <div className="col-span-1 p-3 text-center dark:text-gray-300">Select</div>
                                )}
                                <div
                                    className={`${selectionMode === "individual" ? 'col-span-11' : 'col-span-12'} p-3 dark:text-gray-300`}>
                                    Serial Number
                                </div>
                            </div>

                            {isLoading ? (
                                <div
                                    className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                    <Loader2 size={40}
                                             className="text-green-600 dark:text-green-500 mb-4 animate-spin"/>
                                    <p>Loading SIM cards...</p>
                                </div>
                            ) : filteredSims.length === 0 ? (
                                <div
                                    className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                    <FileText size={40} className="text-gray-400 dark:text-gray-500 mb-4"/>
                                    <p>No SIM cards found</p>
                                    {searchQuery && (
                                        <p className="mt-2 text-sm">Try adjusting your search query</p>
                                    )}
                                </div>
                            ) : (
                                <SerialList filteredSims={filteredSims} selectionMode={selectionMode}
                                            selectedSims={selectedSims} toggleSimSelection={toggleSimSelection}/>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Assigned View */}
                {activeView === "assigned" && (
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.3}}
                    >
                        <div className="mb-8 border-b dark:border-gray-700 pb-4">
                            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center">
                                <motion.div
                                    initial={{rotate: 0}}
                                    animate={{rotate: 360}}
                                    transition={{duration: 0.5, delay: 0.4}}
                                >
                                    <Users className="mr-3 text-green-600 dark:text-green-500"/>
                                </motion.div>
                                Assigned SIM Cards
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">View SIM cards assigned to staff members</p>
                        </div>

                        {/* Date Filter */}
                        <motion.div
                            className="mb-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.4}}
                        >
                            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0">
                                <div className="flex items-center mr-4 whitespace-nowrap">
                                    <Calendar size={18} className="text-green-600 dark:text-green-500 mr-2"/>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
                                </div>
                                <div
                                    className="flex-1 flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="date"
                                            className="border dark:border-gray-700 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all dark:bg-gray-800 dark:text-gray-200"
                                            value={dateFilter.start}
                                            onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <motion.div animate={{x: [0, 5, 0]}}
                                                    transition={{repeat: Infinity, duration: 1.5}}>
                                            <ArrowRight className="text-green-600 dark:text-green-500"/>
                                        </motion.div>
                                    </div>
                                    <div className="relative flex-1">
                                        <input
                                            type="date"
                                            className="border dark:border-gray-700 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all dark:bg-gray-800 dark:text-gray-200"
                                            value={dateFilter.end}
                                            onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                                        />
                                    </div>
                                    <motion.button
                                        className="bg-green-600 dark:bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center whitespace-nowrap"
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
                                    className="border dark:border-gray-700 rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all dark:bg-gray-800 dark:text-gray-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        {/* Staff Members with SIM Cards */}
                        {isLoading ? (
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
                                    //@ts-ignore
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
                                                        // exit={{height: 0, opacity: 0}}
                                                        // transition={{duration: 0.3}}
                                                    >
                                                        <div className="border-t dark:border-gray-700">
                                                            <div
                                                                className="grid grid-cols-12 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 font-medium border-b dark:border-gray-700">
                                                                <div
                                                                    className="col-span-8 p-3 flex items-center dark:text-gray-300">
                                                                    <CreditCard size={16}
                                                                                className="text-green-600 dark:text-green-500 mr-2"/>
                                                                    Serial Number
                                                                </div>
                                                                <div
                                                                    className="col-span-4 p-3 flex items-center dark:text-gray-300">
                                                                    <Settings size={16}
                                                                              className="text-green-600 dark:text-green-500 mr-2"/>
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
                                                                            className="grid grid-cols-12 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                                            initial={{opacity: 0, x: -10}}
                                                                            animate={{opacity: 1, x: 0}}
                                                                            transition={{delay: 0.05 * idx}}
                                                                        >
                                                                            <div
                                                                                className="col-span-8 p-3 flex items-center dark:text-gray-300">
                                                                                <motion.div
                                                                                    className="flex items-center"
                                                                                    whileHover={{x: 5}}
                                                                                >
                                                                                    <CreditCard size={16}
                                                                                                className="text-gray-500 dark:text-gray-400 mr-3"/>
                                                                                    {sim.serial_number}
                                                                                </motion.div>
                                                                            </div>
                                                                            <div className="col-span-4 p-3">
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
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </>
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

            </div>
        </Dashboard>

    );
}