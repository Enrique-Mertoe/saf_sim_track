import {createSupabaseClient} from "@/lib/supabase";
import {ActivityLogCreate, SIMCardCreate} from "@/models";

export const syncService = {
  // Push offline stored SIM card sales
  async syncOfflineSimCards(simCards: SIMCardCreate[]) {
    const supabase = createSupabaseClient();
    // Use upsert to handle potential conflicts
    return supabase
        .from('sim_cards')
        .upsert(simCards, {
          onConflict: 'serial_number',
          ignoreDuplicates: false
        });
  },

  // Push offline stored activity logs
  async syncOfflineActivityLogs(logs: ActivityLogCreate[]) {
    const supabase = createSupabaseClient();
    return supabase
      .from('activity_logs')
      .insert(logs);
  },

  // Get data for offline use (limit to reduce data usage)
  async getDataForOffline(teamId: string) {
    const supabase = createSupabaseClient();

    // Get team members
    const { data: teamMembers, error: teamError } = await supabase
      .from('users')
      .select('id, full_name, role, staff_type')
      .eq('team_id', teamId);

    if (teamError) {
      return { data: null, error: teamError };
    }

    // Get recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSales, error: salesError } = await supabase
      .from('sim_cards')
      .select('serial_number, customer_msisdn, agent_msisdn, sold_by_user_id, sale_date')
      .eq('team_id', teamId)
      .gte('sale_date', thirtyDaysAgo.toISOString())
      .limit(1000); // Limit to reduce data size

    if (salesError) {
      return { data: null, error: salesError };
    }

    return {
      data: {
        lastSyncTime: new Date().toISOString(),
        teamMembers,
        recentSales
      },
      error: null
    };
  }
};