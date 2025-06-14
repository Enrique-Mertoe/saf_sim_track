import useApp from "@/ui/provider/AppProvider";
import React, {useEffect, useState} from "react";
import simService from "@/services/simService";
import {SIMCard, Team, User} from "@/models";
import {AlertCircle, Award, BarChart, CheckCircle, RefreshCw, XCircle} from "lucide-react";
import Signal from "@/lib/Signal";
import {useDialog} from "@/app/_providers/dialog";
import StatCard from "@/app/dashboard/components/StatCard";
import {createSupabaseClient} from "@/lib/supabase/client";
import TeamBreakdownDialog from "@/app/dashboard/components/TeamsBreakDown";

type SimAdapter = SIMCard & {
    team_id: Team;
    sold_by_user_id: User;
}

const supabase = createSupabaseClient()
export default function SimStats({refreshing = false}) {
    const {user} = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);


    const dialog = useDialog();


    const handleRefresh = () => {
        // Clear cache to ensure fresh data
        if (user) {
            simService.cache.clearForUser(user.id);
        }

        setIsRefreshing(true);

        Signal.trigger("m-refresh", true);
    };
    useEffect(() => {
        if (user)
            setIsLoading(false)
    }, [user]);

    // Shimmer loading effect for each card
    const LoadingSkeleton = () => (
        <>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg animate-pulse flex items-start">
                    <div className="mr-4 bg-gray-200 dark:bg-gray-700 rounded-full p-2 w-10 h-10"></div>
                    <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            ))}
        </>
    );

    // Error state
    if (error) {
        return (
            <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg text-center flex flex-col items-center">
                    <AlertCircle size={36} className="text-red-500 dark:text-red-400 mb-2"/>
                    <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16}/>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }



    const statCards = [
        {
            title: "Registered",
            dataType: "registered",
            color: "blue",
            icon: <BarChart size={18}/>,
            expandable: true,
            tabs:["today","total"],
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            user={user!}
                            dataType = {"registered"}
                            title="Registered SIM Cards Breakdown"
                            teams={[]}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
        {
            title: "Active Lines",
            dataType: "activated",
            color: "green",
            tabs:["total"],
            icon: <CheckCircle size={20}/>,
            expandable: true,
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            title="Activated SIM Cards Breakdown"
                            teams={[]}
                            dataType={"activated"}
                            user={user!}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
        {
            title: "UnMatched",
            dataType: "unmatched",
            color: "red",
            tabs:["total"],
            icon: <XCircle size={20}/>,
            expandable: true,
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            user={user!}
                            title="Unmatched SIM Cards Breakdown"
                            teams={[]}
                            dataType={"unmatched"}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
        {
            title: "Quality Lines",
            dataType: "quality",
            color: "purple",
            tabs:["total"],
            icon: <Award size={20}/>,
            expandable: true,
            onExpandClick: () => {
                const dialogRef = dialog.create({
                    content: (
                        <TeamBreakdownDialog
                            user={user!}
                            title="Quality SIM Cards Breakdown"
                            teams={[]}
                            dataType={"unmatched"}
                            onClose={() => dialogRef.dismiss()}
                        />
                    ),
                    size: "lg",
                    design: ["scrollable"]
                });
            }
        },
    ];


    return (
        <div className="relative">
            {/* Refresh button */}
            <div className="flex  items-center mb-4">
                <button
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="p-2 rounded-full ms-auto bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1"
                    aria-label="Refresh stats"
                >
                    <RefreshCw
                        size={16}
                        className={`text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Refresh</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {isLoading && !isRefreshing ? (
                    <LoadingSkeleton/>
                ) : (
                    statCards.map((card, index) => (
                        <StatCard
                            //@ts-ignore
                            dataType={card.dataType}
                            supabase={supabase}
                            key={index}
                            title={card.title}
                            user={user}
                            tabs={card.tabs}
                            //@ts-ignore
                            color={card.color}
                            isRefreshing={isRefreshing}
                            icon={card.icon}
                            expandable={card.expandable}
                            onExpandClick={card.onExpandClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
}