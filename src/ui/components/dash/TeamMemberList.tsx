import {useState, useEffect} from 'react';
import {ChevronUp, ChevronDown, Phone, Smartphone, Info, Settings} from 'lucide-react';
import {userService} from "@/services";
import {createSupabaseClient} from "@/lib/supabase/client";
import {SIMStatus, User, UserRole, UserStatus} from "@/models";

// TeamMember is derived from User with additional display properties
interface TeamMember extends Partial<User> {
    id: string;
    name: string;
    avatar: string;
    status: UserStatus;
    role: UserRole;
    phoneNumber: string;
    mobigoNumber: string;
    lastActive: string;
    salesThisMonth: number;
    qualitySales: number;
    percentQuality: number;
    vanLocation?: string;
}

// MemberDetail contains additional performance metrics
interface MemberDetail {
    salesThisMonth: number;
    qualitySales: number;
    percentQuality: number;
    vanLocation: string | null;
}

interface MemberDetailsMap {
    [key: string]: MemberDetail;
}

interface TeamMembersPanelProps {
    teamId: string;
}

const TeamMembersPanel = ({teamId}: TeamMembersPanelProps) => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
    const [memberDetails, setMemberDetails] = useState<MemberDetailsMap>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    // Check for dark mode preference
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Check for system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDark);

            // Listen for changes in color scheme preference
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, []);

    // Fetch team members on component mount
    useEffect(() => {
        const fetchTeamMembers = async () => {
            setLoading(true);
            try {
                const {data, error} = await userService.getUsersByTeam(teamId);

                if (error) throw error;

                // Calculate basic metrics and format for display
                const formattedMembers: TeamMember[] = data.map((user: User) => ({
                    id: user.id,
                    name: user.full_name,
                    avatar: "/placeholder.png", // Use ID image or placeholder
                    status: user.status,
                    role: user.role,
                    phoneNumber: user.phone_number,
                    mobigoNumber: user.mobigo_number || 'Not assigned',
                    lastActive: user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never',
                    // We'll populate these when member is expanded
                    salesThisMonth: 0,
                    qualitySales: 0,
                    percentQuality: 0
                }));

                setTeamMembers(formattedMembers);
            } catch (error) {
                console.error('Error fetching team members:', error);
            } finally {
                setLoading(false);
            }
        };

        if (teamId) {
            fetchTeamMembers();
        }
    }, [teamId]);

    // Function to toggle staff details and load additional data if needed
    const toggleStaffDetails = async (userId: string) => {
        // If we're closing the current expanded item
        if (expandedStaff === userId) {
            setExpandedStaff(null);
            return;
        }

        // If we're opening a new item
        setExpandedStaff(userId);

        // Check if we already have details for this user
        if (!memberDetails[userId]) {
            try {
                const supabase = createSupabaseClient();
                const today = new Date();
                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

                // Fetch sim card sales for this user in current month
                const {data: salesData, error: salesError} = await supabase
                    .from('sim_cards')
                    .select('id, quality, match, top_up_amount')
                    .eq('sold_by_user_id', userId)
                    .gte('sale_date', firstDayOfMonth);

                if (salesError) throw salesError;

                // Calculate performance metrics
                const totalSales = salesData.length;
                const qualitySales = salesData.filter(sale => sale.quality === SIMStatus.QUALITY).length;
                const percentQuality = totalSales > 0 ? Math.round((qualitySales / totalSales) * 100) : 0;

                // Get van location if applicable
                const {data: teamData, error: teamError} = await createSupabaseClient()
                    .from('teams')
                    .select('van_location')
                    .eq('id', teamId)
                    .single();

                if (teamError && teamError.code !== 'PGRST116') throw teamError;

                // Store the details
                setMemberDetails(prev => ({
                    ...prev,
                    [userId]: {
                        salesThisMonth: totalSales,
                        qualitySales,
                        percentQuality,
                        vanLocation: teamData?.van_location || null
                    }
                }));

                // Update the team members array
                setTeamMembers((prev) =>
                    prev.map(member =>
                        member.id === userId
                            ? {
                                ...member,
                                salesThisMonth: totalSales,
                                qualitySales,
                                percentQuality,
                                vanLocation: teamData?.van_location || null
                            }
                            : member
                    )
                );
            } catch (error) {
                console.error('Error fetching member details:', error);
            }
        }
    };

    return (
        <div
            className={`lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300`}>
            <div
                className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">Team
                    Members</h2>
            </div>

            {loading ? (
                <div className="p-6 flex justify-center">
                    <div className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                    {teamMembers.map((member) => {
                        const details = memberDetails[member.id] || {};
                        const displayMember = {
                            ...member,
                            ...details
                        };

                        return (
                            <div key={member.id} className="bg-white dark:bg-gray-800 transition-all duration-300">
                                <div
                                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 ${
                                        expandedStaff === member.id ? 'bg-gray-50 dark:bg-gray-700' : ''
                                    }`}
                                    onClick={() => toggleStaffDetails(member.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                              <span
                                                  className="h-10 w-10 rounded-full object-cover mr-4 rounded-full bg-green-400 flex items-center justify-center text-white font-bol"
                                              >
                                                 {member?.full_name ? member.full_name.charAt(0) : "U"}
                                              </span>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">{member.name}</h3>
                                                <div className="flex items-center mt-1">
                          <span
                              className={`inline-flex px-2 text-xs font-medium rounded-full transition-colors duration-300 ${
                                  member.status === 'ACTIVE'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                          >
                            {member.status}
                          </span>
                                                    <span
                                                        className="mx-2 text-gray-500 dark:text-gray-400 text-xs transition-colors duration-300">•</span>
                                                    <span
                                                        className="text-gray-500 dark:text-gray-400 text-xs transition-colors duration-300">
                            {member.role.replace(/_/g, ' ')}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right hidden sm:block">
                                                <div
                                                    className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                                                    {displayMember.salesThisMonth} Sales
                                                </div>
                                                <div
                                                    className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                                    {displayMember.qualitySales} Quality ({displayMember.percentQuality}%)
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                        <span
                            className="text-xs text-gray-500 dark:text-gray-400 mr-2 hidden sm:inline transition-colors duration-300">
                          Last active: {member.lastActive}
                        </span>
                                                {expandedStaff === member.id ? (
                                                    <ChevronUp
                                                        className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-colors duration-300"/>
                                                ) : (
                                                    <ChevronDown
                                                        className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-colors duration-300"/>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded staff details - animated with height transition */}
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        expandedStaff === member.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div
                                        className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600 transition-colors duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                                                    Contact Information
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center">
                                                        <Phone
                                                            className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 transition-colors duration-300"/>
                                                        <span
                                                            className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                              {member.phoneNumber}
                            </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Smartphone
                                                            className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 transition-colors duration-300"/>
                                                        <span
                                                            className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                              {member.mobigoNumber}
                            </span>
                                                    </div>
                                                    {displayMember.vanLocation && (
                                                        <div className="flex items-center">
                                                            <Info
                                                                className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 transition-colors duration-300"/>
                                                            <span
                                                                className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                                Van Location: {displayMember.vanLocation}
                              </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                                                    Performance Metrics
                                                </h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                              <span
                                  className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                                Sales Progress
                              </span>
                                                            <span
                                                                className="text-xs text-gray-700 dark:text-gray-300 transition-colors duration-300">
                                {Math.round((displayMember.salesThisMonth / 150) * 100)}%
                              </span>
                                                        </div>
                                                        <div
                                                            className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 transition-all duration-700">
                                                            <div
                                                                className="bg-green-600 h-2 rounded-full transition-all duration-700 ease-out"
                                                                style={{
                                                                    width: `${Math.min(100, Math.round((displayMember.salesThisMonth / 150) * 100))}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                              <span
                                  className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                                Quality Rate
                              </span>
                                                            <span
                                                                className="text-xs text-gray-700 dark:text-gray-300 transition-colors duration-300">
                                {displayMember.percentQuality}%
                              </span>
                                                        </div>
                                                        <div
                                                            className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 transition-colors duration-300">
                                                            <div
                                                                className={`h-2 rounded-full transition-all duration-700 ease-out ${
                                                                    displayMember.percentQuality >= 95
                                                                        ? 'bg-green-500'
                                                                        : displayMember.percentQuality >= 90
                                                                            ? 'bg-yellow-500'
                                                                            : 'bg-red-500'
                                                                }`}
                                                                style={{width: `${displayMember.percentQuality}%`}}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end space-x-3">
                                            <button
                                                className="px-3 py-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs font-medium rounded transition-colors duration-300">
                                                View Full Profile
                                            </button>
                                            <button
                                                className="px-3 py-1 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 text-green-700 dark:text-green-200 text-xs font-medium rounded transition-colors duration-300">
                                                Send Message
                                            </button>
                                            <button
                                                className="px-3 py-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs font-medium rounded flex items-center transition-colors duration-300">
                                                <Settings className="h-3 w-3 mr-1"/>
                                                Manage
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div
                className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors duration-300">
        <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
          Showing <span className="font-medium">{teamMembers.length}</span> of{" "}
            <span className="font-medium">{teamMembers.length}</span> team members
        </span>
                <div className="flex space-x-1">
                    <button
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                        Previous
                    </button>
                    <button
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamMembersPanel;