import {ActivityLogCreate} from "@/models";
import {createSupabaseClient} from "@/lib/supabase/client";

export const logService = {
    async createLog(logs: ActivityLogCreate[]) {
        const supabase = createSupabaseClient();
        return supabase
            .from('activity_logs')
            .insert(logs);
    },
}