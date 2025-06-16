"use client"
import React, {useEffect, useMemo, useState} from 'react';
import {AlertTriangle, Calendar, CheckCircle2, Clock, Phone, Search, TrendingUp, UserCheck, Users} from 'lucide-react';
import {useSupabaseSignal} from "@/lib/supabase/event";
import {teamService, userService} from "@/services";
import useApp from "@/ui/provider/AppProvider";
import {SIMStatus} from "@/models";
import simService from "@/services/simService";
import Dashboard from "@/ui/components/dash/Dashboard";
import {motion} from "framer-motion";
import {formatDate, isSameDay} from "@/helper";
import {showModal} from "@/ui/shortcuts";
import AssignSimCard from "@/app/dashboard/dh/AssignSimCard";
import UnassignSimCard from "@/app/dashboard/dh/UnassignSimCard";
import TransferSimCard from "@/app/dashboard/dh/TransferSimCard";
import SimCardGrid from "@/app/dashboard/dh/SimCardGrid";
import {TeamLeaderStatCard} from "@/app/dashboard/dh/TeamLeaderStatCard";
import MaterialSelect from "@/ui/components/MaterialSelect";
import Fixed from "@/ui/components/Fixed";
import {useDimensions} from "@/ui/library/smv-ui/src/framework/utility/Screen";

// Helper function to compare dates by day only (ignoring time)


