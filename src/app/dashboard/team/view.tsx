import {useEffect, useState} from "react";
import {Calendar, MapPin, Truck, User, Users, X} from "lucide-react";
import {Team, User as UserType} from "@/models";
import {motion} from "framer-motion";
import {userService} from "@/services";

export default function ViewTeamDetails({ team, onDismiss }: {
    team: Team;
    onDismiss: () => void;
}) {
    const [teamMembers, setTeamMembers] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            setIsLoading(true);
            try {
                // Assuming there's an API to get team members by team ID
                const { data, error } = await userService.getUsersByTeam(team.id);
                if (error) throw new Error(error.message);
                setTeamMembers(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeamMembers();
    }, [team.id]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-700 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Team Details</h2>
                </div>
                <motion.button
                    onClick={onDismiss}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
            </div>

            {/* Team Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">{team.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 mr-1.5 sm:mr-2" />
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Team Leader</p>
                            <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100">
                                {team.users?.full_name || "Not assigned"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 mr-1.5 sm:mr-2" />
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Region</p>
                            <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100">
                                {team.region || "Not specified"}
                            </p>
                        </div>
                    </div>

                    {team.territory && (
                        <div className="flex items-center">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 mr-1.5 sm:mr-2" />
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Territory</p>
                                <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100">
                                    {team.territory}
                                </p>
                            </div>
                        </div>
                    )}

                    {team.van_number_plate && (
                        <div className="flex items-center">
                            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 mr-1.5 sm:mr-2" />
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Van Number Plate</p>
                                <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100">
                                    {team.van_number_plate}
                                </p>
                            </div>
                        </div>
                    )}

                    {team.van_location && (
                        <div className="flex items-center">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 mr-1.5 sm:mr-2" />
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Van Location</p>
                                <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100">
                                    {team.van_location}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 mr-1.5 sm:mr-2" />
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Created At</p>
                            <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100">
                                {new Date(team.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members */}
            <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">
                    Team Members ({teamMembers.length})
                </h3>

                {isLoading ? (
                    <div className="flex justify-center items-center py-6 sm:py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-3 sm:p-4 text-xs sm:text-sm text-red-700 dark:text-red-400">
                        {error}
                    </div>
                ) : teamMembers.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Desktop view - Table */}
                        <div className="hidden md:block">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Email
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {teamMembers.map((member) => (
                                            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {member.full_name}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                        {member.role}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                        {member.email}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile view - Cards */}
                        <div className="md:hidden">
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {teamMembers.map((member) => (
                                    <div key={member.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="mb-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {member.full_name}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <div className="text-gray-500 dark:text-gray-400">
                                                <span className="font-medium">Role:</span> {member.role}
                                            </div>
                                            <div className="text-gray-500 dark:text-gray-400 truncate">
                                                <span className="font-medium">Email:</span> {member.email}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 sm:p-8 text-center">
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No team members found.</p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 sm:mt-8 flex justify-end">
                <motion.button
                    onClick={onDismiss}
                    className="px-3 py-1.5 sm:px-5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Close
                </motion.button>
            </div>
        </div>
    );
}
