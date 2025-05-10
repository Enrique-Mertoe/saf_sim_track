import {Activity, ArrowUpRight, Smartphone, XCircle, BarChart4, Users, TrendingUp} from "lucide-react";
import {CreateUser} from "@/ui/shortcuts";
import {useDialog} from "@/app/_providers/dialog";
import {FC, useEffect, useState} from "react";
import {userService} from "@/services";
import {UserRole} from "@/models";
import useApp from "@/ui/provider/AppProvider";

export default function DashQuickActions() {
    const dialog = useDialog()
    const {user} = useApp();
    return (
        <div className="">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Quick Actions</h2>
                <div className="space-y-4 grid grid-cols-2 gap-2">
                    <button
                        className="w-full cursor-pointer flex items-center justify-between p-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                        <div className="flex items-center">
                            <div className="p-2 bg-indigo-100 rounded-full mr-4">
                                <Smartphone className="h-5 w-5 text-indigo-600"/>
                            </div>
                            <span className="text-sm font-medium text-gray-900">Register New SIM</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-indigo-600"/>
                    </button>
                    <button
                        onClick={() => CreateUser(dialog, user!, {})
                        }
                        className="w-full cursor-pointer flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-full mr-4">
                                <Users className="h-5 w-5 text-green-600"/>
                            </div>
                            <span className="text-sm font-medium text-gray-900">Onboard New User</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-green-600"/>
                    </button>
                    <button
                        className="w-full cursor-pointer flex items-center justify-between p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-full mr-4">
                                <BarChart4 className="h-5 w-5 text-blue-600"/>
                            </div>
                            <span className="text-sm font-medium text-gray-900">Generate Report</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-blue-600"/>
                    </button>
                    <button
                        className="w-full cursor-pointer flex items-center justify-between p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-full mr-4">
                                <Activity className="h-5 w-5 text-purple-600"/>
                            </div>
                            <span className="text-sm font-medium text-gray-900">View Team Performance</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-purple-600"/>
                    </button>
                    <button
                        className="w-full cursor-pointer flex items-center justify-between p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-full mr-4">
                                <XCircle className="h-5 w-5 text-red-600"/>
                            </div>
                            <span className="text-sm font-medium text-gray-900">Review Flagged SIMs</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-red-600"/>
                    </button>
                </div>
            </div>
        </div>
    )
}

interface UserStats {
    total: number;
    teamLeaders: number;
    staff: number;
    active: number;
}

interface CounterProps {
    end: number;
    duration?: number;
}

interface StatCardProps {
    index: number;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle: string;
    value: number;
    progress: number;
}

