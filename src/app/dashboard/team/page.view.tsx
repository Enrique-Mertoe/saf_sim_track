"use client"
import React, {useCallback, useEffect, useState} from "react";
import {teamService} from "@/services/teamService";
import {Team as Team1, TeamUpdate, User, UserRole} from "@/models";
import Link from "next/link";
import {useDialog} from "@/app/_providers/dialog";
import Create from "@/app/dashboard/team/create";
import useApp from "@/ui/provider/AppProvider";
import {userService} from "@/services";
import alert from "@/ui/alert";

type Team = Team1 & {
    users: User
}

interface TeamFormData {
    name: string;
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


    const handleUpdateTeam = async (fd: any) => {
        if (!currentTeam) return;
        setFormData(fd)

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
    // const dialog = useDialog()
    const openEditModal = (team: Team) => {

        setCurrentTeam(team);
        const data={
            name: team.name,
            leader_id: team.leader_id,
            region: team.region,
        };
        const d = dialog.create({

            content: <EditTeam data={data} onClose={() => d.dismiss()}
                // @ts-ignore
                               handleUpdateTeam={(...args: any[]) => handleUpdateTeam(...args)} leaders={leaders}/>

        });
    };

    const resetForm = () => {
        setFormData({
            name: "",
            leader_id: "",
            region: "",
        });
        setCurrentTeam(null);
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

                            <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                    className="text-sm text-gray-900">{team.users?.full_name || "Not assigned"}</div>
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
                                {/*<Link href={`/admin/teams/${team.id}`}*/}
                                {/*      className="text-green-600 hover:text-green-900">*/}
                                {/*    View Details*/}
                                {/*</Link>*/}
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


        </div>
    );
}

const EditTeam = function ({data,leaders, onClose, handleUpdateTeam}: any) {
    const [formData, setFormData] = useState<TeamFormData>(data);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    return (
        <div
            className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full shadow-lg border border-gray-100 dark:border-slate-700 transition-all duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 dark:text-green-400"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Edit Team
            </h2>
            <div className="space-y-6">
                <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full p-3 outline-0 rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-green-400"
                            placeholder="Enter team name"
                            required
                        />
                        <div
                            className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                 className="h-5 w-5 text-green-500 dark:text-green-400" viewBox="0 0 20 20"
                                 fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team
                        Leader</label>
                    <div className="relative">
                        <select
                            name="leader_id"
                            value={formData.leader_id}
                            onChange={handleInputChange}
                            onSelect={()=>{}}
                            className="mt-1 block w-full  p-3 outline-0 rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-slate-700 dark:text-white appearance-none"
                            required
                        >
                            <option value="">Select a leader</option>
                            {leaders.map((leader: User) => (
                                <option key={leader.id} value={leader.id}>
                                    {leader.full_name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500"
                                 viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                      clipRule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="region"
                            value={formData.region}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300  p-3 outline-0 dark:border-slate-600 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-green-400"
                            placeholder="Enter region"
                            required
                        />
                        <div
                            className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                 className="h-5 w-5 text-green-500 dark:text-green-400" viewBox="0 0 20 20"
                                 fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                      clipRule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
                <button
                    onClick={() => onClose()}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    Cancel
                </button>
                <button
                    onClick={() => {
                        alert.confirm({
                            title: "Update Team Leader",
                            message: 'Confirm this action',
                            task: async () => {
                                return await handleUpdateTeam(formData)
                            }
                        })
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white rounded-md hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-emerald-600 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!formData.name || !formData.leader_id || !formData.region}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                    Update Team
                </button>
            </div>
        </div>
    )
}