"use client"
import React, {useEffect, useMemo, useState} from 'react';
import {AlertTriangle, Calendar, CheckCircle2, Clock, Phone, Search, TrendingUp, UserCheck, Users} from 'lucide-react';
import {useSupabaseSignal} from "@/lib/supabase/event";
import {teamService} from "@/services";
import useApp from "@/ui/provider/AppProvider";
import {SIMStatus} from "@/models";
import simService from "@/services/simService";
import Dashboard from "@/ui/components/dash/Dashboard";
import {motion} from "framer-motion";
import {formatDate} from "@/helper";

// Helper function to compare dates by day only (ignoring time)
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;

    // Extract just the date part (YYYY-MM-DD) for comparison
    const day1 = date1.split('T')[0];
    const day2 = date2.split('T')[0];

    return day1 === day2;
};

const TeamLeaderDashboardView = () => {
    const {user} = useApp();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStaff, setSelectedStaff] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // StatCard component for displaying statistics
    // const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => (
    //     <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
    //         <div className="flex items-center justify-between">
    //             <div>
    //                 <p className="text-sm font-medium text-gray-600">{title}</p>
    //                 <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
    //                 {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    //             </div>
    //             <div className={`p-3 bg-${color}-100 rounded-full`}>
    //                 <Icon className={`w-6 h-6 text-${color}-600`} />
    //             </div>
    //         </div>
    //     </div>
    // );

    // State for real data
    const [simCards, setSimCards] = useState([]);
    const [fixedCards, setFixedCards] = useState([]);
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
                const {data: hierarchy, error: hierarchyError} = await teamService.getTeamHierarchy(user.team_id);
                if (hierarchyError) throw hierarchyError;

                // Extract staff members from hierarchy
                if (hierarchy && hierarchy.length > 0) {
                    const staffMembers = hierarchy[0].members || [];
                    setTeamStaff(staffMembers.map(member => ({
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
        fetchTeamData();
    }, [user]);

    // Fetch SIM cards data
    useEffect(() => {
        async function fetchSimCards() {
            if (!user || !user.team_id) return;

            try {
                setIsLoading(true);
                const data = await simService.getSIMCardsByTeamId(user.team_id);
                add(data)
            } catch {
                console.error('Error fetching team data:', error);
                setError('Failed to load team data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchSimCards();
    }, [user]);
    // Setup realtime updates for SIM cards
    useEffect(() => {
        if (!simCardSignal || !user || !user.team_id) return;

        // Handle new SIM cards
        const handleInsert = (payload) => {
            if (payload.new && payload.new.team_id === user.team_id) {
                const newSim = {
                    id: payload.new.id,
                    serialNumber: payload.new.serial_number,
                    status: payload.new.status,
                    assignedTo: payload.new.assigned_to_name || '',
                    assignedToId: payload.new.assigned_to_user_id || '',
                    registered_on: payload.new.registered_on ? payload.new.registered_on.split('T')[0] : '',
                    registeredBy: payload.new.registered_by_name || '',
                    customerName: payload.new.customer_name || '',
                    customerPhone: payload.new.customer_phone || '',
                    location: payload.new.location || '',
                    assignedOn: payload.new.assigned_on ? payload.new.assigned_on.split('T')[0] : ''
                };

                add(prev => [newSim, ...prev]);
            }
        };

        // Handle updated SIM cards
        const handleUpdate = (payload) => {
            if (payload.new && payload.new.team_id === user.team_id) {
                const updatedSim = {
                    id: payload.new.id,
                    serialNumber: payload.new.serial_number,
                    status: payload.new.status,
                    assignedTo: payload.new.assigned_to_name || '',
                    assignedToId: payload.new.assigned_to_user_id || '',
                    registered_on: payload.new.registered_on ? payload.new.registered_on.split('T')[0] : '',
                    registeredBy: payload.new.registered_by_name || '',
                    customerName: payload.new.customer_name || '',
                    customerPhone: payload.new.customer_phone || '',
                    location: payload.new.location || '',
                    assignedOn: payload.new.assigned_on ? payload.new.assigned_on.split('T')[0] : ''
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
        const { status, dateFilter, staffFilter, searchFilter } = criteria;

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
            const matchesStaffFilter = staffFilter === 'all' || sim.assignedToId === staffFilter;

            // Apply search filter
            const matchesSearchFilter = !searchFilter || 
                sim.serialNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
                (sim.customerName && sim.customerName.toLowerCase().includes(searchFilter.toLowerCase()));

            // Apply status filter if provided
            const matchesStatusFilter = !status || sim.status === status;

            return matchesDateFilter && matchesStaffFilter && matchesSearchFilter && matchesStatusFilter;
        });
    };

    // Filter SIM cards based on selected date and view mode
    const filteredSimCards = useMemo(() => {
        if (!simCards.length) return [];

        return filterSimCards(simCards, {
            dateFilter: viewMode,
            staffFilter: selectedStaff,
            searchFilter: searchTerm
        });
    }, [simCards, selectedDate, viewMode, selectedStaff, searchTerm]);

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

    const StatCard = ({title, value, subtitle, icon: Icon, color = "blue"}) => (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 bg-${color}-100 rounded-full`}>
                    <Icon className={`w-6 h-6 text-${color}-600`}/>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                {/*<div className="mb-8">*/}
                {/*    <h1 className="text-3xl font-bold text-gray-900">Team Leader Dashboard</h1>*/}
                {/*    <p className="text-gray-600">Monitor daily SIM card sales and team performance</p>*/}
                {/*    {teamData && (*/}
                {/*        <p className="text-sm text-blue-600 mt-1">*/}
                {/*            Team: {teamData.name} {teamData.leader && `• Leader: ${teamData.leader.full_name}`}*/}
                {/*        </p>*/}
                {/*    )}*/}
                {/*</div>*/}
                <motion.div
                    className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-800 dark:from-green-700 dark:to-green-900 rounded-xl p-6 mb-8 shadow-lg"
                    initial={{opacity: 0, scale: 0.96}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{duration: 0.5}}
                >
                    <div className="absolute inset-0 bg-grid-white/10 bg-grid-8"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Team Performance Dashboard</h2>
                                <p className="text-indigo-100 dark:text-indigo-200 mt-1">Monitor daily SIM card sales
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
                                            <span className="ml-1 font-medium">{teamData.van_number_plate}</span>
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
                                        <span className="text-indigo-100">Created:</span>
                                        <span className="ml-1 font-medium">{formatDate(teamData?.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Date and View Mode Controls */}
                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500"/>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {['daily', 'weekly', 'monthly'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        viewMode === mode
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500"/>
                            <select
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                                <option value="all">All Staff</option>
                                {teamStaff.map(staff => (
                                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                                ))}
                            </select>
                        </div>

                        {isLoading && (
                            <div className="ml-auto flex items-center text-sm text-gray-500">
                                <div
                                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                Refreshing data...
                            </div>
                        )}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Allocated"
                        value={stats.totalAllocated}
                        subtitle="SIM cards received"
                        icon={Phone}
                        color="blue"
                    />
                    <StatCard
                        title="Registered Today"
                        value={stats.dailyRegistered}
                        subtitle={`Date: ${formatDate(selectedDate)}`}
                        icon={CheckCircle2}
                        color="green"
                    />
                    <StatCard
                        title="Total Registered"
                        value={stats.registered}
                        subtitle={`${stats.registrationRate}% of allocated`}
                        icon={TrendingUp}
                        color="purple"
                    />
                    <StatCard
                        title="Unassigned"
                        value={stats.unassigned}
                        subtitle="Available for assignment"
                        icon={AlertTriangle}
                        color="orange"
                    />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
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
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4"/>
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Search Bar */}
                        <div className="mb-6 flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                <input
                                    type="text"
                                    placeholder="Search by serial number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Today's Registrations</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {filterSimCards(simCards, {
                                                status: SIMStatus.REGISTERED,
                                                dateFilter: 'daily',  // Always use daily for "Today's Registrations"
                                                staffFilter: selectedStaff,
                                                searchFilter: searchTerm
                                            }).map((sim) => (
                                                <div key={sim.id}
                                                     className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-medium text-gray-900 text-sm">{sim.serialNumber}</p>
                                                        <div className="text-right">
                                                            <p className="text-xs font-medium text-green-600">{sim.registeredBy}</p>
                                                            <p className="text-xs text-gray-500">{sim.registered_on}</p>
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
                                                <div className="col-span-full text-center py-8 text-gray-500">
                                                    <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
                                                    <p>No registrations for the selected date</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Staff Performance Today</h3>
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
                                                         className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium text-gray-900 text-sm">{staff.name}</p>
                                                                <p className="text-xs text-gray-600">{staff.role}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-bold text-blue-600">{staffRegistrations}</p>
                                                                <p className="text-xs text-gray-500">registrations</p>
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
                                         className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircle2 className="w-4 h-4 text-green-500"/>
                                            <span className="font-medium text-gray-900 text-sm">{sim.serialNumber}</span>
                                        </div>
                                        <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            On:
                        </span>
                                            <span className="text-xs text-gray-500">{sim.registered_on}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'assigned' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filterSimCards(simCards, {
                                    status: SIMStatus.ASSIGNED,
                                    dateFilter: viewMode,
                                    staffFilter: selectedStaff,
                                    searchFilter: searchTerm
                                }).map((sim) => (
                                    <div key={sim.id}
                                         className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <UserCheck className="w-4 h-4 text-blue-500"/>
                                            <span className="font-medium text-gray-900 text-sm">{sim.serialNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Assigned
                        </span>
                                            <span className="text-xs text-gray-500">{sim.assigned_on}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'unassigned' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {simCards.filter(sim => {
                                    // For unassigned, we need to filter for SIM cards that are NOT assigned
                                    const isUnassigned = sim.status !== SIMStatus.ASSIGNED;

                                    // Use the filterSimCards helper function but apply our own status check
                                    const otherFiltersMatch = filterSimCards([sim], {
                                        dateFilter: viewMode,
                                        staffFilter: selectedStaff,
                                        searchFilter: searchTerm
                                    }).length > 0;

                                    return isUnassigned && otherFiltersMatch;
                                }).map((sim) => (
                                    <div key={sim.id}
                                         className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Clock className="w-4 h-4 text-orange-500"/>
                                            <span className="font-medium text-gray-900 text-sm">{sim.serialNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Unassigned
                        </span>
                                            <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors">
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function TeamLeaderDashboard() {
    return (

        <Dashboard>
            <TeamLeaderDashboardView/>
        </Dashboard>
    )
};
