// app/admin/users/components/UserFilters.tsx
import {useState, useEffect} from 'react';
import {Team} from "@/models";
import {teamService} from "@/services";

type UserFiltersProps = {
    filters: {
        role: string;
        team: string;
        status: string;
        search: string;
    };
    onFilterChange: (filters: any) => void;
};

export default function UserFilters({filters, onFilterChange}: UserFiltersProps) {
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
        {value: 'ACTIVE', label: 'Active'},
        {value: 'SUSPENDED', label: 'Suspended'},
        {value: 'PENDING_APPROVAL', label: 'Pending Approval'},
    ];

    return (

        <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="search"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Search</label>
                    <input
                        type="text"
                        id="search"
                        className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        placeholder="Name, ID, or Phone"
                        value={filters.search}
                        onChange={(e) => onFilterChange({search: e.target.value})}
                    />
                </div>

                <div>
                    <label htmlFor="role"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Role</label>
                    <select
                        id="role"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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

                <div>
                    <label htmlFor="team"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Team</label>
                    <select
                        id="team"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500"
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

                <div>
                    <label htmlFor="status"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
                    <select
                        id="status"
                        className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-green-500 focus:border-green-500"
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
            </div>
        </div>
    );
}