import {ChevronRight} from "lucide-react";
import {useEffect, useState} from "react";
import {SIMStatus} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";
import {DateTime} from "luxon";
import {admin_id} from "@/services/helper";

const supabase = createSupabaseClient()
export default function BatchStats({batch, user, dataType, selectedTeam, setSelectedBatch, setView, localDateFilter}) {
    const [stats, setStats] = useState(null);
    const getFilterConditions = (adminId, break_at = false) => {
        if (!user) return null;
        const batchId = batch.id;

        // Create a fresh query builder each time
        let query = supabase
            .from('sim_cards')
            .select('*', {count: 'exact', head: true})
            .eq("admin_id", adminId);

        if (selectedTeam) {
            query = query.eq('team_id', selectedTeam);
        }

        if (batchId) {
            query = query.eq('batch_id', batchId);
        }

        // Apply date filter if provided
        if (localDateFilter.startDate && localDateFilter.endDate) {
            query = query.gte('registered_on', localDateFilter.startDate.toISOString())
                         .lte('registered_on', localDateFilter.endDate.toISOString());
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

    const getTerm = () => {
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

    const getOutOf = (adminId) => {
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
    }, [user, localDateFilter, selectedTeam, batch.id]);

    // Determine which stats to show based on date filter
    const showTodayStat = !localDateFilter.startDate || 
                          (localDateFilter.startDate && 
                           localDateFilter.startDate.toDateString() !== new Date().toDateString());

    const showWeekStat = !localDateFilter.startDate || 
                         (localDateFilter.startDate && 
                          localDateFilter.startDate.toDateString() !== DateTime.now().minus({days: 7}).startOf("day").toJSDate().toDateString());

    // Get registered, assigned, and unassigned counts
    const registered = batch.stats.total;
    const assigned = batch.stats.matched;
    const unassigned = batch.stats.total - batch.stats.matched;

    return (
        <div
            key={batch.id}
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => {
                setSelectedBatch(batch.id);
                setView('users');
            }}
        >
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-medium">Batch: {batch.id === 'unassigned' ? 'Unassigned' : batch.id}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {
                        stats && showTodayStat ?
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-sm text-xs">
                                Today: {stats.today}
                            </span>
                            : stats ? null :
                            <p className={"bg-gray-200 px-8 rounded-sm py-2"}></p>
                    }
                    {
                        stats && showWeekStat ?
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-sm text-xs">
                                This Week: {stats.week}
                            </span>
                            : stats ? null :
                            <p className={"bg-gray-200 px-8 rounded-sm py-2"}></p>
                    }
                    {/*<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-sm text-xs">*/}
                    {/*    Registered: {registered}*/}
                    {/*</span>*/}
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-sm text-xs">
                        Assigned: {assigned}
                    </span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-sm text-xs">
                        Unassigned: {unassigned}
                    </span>
                </div>
                <ChevronRight size={16}/>
            </div>
            {
                stats ?
                    <p className="text-sm text-gray-500">Total: {batch.stats.total} SIM cards</p>
                    :
                    <p className={"bg-gray-200 px-8 rounded-sm py-2"}></p>
            }
        </div>
    )
}
