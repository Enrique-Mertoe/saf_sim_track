"use client"
import React, {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, Download, Edit, Filter, RefreshCw, Save, Search, X} from 'lucide-react';
import Dashboard from "@/ui/components/dash/Dashboard";
import simService from "@/services/simService";
import useApp from "@/ui/provider/AppProvider";
import {SIMCard, Team, User, UserRole} from "@/models";
import {formatDate} from "@/helper";
import {teamService} from "@/services";
import alert from "@/ui/alert";

type SimAdapter = SIMCard & {
    team_id: Team;
    sold_by_user_id: User;
    qualityStatus: string;
    matchStatus: string;
}
const RegisteredSimCards = () => {
    // State for sim cards data
    const {user} = useApp()
    const [simCards, setSimCards] = useState<SimAdapter[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [filteredSimCards, setFilteredSimCards] = useState<SimAdapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingSerial, setUpdatingSerial] = useState<string | null>(null);

    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // State for search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        matchStatus: 'all', // 'all', 'matched', 'unmatched'
        qualityStatus: 'all', // 'all', 'quality', 'not_quality'
        team: 'all',
        startDate: '',
        endDate: ''
    });

    // State for showing filter panel
    const [showFilters, setShowFilters] = useState(false);


    // State for editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Mock function to fetch sim cards (replace with actual API call)
    const fetchSimCards = async () => {
        setIsLoading(true);
        try {
            const {data, error} = await simService.getAllSimCards(user!);
            if (error) throw error;


            setSimCards(data as SimAdapter[]);
            setFilteredSimCards(data as SimAdapter[]);
            console.log("cards", data)

            setIsLoading(false);
        } catch (err) {
            console.log(err)
            setError('Failed to fetch SIM cards. Please try again later.');
            setIsLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const {data, error} = await teamService.getAllTeams();
            if (error) throw error;
            setTeams(data);
        } catch (err) {
            console.log(err)
            setError('Failed to fetch teams. Please try again later.');
        }
    };

    // Mock function to update a SIM card
    const updateSimCard = async (id: any, newSerialNumber: any) => {
        try {
            // This would be replaced with an actual API call
            setUpdatingSerial(newSerialNumber);
            const {error} = await simService.updateSIMCard(id, newSerialNumber);
            if (error) throw error;
            setUpdatingSerial(null);
            alert.success(
                `Successfully updated serial number for SIM card ${newSerialNumber}.`
            )
            setSimCards(simCards.map(card =>
                card.id === id ? {...card, serialNumber: newSerialNumber} : card
            ));
            setFilteredSimCards(filteredSimCards.map(card =>
                card.id === id ? {...card, serialNumber: newSerialNumber} : card
            ));
            return true;
        } catch (err) {
            //@ts-ignore
            alert.error(err.message)
            setError('Failed to update SIM card. Please try again later.');
            return false;
        } finally {
            setUpdatingSerial(null);
        }
    };


    // Fetch data on component mount
    useEffect(() => {
        if (!user) return;
        fetchSimCards().then();
        fetchTeams().then();
    }, [user]);

    // Apply filters and search
    useEffect(() => {
        let result = [...simCards];

        // Apply search term
        if (searchTerm) {
            result = result.filter(card =>
                card.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.sold_by_user_id.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.team_id.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply filters
        if (filters.matchStatus !== 'all') {
            result = result.filter(card => card.matchStatus === filters.matchStatus.toUpperCase());
        }

        if (filters.qualityStatus !== 'all') {
            result = result.filter(card => card.qualityStatus === filters.qualityStatus.toUpperCase());
        }

        if (filters.team !== 'all') {
            result = result.filter(card => card.team_id.name === filters.team);
        }

        if (filters.startDate) {
            result = result.filter(card => new Date(card.sale_date) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            result = result.filter(card => new Date(card.sale_date) <= new Date(filters.endDate));
        }

        setFilteredSimCards(result);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, filters, simCards]);

    // Handle page change
    const totalPages = Math.ceil(filteredSimCards.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSimCards.slice(indexOfFirstItem, indexOfLastItem);

    // Handle edit form submission
    const handleEditSubmit = async (id: any) => {
        if (editValue.trim() === '') return;

        const success = await updateSimCard(id, editValue);
        if (success) {
            setEditingId(null);
            setEditValue('');
        }
    };

    // Handle export
    const handleExport = () => {
        // This would be implemented to export filtered data to CSV/Excel
        alert.info('Export functionality is coming soon');
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            matchStatus: 'all',
            qualityStatus: 'all',
            team: 'all',
            startDate: '',
            endDate: ''
        });
        setSearchTerm('');
    };

    return (
        <Dashboard>
            <div className="p-6 max-w-full mx-auto rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Registered SIM Cards</h1>

                {/* Search and filters row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div className="relative flex-1 w-full md:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500"/>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by serial number, user or team..."
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
                        >
                            <Filter className="h-4 w-4"/>
                            Filters
                        </button>

                        <button
                            onClick={fetchSimCards}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 rounded-md"
                        >
                            <RefreshCw className="h-4 w-4"/>
                            Refresh
                        </button>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1 px-4 py-2 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/40 text-green-600 dark:text-green-400 rounded-md"
                        >
                            <Download className="h-4 w-4"/>
                            Export
                        </button>
                    </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Match
                                    Status</label>
                                <select
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-3 py-2"
                                    value={filters.matchStatus}
                                    onChange={(e) => setFilters({...filters, matchStatus: e.target.value})}
                                >
                                    <option value="all">All</option>
                                    <option value="matched">Matched</option>
                                    <option value="unmatched">Unmatched</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quality
                                    Status</label>
                                <select
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-3 py-2"
                                    value={filters.qualityStatus}
                                    onChange={(e) => setFilters({...filters, qualityStatus: e.target.value})}
                                >
                                    <option value="all">All</option>
                                    <option value="quality">Quality</option>
                                    <option value="not_quality">Not Quality</option>
                                </select>
                            </div>

                            {
                                user?.role === UserRole.ADMIN ?
                                    <div>
                                        <label
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team</label>
                                        <select
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-3 py-2"
                                            value={filters.team}
                                            onChange={(e) => setFilters({...filters, team: e.target.value})}
                                        >
                                            <option value="all">All Teams</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.name}>{team.name}</option>
                                            ))}
                                        </select>
                                    </div> : ''
                            }

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start
                                    Date</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-3 py-2"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End
                                    Date</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-3 py-2"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Status summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total SIM Cards</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{filteredSimCards.length}</p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-1">Matched</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                            {filteredSimCards.filter(card => card.matchStatus === 'MATCHED').length}
                            <span className="text-sm font-normal ml-2 text-green-700 dark:text-green-400">
          ({Math.round(filteredSimCards.filter(card => card.matchStatus === 'MATCHED').length / filteredSimCards.length * 100) || 0}%)
        </span>
                        </p>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-1">Unmatched</p>
                        <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                            {filteredSimCards.filter(card => card.matchStatus === 'UNMATCHED').length}
                            <span className="text-sm font-normal ml-2 text-red-700 dark:text-red-400">
          ({Math.round(filteredSimCards.filter(card => card.matchStatus === 'UNMATCHED').length / filteredSimCards.length * 100) || 0}%)
        </span>
                        </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-md">
                        <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Quality</p>
                        <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                            {filteredSimCards.filter(card => card.qualityStatus === 'QUALITY').length}
                            <span className="text-sm font-normal ml-2 text-purple-700 dark:text-purple-400">
          ({Math.round(filteredSimCards.filter(card => card.qualityStatus === 'QUALITY').length / filteredSimCards.filter(card => card.matchStatus === 'MATCHED').length * 100) || 0}%)
        </span>
                        </p>
                    </div>
                </div>

                {/* SIM Cards table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600">Serial
                                Number
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600">Recorded
                                Date
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600">Recorded
                                By
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600">Team</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600">Match
                                Status
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600">Quality
                                Status
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600">Top-up
                                Amount
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={8} className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={8} className="text-center py-4 text-red-500 dark:text-red-400">{error}</td>
                            </tr>
                        ) : currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-4 text-gray-500 dark:text-gray-400">No SIM
                                    cards
                                    found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            currentItems.map(card => (
                                <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/70">
                                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                                        {editingId === card.id ? (
                                            <div className="flex gap-1">
                                                <input
                                                    type="text"
                                                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-2 py-1 text-sm w-40"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleEditSubmit(card.id)}
                                                    className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1"
                                                >
                                                    <Save className="h-4 w-4"/>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditValue('');
                                                    }}
                                                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                                                >
                                                    <X className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        ) : (
                                            card.serial_number
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{formatDate(card.created_at)}</td>
                                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{card.sold_by_user_id.full_name}</td>
                                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{card.team_id.name}</td>
                                    <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    card.matchStatus === 'MATCHED'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                }`}>
                  {card.matchStatus === 'MATCHED' ? 'Matched' : 'Unmatched'}
                </span>
                                    </td>
                                    <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    card.qualityStatus === 'QUALITY'
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {card.qualityStatus === 'QUALITY' ? 'Quality' : 'Not Quality'}
                </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                                        {card.top_up_amount ? `KES ${card.top_up_amount.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="py-3 px-4">
                                        {editingId !== card.id && (
                                            <button
                                                onClick={() => {
                                                    setEditingId(card.id);
                                                    setEditValue(card.serial_number);
                                                }}
                                                className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                            >
                                                <Edit className="h-4 w-4"/>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div
                    className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <div className="flex items-center">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                            <span className="font-medium">
          {Math.min(indexOfLastItem, filteredSimCards.length)}
        </span>{' '}
                            of <span className="font-medium">{filteredSimCards.length}</span> results
                        </p>

                        <div className="ml-4">
                            <label className="text-sm text-gray-700 dark:text-gray-300 mr-1">Items per page:</label>
                            <select
                                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm py-1"
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md ${
                                currentPage === 1
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                            }`}
                        >
                            <ChevronLeft className="h-5 w-5"/>
                        </button>

                        {totalPages <= 7 ? (
                            // Show all page numbers if 7 or fewer pages
                            [...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 rounded-md ${
                                        currentPage === i + 1
                                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-500 dark:border-blue-600'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))
                        ) : (
                            // Show pagination with ellipsis for more than 7 pages
                            <>
                                {[...Array(3)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`px-3 py-1 rounded-md ${
                                            currentPage === i + 1
                                                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-500 dark:border-blue-600'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                {currentPage > 4 && <span className="px-2 text-gray-600 dark:text-gray-400">...</span>}

                                {currentPage > 3 && currentPage < totalPages - 2 && (
                                    <button
                                        className="px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-500 dark:border-blue-600"
                                    >
                                        {currentPage}
                                    </button>
                                )}

                                {currentPage < totalPages - 3 &&
                                    <span className="px-2 text-gray-600 dark:text-gray-400">...</span>}

                                {[...Array(3)].map((_, i) => (
                                    <button
                                        key={totalPages - 2 + i}
                                        onClick={() => setCurrentPage(totalPages - 2 + i)}
                                        className={`px-3 py-1 rounded-md ${
                                            currentPage === totalPages - 2 + i
                                                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-500 dark:border-blue-600'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                                        }`}
                                    >
                                        {totalPages - 2 + i}
                                    </button>
                                ))}
                            </>
                        )}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md ${
                                currentPage === totalPages
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                            }`}
                        >
                            <ChevronRight className="h-5 w-5"/>
                        </button>
                    </div>
                </div>
            </div>

        </Dashboard>
    );
};

export default RegisteredSimCards;