export const UserStatistics: FC = () => {
    const [userStats, setUserStats] = useState<UserStats>({
        total: 0,
        teamLeaders: 0,
        staff: 0,
        active: 0
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [animate, setAnimate] = useState<boolean>(false);
    const [cardVisible, setCardVisible] = useState<boolean[]>(Array(4).fill(false));

    useEffect(() => {
        const fetchUserStats = async (): Promise<void> => {
            try {
                setLoading(true);

                // Get all users
                const {data: allUsers, error: allUsersError} = await userService.getAllUsers();
                if (allUsersError) throw allUsersError;

                // Get team leaders
                const {
                    data: teamLeaders,
                    error: teamLeadersError
                } = await userService.getUsersByRole(UserRole.TEAM_LEADER);
                if (teamLeadersError) throw teamLeadersError;

                // Get staff users
                const {data: staffUsers, error: staffError} = await userService.getUsersByRole(UserRole.STAFF);
                if (staffError) throw staffError;

                // Calculate active users
                const activeUsers = allUsers.filter(user => user.is_active === true);

                setUserStats({
                    total: allUsers.length,
                    teamLeaders: teamLeaders.length,
                    staff: staffUsers.length,
                    active: activeUsers.length
                });
            } catch (error) {
                console.error('Error fetching user statistics:', error);
            } finally {
                setLoading(false);
                // Trigger animations after data is loaded
                setAnimate(true);
                // Stagger card reveals
                cardVisible.forEach((_, index) => {
                    setTimeout(() => {
                        setCardVisible(prev => {
                            const newState = [...prev];
                            newState[index] = true;
                            return newState;
                        });
                    }, index * 200);
                });
            }
        };

        fetchUserStats();

        // Cleanup function
        return () => {
            setAnimate(false);
            setCardVisible(Array(4).fill(false));
        };
    }, []);

    // Animation for counting up
    const Counter: FC<CounterProps> = ({end, duration = 2000}) => {
        const [count, setCount] = useState<number>(0);

        useEffect(() => {
            if (!animate) return;

            let startTime: number | null = null;
            let animationFrameId: number;

            const step = (timestamp: number): void => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                setCount(Math.floor(progress * end));

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(step);
                }
            };

            animationFrameId = requestAnimationFrame(step);

            return () => {
                cancelAnimationFrame(animationFrameId);
            };
        }, [end, duration]);

        return <span>{count}</span>;
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        );
    }

    // Data for progress bars
    const totalUsers = userStats.total;
    const progressTeamLeaders = totalUsers > 0 ? (userStats.teamLeaders / totalUsers) * 100 : 0;
    const progressStaff = totalUsers > 0 ? (userStats.staff / totalUsers) * 100 : 0;
    const progressActive = totalUsers > 0 ? (userStats.active / totalUsers) * 100 : 0;

    const StatCard: FC<StatCardProps> = ({
                                             index,
                                             icon,
                                             iconBg,
                                             iconColor,
                                             title,
                                             subtitle,
                                             value,
                                             progress
                                         }) => {
        const cardClasses = `
      transform transition-all duration-500 ease-out
      ${cardVisible[index] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
      flex flex-col p-4 bg-gray-50 rounded-lg hover:shadow-lg border border-gray-100 hover:border-gray-200
    `;

        return (
            <div className={cardClasses}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div
                            className={`p-2 ${iconBg} rounded-full mr-4 transform transition-transform duration-300 hover:scale-110`}>
                            {icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{title}</p>
                            <p className="text-xs text-gray-500">{subtitle}</p>
                        </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                        <Counter end={value}/>
                    </div>
                </div>

                <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full ${iconColor.replace('text', 'bg')}`}
                            style={{
                                width: `${progress}%`,
                                transition: 'width 1.5s ease-in-out'
                            }}
                        ></div>
                    </div>
                    <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-500">{Math.round(progress)}% of total</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className={`bg-white p-2 rounded-lg shadow-md transform transition-all duration-700 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">User Statistics</h2>
                <div className="p-1.5 bg-indigo-50 rounded-md">
                    <TrendingUp className="h-4 w-4 text-indigo-600"/>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <StatCard
                    index={0}
                    icon={<Users className="h-5 w-5 text-indigo-600"/>}
                    iconBg="bg-indigo-100"
                    iconColor="text-indigo-600"
                    title="Total Users"
                    subtitle="All system users"
                    value={userStats.total}
                    progress={100}
                />

                <StatCard
                    index={1}
                    icon={<Users className="h-5 w-5 text-blue-600"/>}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    title="Team Leaders"
                    subtitle="Management users"
                    value={userStats.teamLeaders}
                    progress={progressTeamLeaders}
                />

                <StatCard
                    index={2}
                    icon={<Users className="h-5 w-5 text-green-600"/>}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    title="Staff Users"
                    subtitle="Field agents"
                    value={userStats.staff}
                    progress={progressStaff}
                />

                <StatCard
                    index={3}
                    icon={<Activity className="h-5 w-5 text-purple-600"/>}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-600"
                    title="Active Users"
                    subtitle="Last 30 days"
                    value={userStats.active}
                    progress={progressActive}
                />
            </div>
        </div>
    );
};