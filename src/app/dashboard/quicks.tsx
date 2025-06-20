import {Activity, ArrowUpRight, BarChart4, Users} from "lucide-react";
import {CreateUser} from "@/ui/shortcuts";
import {useDialog} from "@/app/_providers/dialog";
import {FC, useEffect, useState} from "react";
import {userService} from "@/services";
import {UserRole} from "@/models";
import useApp from "@/ui/provider/AppProvider";
import {useRouter} from "next/navigation";

export default function DashQuickActions() {
    const dialog = useDialog()
    const {user} = useApp();
    const router = useRouter();
    return (
        <div className="">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Quick Actions</h2>
                <div className="space-y-1 flex flex-col  gap-2">
                    <button
                        onClick={() => CreateUser(dialog, user!, {})
                        }
                        className="w-full cursor-pointer flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/40 rounded-lg transition-colors">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full mr-4">
                                <Users className="h-5 w-5 text-green-600 dark:text-green-400"/>
                            </div>
                            <span
                                className="text-sm font-medium text-gray-900 dark:text-gray-100">Onboard New User</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400"/>
                    </button>
                    <button
                        onClick={() => router.push("/dashboard/report")}
                        className="w-full col-span-1 cursor-pointer flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-lg transition-colors">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full mr-4">
                                <BarChart4 className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                            </div>
                            <span
                                className="text-sm font-medium text-gray-900 dark:text-gray-100">Generate Report</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                    </button>
                    <button
                        onClick={() => router.push("/dashboard/team")}
                        className="w-full col-span-2 cursor-pointer flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800/40 rounded-lg transition-colors">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full mr-4">
                                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400"/>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">View Teams</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-purple-600 dark:text-purple-400"/>
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
    const {user} = useApp();

    useEffect(() => {
        const fetchUserStats = async (): Promise<void> => {
            if (!user) return
            try {
                setLoading(true);

                // Get all users
                const {data: allUsers, error: allUsersError} = await userService.getAllUsers(user);
                if (allUsersError) throw allUsersError;

                // Get team leaders
                const {
                    data: teamLeaders,
                    error: teamLeadersError
                } = await userService.getUsersByRole(UserRole.TEAM_LEADER, user);
                if (teamLeadersError) throw teamLeadersError;

                // Get staff users
                const {data: staffUsers, error: staffError} = await userService.getUsersByRole(UserRole.STAFF, user);
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
    }, [user]);

    // Animation for counting up


    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md">
                <div className="flex justify-center items-center ">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
                </div>
            </div>
        );
    }

    // Data for progress bars
    const totalUsers = userStats.total;
    const progressTeamLeaders = totalUsers > 0 ? (userStats.teamLeaders / totalUsers) * 100 : 0;
    const progressStaff = totalUsers > 0 ? (userStats.staff / totalUsers) * 100 : 0;
    const progressActive = totalUsers > 0 ? (userStats.active / totalUsers) * 100 : 0;


    return (
        <div
            className={`${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/*<StatCard*/}
                {/*    index={0}*/}
                {/*    icon={<Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400"/>}*/}
                {/*    iconBg="bg-indigo-100"*/}
                {/*    iconColor="text-indigo-600 dark:text-indigo-400"*/}
                {/*    title="Total Users"*/}
                {/*    subtitle="All system users"*/}
                {/*    value={userStats.total}*/}
                {/*    progress={100}*/}
                {/*/>*/}

                <StatCard
                    index={1}
                    icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400"/>}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600 dark:text-blue-400"
                    title="Team Leaders"
                    subtitle="Management users"
                    animate={animate}
                    value={userStats.teamLeaders}
                    cardVisible={cardVisible}
                    progress={progressTeamLeaders}
                />

                <StatCard
                    index={2}
                    icon={<Users className="h-5 w-5 text-green-600 dark:text-green-400"/>}
                    iconBg="bg-green-100"
                    iconColor="text-green-600 dark:text-green-400"
                    title="Staff Users"
                    subtitle="Field agents"
                    value={userStats.staff}
                    animate={animate}
                    progress={progressStaff}
                    cardVisible={cardVisible}
                />
            </div>
        </div>
    );
};

const Counter: FC<CounterProps & {animate:any}> = ({end,animate, duration = 2000}:any) => {
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

const StatCard: FC<StatCardProps & {cardVisible:any,animate:any}> = ({
                                         index,
                                         icon,
                                         iconBg,
                                         iconColor,
                                         title,
                                         subtitle,
                                         value,
                                         progress,
                                         cardVisible,
                                                             animate
                                     }) => {
    const cardClasses = `
      transform transition-all duration-500 ease-out
      ${cardVisible[index] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
      flex flex-col px-4 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 hover:border-gray-200 dark:hover:border-gray-500
    `;

    return (
        <div className={cardClasses}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                    <div
                        className={`p-2 ${iconBg.replace('bg-', 'bg-')} dark:${iconBg.replace('bg-', 'bg-').replace('100', '800')} rounded-full mr-4 transform transition-transform duration-300 hover:scale-110`}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                    </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    <Counter animate={animate} end={value}/>
                </div>
            </div>

            <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${iconColor.replace('text', 'bg')}`}
                        style={{
                            width: `${progress}%`,
                            transition: 'width 1.5s ease-in-out'
                        }}
                    ></div>
                </div>
                <div className="flex justify-end mt-1">
                        <span
                            className="text-xs text-gray-500 dark:text-gray-400">{Math.round(progress)}% of total</span>
                </div>
            </div>
        </div>
    );
};
