"use client"
import {useState, useEffect, useCallback} from "react";
import {teamService} from "@/services/teamService";
import {TeamUpdate} from "@/models";
import Link from "next/link";
import {useDialog} from "@/app/_providers/dialog";
import Create from "@/app/dashboard/team/create";
import useApp from "@/ui/provider/AppProvider";

interface Team {
    id: string;
    name: string;
    description?: string;
    leader_id: string;
    region: string;
    created_at: string;
    users: {
        full_name: string;
    };
}

interface TeamFormData {
    name: string;
    description: string;
    leader_id: string;
    region: string;
}

export default function TeamsManagement() {
    const [teams, setTeams] = useState<Team[]>([]);
    const {user} = useApp()
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const dialog = useDialog();

    const [formData, setFormData] = useState<TeamFormData>({
        name: "",
        description: "",
        leader_id: "",
        region: "",
    });
    const [leaders, setLeaders] = useState<{ id: string; full_name: string }[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchTeams = async () => {
            setIsLoading(true);
            try {
                const {data, error} = await teamService.getAllTeams();
                if (error) throw new Error(error.message);
                setTeams(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        // Fetch leaders data - in a real app, you'd have a userService
        const fetchLeaders = async () => {
            // This is a placeholder. You would need to create a userService with a getTeamLeaders method
            // For now, we'll use some dummy data
            setLeaders([
                {id: "1", full_name: "John Doe"},
                {id: "2", full_name: "Jane Smith"},
                {id: "3", full_name: "Michael Johnson"},
            ]);
        };

        fetchTeams();
        // fetchLeaders();
    }, []);


    const handleUpdateTeam = async () => {
        if (!currentTeam) return;

        try {
            const teamData: TeamUpdate = {
                name: formData.name,
                leader_id: formData.leader_id,
                region: formData.region,
            };

            const {data, error} = await teamService.updateTeam(currentTeam.id, teamData);
            if (error) throw new Error(error.message);

            setTeams(teams.map(team => team.id === currentTeam.id ? data : team));
            setShowEditModal(false);
            resetForm();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const openEditModal = (team: Team) => {
        setCurrentTeam(team);
        setFormData({
            name: team.name,
            description: team.description || "",
            leader_id: team.leader_id,
            region: team.region,
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            leader_id: "",
            region: "",
        });
        setCurrentTeam(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    const cr = useCallback(() => {
        const d = dialog.create({
            content: <Create onDismiss={() => d.dismiss()}/>,
            size: "lg",
            design: ["md-down"]
        });
    }, [dialog])
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
        <div className="px-4  py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
                <button
                    onClick={cr}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Add New Team
                </button>
            </div>

            {/* Teams Table */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team
                            Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {teams.map((team) => (
                        <tr key={team.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{team.name}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div
                                    className="text-sm text-gray-500 line-clamp-2">{team.description || "No description"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{team.users?.full_name || "Not assigned"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{team.region}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    onClick={() => openEditModal(team)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                    Edit
                                </button>
                                <Link href={`/admin/teams/${team.id}`} className="text-green-600 hover:text-green-900">
                                    View Details
                                </Link>
                            </td>
                        </tr>
                    ))}
                    {teams.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                No teams found. Create your first team to get started.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>


            {/* Edit Team Modal */}
            {showEditModal && currentTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Edit Team</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Team Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Team Leader</label>
                                <select
                                    name="leader_id"
                                    value={formData.leader_id}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    required
                                >
                                    <option value="">Select a leader</option>
                                    {leaders.map(leader => (
                                        <option key={leader.id} value={leader.id}>
                                            {leader.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Region</label>
                                <input
                                    type="text"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateTeam}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                disabled={!formData.name || !formData.leader_id || !formData.region}
                            >
                                Update Team
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}