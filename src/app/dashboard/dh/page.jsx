"use client"
import React, {useEffect, useMemo, useState} from 'react';
import {AlertTriangle, Calendar, CheckCircle2, Clock, Phone, Search, TrendingUp, UserCheck, Users} from 'lucide-react';
import {useSupabaseSignal} from "@/lib/supabase/event";
import {teamService} from "@/services";
import useApp from "@/ui/provider/AppProvider";
import {SIMStatus} from "@/models";
import simService from "@/services/simService";
import Dashboard from "@/ui/components/dash/Dashboard";

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

        // const fetchSimCards = async () => {
        //     if (!user || !user.team_id) return;
        //
        //     try {
        //         setIsLoading(true);
        //
        //         // Calculate date range based on view mode
        //         let fromDate = selectedDate;
        //         let toDate = selectedDate;
        //
        //         if (viewMode === 'weekly') {
        //             const weekStart = new Date(selectedDate);
        //             weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        //             const weekEnd = new Date(weekStart);
        //             weekEnd.setDate(weekEnd.getDate() + 6);
        //
        //             fromDate = weekStart.toISOString().split('T')[0];
        //             toDate = weekEnd.toISOString().split('T')[0];
        //         } else if (viewMode === 'monthly') {
        //             const monthStart = new Date(selectedDate);
        //             monthStart.setDate(1);
        //             const monthEnd = new Date(monthStart);
        //             monthEnd.setMonth(monthEnd.getMonth() + 1);
        //             monthEnd.setDate(0);
        //
        //             fromDate = monthStart.toISOString().split('T')[0];
        //             toDate = monthEnd.toISOString().split('T')[0];
        //         }
        //
        //         // Search for SIM cards with filters
        //         const {data, error} = await simCardService.searchSimCards({
        //             teamId: user.team_id,
        //             fromDate,
        //             toDate,
        //             pageSize: 100 // Increase if needed
        //         });
        //
        //         if (error) throw error;
        //
        //         // Transform data to match the expected format
        //         const formattedData = data.map(sim => ({
        //             id: sim.id,
        //             serialNumber: sim.serial_number,
        //             status: sim.status,
        //             assignedTo: sim.assigned_to_name || '',
        //             assignedToId: sim.assigned_to_user_id || '',
        //             registeredOn: sim.registered_on ? sim.registered_on.split('T')[0] : '',
        //             registeredBy: sim.registered_by_name || '',
        //             customerName: sim.customer_name || '',
        //             customerPhone: sim.customer_phone || '',
        //             location: sim.location || '',
        //             assignedOn: sim.assigned_on ? sim.assigned_on.split('T')[0] : ''
        //         }));
        //
        //         setSimCards(formattedData);
        //     } catch (error) {
        //         console.error('Error fetching SIM cards:', error);
        //         setError('Failed to load SIM card data');
        //     } finally {
        //         setIsLoading(false);
        //     }
        // };

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
                    registeredOn: payload.new.registered_on ? payload.new.registered_on.split('T')[0] : '',
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
                    registeredOn: payload.new.registered_on ? payload.new.registered_on.split('T')[0] : '',
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

    // Filter SIM cards based on selected date and view mode
    const filteredSimCards = useMemo(() => {
        if (!simCards.length) return [];

        let filtered = simCards;

        if (viewMode === 'daily') {
            filtered = simCards.filter(sim =>
                sim.registeredOn === selectedDate ||
                (sim.status === SIMStatus.REGISTERED && sim.registeredOn === selectedDate)
            );
        } else if (viewMode === 'weekly') {
            const weekStart = new Date(selectedDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            filtered = simCards.filter(sim => {
                if (!sim.registeredOn) return false;
                const regDate = new Date(sim.registeredOn);
                return regDate >= weekStart && regDate <= weekEnd;
            });
        }

        if (selectedStaff !== 'all') {
            filtered = filtered.filter(sim => sim.assignedToId === selectedStaff);
        }

        if (searchTerm) {
            filtered = filtered.filter(sim =>
                sim.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (sim.customerName && sim.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return filtered;
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
        const assigned = simCards.filter(sim => sim.status === SIMStatus.ASSIGNED).length;
        const unassigned = simCards.filter(sim => sim.status === SIMStatus.UNASSIGNED).length;

        const dailyRegistered = simCards.filter(sim =>
            sim.status === SIMStatus.REGISTERED && sim.registeredOn === selectedDate
        ).length;

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Team Leader Dashboard</h1>
                    <p className="text-gray-600">Monitor daily SIM card sales and team performance</p>
                    {teamData && (
                        <p className="text-sm text-blue-600 mt-1">
                            Team: {teamData.name} {teamData.leader && `• Leader: ${teamData.leader.full_name}`}
                        </p>
                    )}
                </div>

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
                        subtitle={`${selectedDate}`}
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
                        <div className="mb-4 flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                <input
                                    type="text"
                                    placeholder="Search by serial number or customer name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2">
                                        <h3 className="text-lg font-semibold mb-4">Today's Registrations</h3>
                                        <div className="space-y-3">
                                            {filteredSimCards.filter(sim => sim.status === 'REGISTERED').map((sim) => (
                                                <div key={sim.id}
                                                     className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{sim.serialNumber}</p>
                                                            <p className="text-sm text-gray-600">Customer: {sim.customerName}</p>
                                                            <p className="text-sm text-gray-600">Phone: {sim.customerPhone}</p>
                                                            <p className="text-sm text-gray-600">Location: {sim.location}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium text-green-600">Registered
                                                                by {sim.registeredBy}</p>
                                                            <p className="text-xs text-gray-500">{sim.registeredOn}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredSimCards.filter(sim => sim.status === 'REGISTERED').length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
                                                    <p>No registrations for the selected date</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Staff Performance Today</h3>
                                        <div className="space-y-3">
                                            {teamStaff.map(staff => {
                                                const staffRegistrations = simCards.filter(sim =>
                                                    sim.assignedToId === staff.id &&
                                                    sim.status === SIMStatus.REGISTERED &&
                                                    sim.registeredOn === selectedDate
                                                ).length;

                                                return (
                                                    <div key={staff.id}
                                                         className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{staff.name}</p>
                                                                <p className="text-sm text-gray-600">{staff.role}</p>
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
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    {filteredSimCards.filter(sim => sim.status === SIMStatus.REGISTERED).map((sim) => (
                                        <div key={sim.id}
                                             className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500"/>
                                                        <span
                                                            className="font-medium text-gray-900">{sim.serialNumber}</span>
                                                    </div>
                                                    <div
                                                        className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                        <div>
                                                            <p className="font-medium">Customer</p>
                                                            <p>{sim.customerName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">Phone</p>
                                                            <p>{sim.customerPhone}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">Location</p>
                                                            <p>{sim.location}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">Registered By</p>
                                                            <p>{sim.registeredBy}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                          <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Registered
                          </span>
                                                    <p className="text-xs text-gray-500 mt-1">{sim.registeredOn}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'assigned' && (
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    {filteredSimCards.filter(sim => sim.status === SIMStatus.ASSIGNED).map((sim) => (
                                        <div key={sim.id}
                                             className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <UserCheck className="w-4 h-4 text-blue-500"/>
                                                        <span
                                                            className="font-medium text-gray-900">{sim.serialNumber}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">Assigned
                                                        to: {sim.assignedTo}</p>
                                                </div>
                                                <div className="text-right">
                          <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Assigned
                          </span>
                                                    <p className="text-xs text-gray-500 mt-1">{sim.assignedOn}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'unassigned' && (
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    {filteredSimCards.filter(sim => sim.status === SIMStatus.UNASSIGNED).map((sim) => (
                                        <div key={sim.id}
                                             className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-orange-500"/>
                                                        <span
                                                            className="font-medium text-gray-900">{sim.serialNumber}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                          <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Unassigned
                          </span>
                                                    <button
                                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">
                                                        Assign
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function TeamLeaderDashboard(){
    return (

        <Dashboard>
            <TeamLeaderDashboardView/>
        </Dashboard>
    )
};
