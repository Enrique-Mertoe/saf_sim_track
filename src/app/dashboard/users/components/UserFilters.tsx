// app/admin/users/components/UserFilters.tsx
import {useEffect, useState} from 'react';
import {Team, UserStatus} from "@/models";
import {teamService} from "@/services";

type UserFiltersProps = {
    filters: {
        role: string;
        team: string;
        status: string;
        search: string;
    };
    onFilterChange: (filters: any) => void;
    availableFilters?: {
        showRoleFilter: boolean;
        showTeamFilter: boolean;
        showStatusFilter: boolean;
        showSearch: boolean;
    };
};

export default function UserFilters({
    filters, 
    onFilterChange, 
    availableFilters = {
        showRoleFilter: true,
        showTeamFilter: true,
        showStatusFilter: true,
        showSearch: true
    }
}: UserFiltersProps) {
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        // Fetch teams for the dropdown
        const fetchTeams = async () => {
            try {
                const {data} = await teamService.getAllTeams()
                setTeams(data as Team[]);
            } catch (error) {
                console.error('Error fetching teams:', error);
            }
        };

        fetchTeams().then();
    }, []);

    const roles = [
        {value: '', label: 'All Roles'},
        {value: 'ADMIN', label: 'Admin'},
        {value: 'TEAM_LEADER', label: 'Team Leader'},
        {value: 'VAN_STAFF', label: 'Van Staff'},
        {value: 'MPESA_ONLY_AGENT', label: 'Mpesa Only Agent'},
        {value: 'NON_MPESA_AGENT', label: 'Non-Mpesa Agent'},
    ];

    const statuses = [
        {value: '', label: 'All Statuses'},
        {value: UserStatus.ACTIVE, label: 'Active'},
        {value: UserStatus.SUSPENDED, label: 'Suspended'},
    ];

    // Calculate the number of visible filters to adjust the grid
    const visibleFiltersCount = [
        availableFilters.showSearch,
        availableFilters.showRoleFilter,
        availableFilters.showTeamFilter,
        availableFilters.showStatusFilter
    ].filter(Boolean).length;

    // Determine grid columns based on visible filters
    const gridCols = visibleFiltersCount > 0 
        ? `grid-cols-1 ${
            visibleFiltersCount === 1 ? 'md:grid-cols-1' : 
            visibleFiltersCount === 2 ? 'md:grid-cols-2' : 
            visibleFiltersCount === 3 ? 'md:grid-cols-3' : 
            'md:grid-cols-4'
          }`
        : '';

    return (
        <div className="mb-6 py-2 px-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className={`grid ${gridCols} gap-6`}>
                {availableFilters.showSearch && (
                    <div className="relative">
                        <div className="relative">
                            <input
                                type="text"
                                id="search"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                placeholder="Name, ID, or Phone"
                                value={filters.search}
                                onChange={(e) => onFilterChange({search: e.target.value})}
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {availableFilters.showRoleFilter && (
                    <div>
                        <select
                            id="role"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            value={filters.role}
                            onChange={(e) => onFilterChange({role: e.target.value})}
                        >
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {availableFilters.showTeamFilter && (
                    <div>
                        <select
                            id="team"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            value={filters.team}
                            onChange={(e) => onFilterChange({team: e.target.value})}
                        >
                            <option value="">All Teams</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {availableFilters.showStatusFilter && (
                    <div>
                        <select
                            id="status"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            value={filters.status}
                            onChange={(e) => onFilterChange({status: e.target.value})}
                        >
                            {statuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
