import {ActivityLogCreate} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";

export const logService = {
    async createLog(logs: ActivityLogCreate[]) {
        const supabase = createSupabaseClient();
        return supabase
            .from('activity_logs')
            .insert(logs);
    },
    async recentLogs(userId: string, limit: number) {
        const supabase = createSupabaseClient();
        return supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', {ascending: false})
            .limit(limit);
    }
}