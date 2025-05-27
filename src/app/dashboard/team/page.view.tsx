"use client"
import React, {useCallback, useEffect, useRef, useState} from "react";
import {teamService} from "@/services/teamService";
import {Team as Team1, User, UserRole} from "@/models";
import useApp from "@/ui/provider/AppProvider";
import {userService} from "@/services";
import alert from "@/ui/alert";
import Signal from "@/lib/Signal";
import {Edit as EditIcon, Eye, MoreHorizontal, Trash} from "lucide-react";
import {AnimatePresence, motion} from "framer-motion";

type Team = Team1 & {
    users: User;
    memberCount?: number;
}

interface TeamFormData {
    name: string;
    leader_id: string;
    region: string;
}

export default function TeamsManagement() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
    const {user} = useApp()
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isMobileView, setIsMobileView] = useState(false);

    // Pagination state for desktop
    const [currentPage, setCurrentPage] = useState(1);
    const [teamsPerPage] = useState(10);
    const [paginatedTeams, setPaginatedTeams] = useState<Team[]>([]);

    // Mobile view state - for "load more" functionality
    const [visibleTeams, setVisibleTeams] = useState<number>(10);
    const [hasMore, setHasMore] = useState(true);

    const dropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

    const [leaders, setLeaders] = useState<{ id: string; full_name: string }[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchTeams = async () => {
            setIsLoading(true);

            try {
                const {data, error} = await teamService.getAllTeams();
                if (error) throw new Error(error.message);

                // Fetch member counts for each team
                const teamsWithCounts = await Promise.all((data || []).map(async (team) => {
                    try {
                        const { data: members } = await userService.getUsersByTeam(team.id);
                        return {
                            ...team,
                            memberCount: members?.length || 0
                        };
                    } catch (err) {
                        console.error(`Error fetching members for team ${team.id}:`, err);
                        return {
                            ...team,
                            memberCount: 0
                        };
                    }
                }));

                setTeams(teamsWithCounts);
                setFilteredTeams(teamsWithCounts);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        const fetchLeaders = async () => {
            setIsLoading(true);

            try {
                const {data, error} = await userService.getUsersByRole(UserRole.TEAM_LEADER);
                if (error) throw new Error(error.message);
                setLeaders(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeams().then()
        fetchLeaders().then()
    }, [user]);

    // Filter teams when search term changes
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredTeams(teams);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = teams.filter(team => 
            team.name.toLowerCase().includes(term) || 
            (team.users?.full_name && team.users.full_name.toLowerCase().includes(term)) || 
            (team.region && team.region.toLowerCase().includes(term))
        );

        setFilteredTeams(filtered);
        setCurrentPage(1); // Reset to first page when search changes
    }, [searchTerm, teams]);

    // Update paginated teams when filtered teams or current page changes
    useEffect(() => {
        const indexOfLastTeam = currentPage * teamsPerPage;
        const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
        setPaginatedTeams(filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam));
    }, [filteredTeams, currentPage, teamsPerPage]);

    // Check screen size and set mobile view
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobileView(window.innerWidth < 768); // 768px is a common breakpoint for mobile
        };

        // Initial check
        checkScreenSize();

        // Add event listener for window resize
        window.addEventListener('resize', checkScreenSize);

        // Cleanup
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Update visible teams for mobile view
    useEffect(() => {
        setHasMore(filteredTeams.length > visibleTeams);
    }, [filteredTeams, visibleTeams]);

    const loadMoreTeams = () => {
        setVisibleTeams(prev => Math.min(prev + 10, filteredTeams.length));
    };


    const openEditModal = (team: Team) => {
        Signal.trigger("edit-team", team);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown && !dropdownRefs.current[activeDropdown]?.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    const toggleDropdown = (teamId: string) => {
        setActiveDropdown(activeDropdown === teamId ? null : teamId);
    };


    const [showDialog, setShowDialog] = useState(false);

    const cr = useCallback(() => {
        // setShowDialog(true);
        Signal.trigger("create-team")
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-700 rounded-md">
                <p>Error: {error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md"
                >
                    Retry
                </button>
            </div>
        );
    }


    return (
        <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Team Management</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your teams, leaders, and regions</p>
                </div>
                <button
                    onClick={()=>{
                        Signal.trigger("create-team")
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New Team
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                        </svg>
                    </div>
                    <input 
                        type="search" 
                        className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-green-500 focus:border-green-500"
                        placeholder="Search teams by name, leader, or region..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Desktop View - Table */}
            {!isMobileView && (
                <div className="bg-white dark:bg-gray-800 shadow-md overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    Team Name
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.35-.035-.691-.1-1.02A5 5 0 0010 11z" clipRule="evenodd" />
                                    </svg>
                                    Leader
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    Region
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                    Members
                                </div>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center justify-end">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                                    </svg>
                                    Actions
                                </div>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedTeams.map((team) => (
                            <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{team.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div
                                        className="text-sm text-gray-900 dark:text-gray-100">{team.users?.full_name || "Not assigned"}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">{team.region}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                            {team.memberCount || 0}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                                    <div className="flex items-center justify-end">
                                        <button
                                            onClick={() => toggleDropdown(team.id)}
                                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                                        >
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>

                                        <AnimatePresence>
                                            {activeDropdown === team.id && (
                                                <motion.div
                                                    //@ts-ignore
                                                    ref={(el) => (dropdownRefs.current[team.id] = el)}
                                                    className="absolute right-0 mt-2 top-full z-10 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                openEditModal(team);
                                                                setActiveDropdown(null);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <EditIcon className="h-4 w-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                                                            Edit Team
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                alert.confirm({
                                                                    title: "Delete Team",
                                                                    message: `Are you sure you want to delete ${team.name}?`,
                                                                    task: async () => {
                                                                        try {
                                                                            const { error } = await teamService.deleteTeam(team.id);
                                                                            if (error) throw new Error(error.message);
                                                                            const updatedTeams = teams.filter(t => t.id !== team.id);
                                                                            setTeams(updatedTeams);
                                                                            setFilteredTeams(updatedTeams);
                                                                        } catch (err: any) {
                                                                            alert.error(err.message);
                                                                        }
                                                                    }
                                                                });
                                                                setActiveDropdown(null);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <Trash className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                Signal.trigger("view-team-details", team);
                                                                setActiveDropdown(null);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <Eye className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" />
                                                            View Details
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredTeams.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    {searchTerm ? "No teams match your search criteria." : "No teams found. Create your first team to get started."}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {filteredTeams.length > 0 && (
                        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing <span className="font-medium">{Math.min((currentPage - 1) * teamsPerPage + 1, filteredTeams.length)}</span> to <span className="font-medium">{Math.min(currentPage * teamsPerPage, filteredTeams.length)}</span> of <span className="font-medium">{filteredTeams.length}</span> teams
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded-md ${
                                            currentPage === 1 
                                                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed' 
                                                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        } border border-gray-300 dark:border-gray-600`}
                                    >
                                        Previous
                                    </button>

                                    {/* Page numbers */}
                                    <div className="hidden sm:flex space-x-1">
                                        {Array.from({ length: Math.ceil(filteredTeams.length / teamsPerPage) }).map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentPage(index + 1)}
                                                className={`px-3 py-1 rounded-md ${
                                                    currentPage === index + 1
                                                        ? 'bg-green-600 text-white dark:bg-green-700'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                                } border border-gray-300 dark:border-gray-600`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTeams.length / teamsPerPage)))}
                                        disabled={currentPage >= Math.ceil(filteredTeams.length / teamsPerPage)}
                                        className={`px-3 py-1 rounded-md ${
                                            currentPage >= Math.ceil(filteredTeams.length / teamsPerPage)
                                                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        } border border-gray-300 dark:border-gray-600`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile View - Card Layout */}
            {isMobileView && (
                <div className="space-y-2">
                    {filteredTeams.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-md border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">
                                {searchTerm ? "No teams match your search criteria." : "No teams found. Create your first team to get started."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {filteredTeams.slice(0, visibleTeams).map((team) => (
                                <div 
                                    key={team.id} 
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                                >
                                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{team.name}</h3>
                                        <div className="relative">
                                            <button
                                                onClick={() => toggleDropdown(team.id)}
                                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>

                                            <AnimatePresence>
                                                {activeDropdown === team.id && (
                                                    <motion.div
                                                        //@ts-ignore
                                                        ref={(el) => (dropdownRefs.current[team.id] = el)}
                                                        className="absolute right-0 mt-1 z-10 w-44 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => {
                                                                    openEditModal(team);
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <EditIcon className="h-3 w-3 mr-1 text-indigo-500 dark:text-indigo-400" />
                                                                Edit Team
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    alert.confirm({
                                                                        title: "Delete Team",
                                                                        message: `Are you sure you want to delete ${team.name}?`,
                                                                        task: async () => {
                                                                            try {
                                                                                const { error } = await teamService.deleteTeam(team.id);
                                                                                if (error) throw new Error(error.message);
                                                                                const updatedTeams = teams.filter(t => t.id !== team.id);
                                                                                setTeams(updatedTeams);
                                                                                setFilteredTeams(updatedTeams);
                                                                            } catch (err: any) {
                                                                                alert.error(err.message);
                                                                            }
                                                                        }
                                                                    });
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Trash className="h-3 w-3 mr-1" />
                                                                Delete
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    Signal.trigger("view-team-details", team);
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Eye className="h-3 w-3 mr-1 text-green-500 dark:text-green-400" />
                                                                View Details
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="px-3 py-2 space-y-1">
                                        <div className="flex flex-wrap items-center text-xs">
                                            <div className="flex items-center mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.35-.035-.691-.1-1.02A5 5 0 0010 11z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    <span className="font-medium">Leader:</span> {team.users?.full_name || "Not assigned"}
                                                </span>
                                            </div>

                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                                </svg>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    <span className="font-medium">Members:</span> 
                                                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                        {team.memberCount || 0}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center text-xs">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">Region:</span> {team.region}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="px-3 py-1 bg-gray-50 dark:bg-gray-700 flex justify-end">
                                        <button
                                            onClick={() => {
                                                Signal.trigger("view-team-details", team);
                                            }}
                                            className="text-xs text-green-600 dark:text-green-400 font-medium hover:text-green-700 dark:hover:text-green-300 flex items-center"
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="flex justify-center mt-3">
                                    <button
                                        onClick={loadMoreTeams}
                                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                    >
                                        Load More
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