const TeamLeaderDashboardView = () => {
    const {user} = useApp();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStaff, setSelectedStaff] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const dimen = useDimensions()
    // State for real data
    const [simCards, setSimCards] = useState([]);
    const [teamStaff, setTeamStaff] = useState([]);
    const [teamData, setTeamData] = useState(null);

    function add(cards) {
        setSimCards(cards)
        setSimCards(cards)
    }

    // Setup Supabase realtime for SIM cards
    const simCardSignal = useSupabaseSignal('sim_cards', {autoConnect: true});


    // Fetch team data and staff
    useEffect(() => {
        const fetchTeamData = async () => {
            if (!user || !user.team_id) return;

            try {
                setIsLoading(true);
                // Get team info
                const {data: teamInfo, error: teamError} = await teamService.getTeamById(user.team_id);
                if (teamError) throw teamError;
                setTeamData(teamInfo);

                // Get team hierarchy to get staff members
                // const {data: hierarchy, error: hierarchyError} = await teamService.getTeamHierarchy(user.team_id);
                const {data: staff, error: hierarchyError} = await userService.getStaffUsers(user.team_id, user)
                if (hierarchyError) throw hierarchyError;

                // Extract staff members from hierarchy
                if (staff && staff.length > 0) {
                    // const staffMembers = hierarchy[0].members || [];
                    setTeamStaff(staff.map(member => ({
                        id: member.id,
                        name: member.full_name,
                        role: member.role,
                        phone: member.phone_number
                    })));
                }
            } catch (error) {
                console.error('Error fetching team data:', error);
                setError('Failed to load team data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeamData().then();
    }, [user]);

    // Fetch SIM cards data
    useEffect(() => {
        async function fetchSimCards() {
            if (!user || !user.team_id) return;

            try {
                setIsLoading(true);
                const data = await simService.getSIMCardsByTeamId(user.team_id, user);
                add(data)
            } catch {
                console.error('Error fetching team data:', error);
                setError('Failed to load team data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchSimCards().then();
    }, [user]);
    // Setup realtime updates for SIM cards
    useEffect(() => {
        if (!simCardSignal || !user || !user.team_id) return;

        // Handle new SIM cards
        const handleInsert = (payload) => {
            if (payload.new && payload.new.team_id === user.team_id) {
                const newSim = {
                    id: payload.new.id,
                    serial_number: payload.new.serial_number,
                    status: payload.new.status,
                    assignedTo: payload.new.assigned_to_name || '',
                    assigned_to_user_id: payload.new.assigned_to_user_id || '',
                    registered_on: payload.new.registered_on ? payload.new.registered_on.split('T')[0] : '',
                    registeredBy: payload.new.registered_by_name || '',
                    customerName: payload.new.customer_name || '',
                    customerPhone: payload.new.customer_phone || '',
                    location: payload.new.location || '',
                    assigned_on: payload.new.assigned_on ? payload.new.assigned_on.split('T')[0] : ''
                };

                add(prev => [newSim, ...prev]);
            }
        };

        // Handle updated SIM cards
        const handleUpdate = (payload) => {
            if (payload.new && payload.new.team_id === user.team_id) {
                const updatedSim = {
                    id: payload.new.id,
                    serial_number: payload.new.serial_number,
                    status: payload.new.status,
                    assignedTo: payload.new.assigned_to_name || '',
                    assigned_to_user_id: payload.new.assigned_to_user_id || '',
                    registered_on: payload.new.registered_on ? payload.new.registered_on.split('T')[0] : '',
                    registeredBy: payload.new.registered_by_name || '',
                    customerName: payload.new.customer_name || '',
                    customerPhone: payload.new.customer_phone || '',
                    location: payload.new.location || '',
                    assigned_on: payload.new.assigned_on ? payload.new.assigned_on.split('T')[0] : ''
                };

                add(prev =>
                    prev.map(sim => sim.id === updatedSim.id ? updatedSim : sim)
                );

            }
        };

        // Handle deleted SIM cards
        const handleDelete = (payload) => {
            if (payload.old && payload.old.id) {
                add(prev =>
                    prev.filter(sim => sim.id !== payload.old.id)
                );
            }
        };

        // Subscribe to events
        simCardSignal.onInsert(handleInsert);
        simCardSignal.onUpdate(handleUpdate);
        simCardSignal.onDelete(handleDelete);

        // Cleanup
        return () => {
            simCardSignal.off('INSERT', handleInsert);
            simCardSignal.off('UPDATE', handleUpdate);
            simCardSignal.off('DELETE', handleDelete);
        };
    }, [simCardSignal, user]);

    // Helper function to filter SIM cards based on criteria
    const filterSimCards = (cards, criteria) => {
        const {status, dateFilter, staffFilter, searchFilter} = criteria;

        return cards.filter(sim => {
            // Apply date filter
            let matchesDateFilter = true;

            if (dateFilter === 'daily') {
                matchesDateFilter = isSameDay(sim.registered_on, selectedDate);
            } else if (dateFilter === 'weekly') {
                const weekStart = new Date(selectedDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                if (sim.registered_on) {
                    const regDate = new Date(sim.registered_on);
                    matchesDateFilter = regDate >= weekStart && regDate <= weekEnd;
                } else {
                    matchesDateFilter = false;
                }
            }

            // Apply staff filter
            const matchesStaffFilter = staffFilter === 'all' || sim.assigned_to_user_id === staffFilter;

            // Apply search filter
            const matchesSearchFilter = !searchFilter ||
                sim.serial_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
                (sim.customerName && sim.customerName.toLowerCase().includes(searchFilter.toLowerCase()));

            // Apply status filter if provided
            const matchesStatusFilter = !status || sim.status === status;

            return matchesDateFilter && matchesStaffFilter && matchesSearchFilter && matchesStatusFilter;
        });
    };

    // Calculate statistics
    const stats = useMemo(() => {
        if (!simCards.length) {
            return {
                totalAllocated: 0,
                registered: 0,
                assigned: 0,
                unassigned: 0,
                dailyRegistered: 0,
                registrationRate: 0
            };
        }

        const totalAllocated = simCards.length;
        const registered = simCards.filter(sim => sim.status === SIMStatus.REGISTERED).length;
        const assigned = simCards.filter(sim => sim.status === SIMStatus.ASSIGNED || sim.assigned_to_user_id != null).length;
        const unassigned = totalAllocated - assigned

        const dailyRegistered = filterSimCards(simCards, {
            status: SIMStatus.REGISTERED,
            dateFilter: 'daily',
            staffFilter: 'all',  // Include all staff
            searchFilter: ''  // No search filter for stats
        }).length;

        return {
            totalAllocated,
            registered,
            assigned,
            unassigned,
            dailyRegistered,
            registrationRate: totalAllocated > 0 ? ((registered / totalAllocated) * 100).toFixed(1) : 0
        };
    }, [simCards, selectedDate]);


    const formattedDate = (new Date()).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    return (
        <>
            <div className="min-h-screen bg-gray-50 pb-20 dark:bg-gray-900 md:py-6 p-1">
                <div className="max-w-7xl  mx-auto">
                    <motion.div
                        className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-800 dark:from-green-700 dark:to-green-900 rounded-xl p-2 mb-4 shadow-lg"
                        initial={{opacity: 0, scale: 0.96}}
                        animate={{opacity: 1, scale: 1}}
                        transition={{duration: 0.5}}
                    >
                        <div className="absolute inset-0 bg-grid-white/10 bg-grid-8"></div>
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row justify-between items-start">
                                <div>
                                    <p className="text-indigo-100 font-bold dark:text-indigo-200 mt-1">{formattedDate}</p>
                                    <h2 className="text-2xl font-bold text-white">Welcome <span
                                        className={"text-green-200"}>{user?.full_name}!</span></h2>
                                    <p className="text-indigo-100 dark:text-indigo-200 mt-1">Monitor daily SIM card
                                        sales
                                        and team performance</p>
                                </div>

                                {/* Team Info Card */}
                                <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 text-white">
                                    <h3 className="font-bold text-lg mb-1">{teamData?.name || 'Team'}</h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                        <div className="flex items-center">
                                            <span className="text-indigo-100">Region:</span>
                                            <span className="ml-1 font-medium">{teamData?.region || 'N/A'}</span>
                                        </div>
                                        {teamData?.territory && (
                                            <div className="flex items-center">
                                                <span className="text-indigo-100">Territory:</span>
                                                <span className="ml-1 font-medium">{teamData.territory}</span>
                                            </div>
                                        )}
                                        {teamData?.van_number_plate && (
                                            <div className="flex items-center">
                                                <span className="text-indigo-100">Van:</span>
                                                <span
                                                    className="ml-1 uppercase bg-yellow-500 rounded-sm  px-4 text-gray-700 font-medium">{teamData.van_number_plate}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <span className="text-indigo-100">Status:</span>
                                            <span
                                                className={`ml-1 font-medium ${teamData?.is_active ? 'text-green-300' : 'text-rose-300'}`}>
                                        {teamData?.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                        </div>
                                        <div className="flex items-center col-span-2">
                                            <span className="text-indigo-100">Since:</span>
                                            <span className="ml-1 font-medium">{formatDate(teamData?.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>


                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                        <TeamLeaderStatCard
                            title="Total Allocated"
                            subtitle="SIM cards received"
                            icon={Phone}
                            color="blue"
                            dataType={"total"}
                        />
                        <TeamLeaderStatCard
                            title="Registered Today"
                            subtitle={`Date: ${formatDate(selectedDate)}`}
                            icon={CheckCircle2}
                            color="green"
                            dataType={"registered-today"}
                        />
                        <TeamLeaderStatCard
                            title="Total Registered"
                            subtitle={`${stats.registrationRate}% of allocated`}
                            icon={TrendingUp}
                            dataType={"registered"}
                            color="purple"
                        />
                        <TeamLeaderStatCard
                            title="Unassigned"
                            subtitle="Available for assignment"
                            icon={AlertTriangle}
                            color="orange"
                            dataType={"unassigned"}
                        />
                    </div>
                    {/* Date and View Mode Controls */}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                {['daily', 'weekly', 'monthly'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            viewMode === mode
                                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                        }`}
                                    >
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                                <MaterialSelect options={teamStaff} onChange={v => setSelectedStaff(v)}
                                                placeholder={"Filter by team member"} className={"min-w-[260px]"}
                                                displayKey={"name"} valueKey={"id"}/>
                            </div>

                            {isLoading && (
                                <div className="ml-auto flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <div
                                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                    Refreshing data...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        {
                            dimen.md && (
                                <div className="border-b border-gray-200 dark:border-gray-700">
                                    <nav className="flex space-x-8 px-6">
                                        {[
                                            {id: 'overview', name: 'Daily Overview', icon: TrendingUp},
                                            {id: 'registered', name: 'Registered SIMs', icon: CheckCircle2},
                                            {id: 'assigned', name: 'Assigned SIMs', icon: UserCheck},
                                            {id: 'unassigned', name: 'Unassigned SIMs', icon: Clock}
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                                                    activeTab === tab.id
                                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <tab.icon className="w-4 h-4"/>
                                                {tab.name}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            )
                        }

                        <div className="">
                            {/* Search Bar */}
                            <div className="mb-6 px-6 pt-6 flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                    <input
                                        type="text"
                                        placeholder="Search by serial number..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6 pb-6 px-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Today's
                                                Registrations</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {filterSimCards(simCards, {
                                                    status: SIMStatus.REGISTERED,
                                                    dateFilter: 'daily',  // Always use daily for "Today's Registrations"
                                                    staffFilter: selectedStaff,
                                                    searchFilter: searchTerm
                                                }).map((sim) => (
                                                    <div key={sim.id}
                                                         className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex flex-col justify-between items-cesnter">
                                                            <p className="font-medium text-green-600 dark:text-green-400 text-sm">{sim.serial_number}</p>
                                                            <div className="text-right">
                                                                <p className="text-xs font-medium text-green-600 dark:text-green-400">{sim.registeredBy}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(sim.registered_on)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {filterSimCards(simCards, {
                                                    status: SIMStatus.REGISTERED,
                                                    dateFilter: 'daily',  // Always use daily for "Today's Registrations"
                                                    staffFilter: selectedStaff,
                                                    searchFilter: searchTerm
                                                }).length === 0 && (
                                                    <div
                                                        className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                                                        <Phone
                                                            className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"/>
                                                        <p>No registrations for the selected date</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Staff
                                                Performance Today</h3>
                                            <div className="space-y-2">
                                                {teamStaff.map(staff => {
                                                    const staffRegistrations = filterSimCards(simCards, {
                                                        status: SIMStatus.REGISTERED,
                                                        dateFilter: 'daily',  // Always use daily for staff performance
                                                        staffFilter: staff.id,  // Filter for this specific staff member
                                                        searchFilter: ''  // No search filter for staff performance
                                                    }).length;

                                                    return (
                                                        <div key={staff.id}
                                                             className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{staff.name}</p>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{staff.role}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{staffRegistrations}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">registrations</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'registered' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {filterSimCards(simCards, {
                                        status: SIMStatus.REGISTERED,
                                        dateFilter: viewMode,
                                        staffFilter: selectedStaff,
                                        searchFilter: searchTerm
                                    }).map((sim) => (
                                        <div key={sim.id}
                                             className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle2 className="w-4 h-4 text-green-500"/>
                                                <span
                                                    className="font-medium text-gray-900 dark:text-gray-100 text-sm">{sim.serial_number}</span>
                                            </div>
                                            <div
                                                className="flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                        <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                            On:
                        </span>
                                                <span
                                                    className="text-xs text-gray-500 dark:text-gray-400">{sim.registered_on}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'assigned' && (
                                <SimCardGrid
                                    simCards={simCards}
                                    selectedStaff={selectedStaff}
                                    searchTerm={searchTerm}
                                    filterSimCards={filterSimCards}
                                    SIMStatus={SIMStatus}
                                    status={SIMStatus.ASSIGNED}
                                    itemsPerPage={12}
                                    onUnassign={(selectedSimIds) => {
                                        showModal({
                                            content: onClose => <UnassignSimCard onClose={onClose}
                                                                                 simCards={selectedSimIds}/>
                                        })
                                    }}
                                    onTransfer={(selectedSimIds) => {
                                        showModal({
                                            content: onClose => <TransferSimCard user={user} onClose={onClose}
                                                                                 simCards={selectedSimIds}/>
                                        })
                                    }}
                                />
                            )}

                            {activeTab === 'unassigned' && (
                                <SimCardGrid
                                    simCards={simCards}
                                    selectedStaff={selectedStaff}
                                    searchTerm={searchTerm}
                                    filterSimCards={filterSimCards}
                                    SIMStatus={SIMStatus}
                                    itemsPerPage={12}
                                    onAssign={(selectedSimIds) => {
                                        showModal({
                                            content: onClose => <AssignSimCard user={user} onClose={onClose}
                                                                               simCards={selectedSimIds}/>
                                        })
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer navigation for screens smaller than lg */}
            {
                dimen.isMobile || !dimen.lg && (
                    <Fixed>
                        <div
                            className="lg:hidden md:ml-64 fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                            <div className="flex w-full max-w-[600px] justify-around items-center h-16 mx-auto">
                                {[
                                    {id: 'overview', name: 'Overview', icon: TrendingUp},
                                    {id: 'registered', name: 'Registered', icon: CheckCircle2},
                                    {id: 'assigned', name: 'Assigned', icon: UserCheck},
                                    {id: 'unassigned', name: 'Unassigned', icon: Clock}
                                ].map((tab) => (
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex flex-col items-center justify-center flex-1 h-full ${
                                            activeTab === tab.id ? 'text-green-600' : 'text-gray-600'
                                        }`}
                                    >
                            <span className={`rounded-full px-6 py-1 ${
                                activeTab === tab.id ? 'bg-green-100' : 'bg-gray-100'
                            } text-xs`}>
                                <tab.icon className="h-6 w-6"/>
                            </span>
                                        <span className="text-xs mt-1 truncate w-full text-center px-1">{tab.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Fixed>
                )
            }
        </>
    );
};

export default function TeamLeaderDashboard() {
    return (

        <Dashboard>
            <TeamLeaderDashboardView/>
        </Dashboard>
    )
};
