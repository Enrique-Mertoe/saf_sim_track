import {ChevronRight} from "lucide-react";
import {useEffect, useState} from "react";
import {SIMStatus} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";
import {DateTime} from "luxon";
import {admin_id} from "@/services/helper";

const supabase = createSupabaseClient()
export default function TeamStats({team, user, dataType,setSelectedTeam,setView}) {
    const [stats, setStats] = useState(null);
    const getFilterConditions = (adminId, break_at = false) => {
        if (!user) return null;
        const teamId = team.id

        // Create a fresh query builder each time
        let query = supabase
            .from('sim_cards')
            .select('*', {count: 'exact', head: true})
            .eq("admin_id", adminId);

        if (teamId) {
            query = query.eq('team_id', teamId);
        }
        if (break_at) return query;

        switch (dataType) {
            case 'activated':
                return query.eq('status', SIMStatus.ACTIVATED);
            case 'unmatched':
                return query.eq('match', SIMStatus.UNMATCH);
            case 'quality':
                return query.eq('quality', SIMStatus.QUALITY);
            case 'registered':
                return query.eq('status', SIMStatus.REGISTERED);
            default:
                return query;
        }
    };

    const getTerm = ()=>{
        switch (dataType) {
            case 'activated':
                return [dataType,"registered by"]
            case 'unmatched':
                return [dataType,"registered by"];
            case 'quality':
                return [dataType,"registered by"];
            case 'registered':
                return ['registered','assigned to'];
            default:
                return [dataType,dataType];
        }
    }

    const getOutOf =(adminId)=>{
        switch (dataType){
            case "registered":
                return getFilterConditions(adminId, true).not("assigned_to_user_id", "is", null);
            default:
                return getFilterConditions(adminId, true).eq('status', SIMStatus.REGISTERED);
        }
    }
    const fetchStats = async () => {
        const adminId = await admin_id(user);
        const today = DateTime.now().setZone("Africa/Nairobi");
        const startOfToday = today.startOf("day").toJSDate();
        const startOfWeek = today.minus({days: 7}).startOf("day").toJSDate();

        // Execute queries in parallel - each gets a fresh query builder
        const [totalResult, outOf, todayResult, weekResult] = await Promise.all([
            getFilterConditions(adminId),
            getOutOf(adminId),
            getFilterConditions(adminId)?.gte('registered_on', startOfToday.toISOString()),
            getFilterConditions(adminId)?.gte('registered_on', startOfWeek.toISOString())
        ]);
        setStats({
            total: totalResult.count ?? 0,
            today: todayResult.count ?? 0,
            week: weekResult.count ?? 0,
            outOf: outOf.count ?? 0,
        })
    }
    useEffect(() => {
        fetchStats().then()
    }, [user]);
    return (
        <div
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => {
                setSelectedTeam(team.id);
                setView('batches');
            }}
        >
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-medium">{team.name}</h4>

                </div>
                <div className="flex space-x-2">
                    {
                        stats ?

                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                Today: {stats.today}
                            </span>
                            :
                            <p className={"bg-gray-200 px-8 rounded-sm py-2"}></p>
                    }
                    {
                        stats ?

                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                                This Week: {stats.week}
                            </span>
                            :
                            <p className={"bg-gray-200 px-8 rounded-sm py-2"}></p>
                    }


                </div>
                <ChevronRight size={16}/>
            </div>
            {
                stats ?

                    <p className="text-sm text-gray-500">{stats.total} <span className="text-blue-400 text-xs">{getTerm()[0]}</span> out of {stats.outOf} {getTerm()[1]} Ba</p>
                    :
                    <p className={"bg-gray-200 px-8 rounded-sm py-2"}></p>
            }
        </div>
    )
}