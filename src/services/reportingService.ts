import { createSupabaseClient } from "@/lib/supabase";

export const reportingService = {
  // Get overall sales summary
  async getSalesSummary(
    fromDate?: string,
    toDate?: string,
    teamId?: string,
    region?: string
  ) {
    const supabase = createSupabaseClient();
    let query = supabase
      .from('sim_cards')
      .select('*', { count: 'exact' });

    // Apply filters if provided
    if (fromDate) {
      query = query.gte('sale_date', fromDate);
    }

    if (toDate) {
      query = query.lte('sale_date', toDate);
    }

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (region) {
      query = query.eq('region', region);
    }

    const { count: totalSales, error: countError } = await query;

    if (countError) {
      return { data: null, error: countError };
    }

    // Get activation rate
    query = supabase
      .from('sim_cards')
      .select('id', { count: 'exact' })
      .eq('status', 'activated');

    // Apply same filters
    if (fromDate) {
      query = query.gte('sale_date', fromDate);
    }

    if (toDate) {
      query = query.lte('sale_date', toDate);
    }

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (region) {
      query = query.eq('region', region);
    }

    const { count: activatedCount, error: activationError } = await query;

    if (activationError) {
      return { data: null, error: activationError };
    }

    // Get average top-up
    query = supabase
      .from('sim_cards')
      .select('top_up_amount')
      .not('top_up_amount', 'is', null);

    // Apply same filters again
    if (fromDate) {
      query = query.gte('sale_date', fromDate);
    }

    if (toDate) {
      query = query.lte('sale_date', toDate);
    }

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (region) {
      query = query.eq('region', region);
    }

    const { data: topUpData, error: topUpError } = await query;

    if (topUpError) {
      return { data: null, error: topUpError };
    }

    const avgTopUp = topUpData.length > 0
      ? topUpData.reduce((sum: any, item: { top_up_amount: any; }) => sum + (item.top_up_amount || 0), 0) / topUpData.length
      : 0;

    return {
      data: {
        totalSales: totalSales || 0,
        activatedCount: activatedCount || 0,
        activationRate: totalSales ? (activatedCount || 0) / totalSales : 0,
        avgTopUp
      },
      error: null
    };
  },

  // Get team performance comparison
  async getTeamsPerformance(period?: string) {
    const supabase = createSupabaseClient();
    let query = supabase
      .from('team_performance')
      .select('*');

    if (period) {
      query = query.eq('period', period);
    }

    return await query;
  },

  // Get sales by region
  async getSalesByRegion(
    fromDate?: string,
    toDate?: string
  ) {
    const supabase = createSupabaseClient();
    let query = supabase
      .from('sim_cards')
      .select('region, count(*)')
      .groupBy('region');

    if (fromDate) {
      query = query.gte('sale_date', fromDate);
    }

    if (toDate) {
      query = query.lte('sale_date', toDate);
    }

    return await query;
  },

  // Get monthly sales trend
  async getMonthlySalesTrend(
    months: number = 6,
    teamId?: string
  ) {
    const supabase = createSupabaseClient();

    // Calculate the date 'months' months ago
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - months);

    let query = supabase
      .from('sim_cards')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Process data to get monthly counts
    const monthlyData: Record<string, number> = {};

    for (let i = 0; i < months; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }

    data.forEach((item: { created_at: string | number | Date; }) => {
      const date = new Date(item.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey]++;
      }
    });

    // Convert to array format for charts
    const result = Object.entries(monthlyData)
      .map(([month, count]) => ({ month, count }))
      .reverse(); // Most recent month last

    return { data: result, error: null };
  },

  // Get fraud detection report
  async getFraudReport(
    fromDate?: string,
    toDate?: string,
    teamId?: string
  ) {
    const supabase = createSupabaseClient();
    let query = supabase
      .from('sim_cards')
      .select(`
        id, 
        serial_number,
        customer_msisdn,
        agent_msisdn,
        users:sold_by_user_id(full_name),
        teams:team_id(name),
        sale_date,
        fraud_reason
      `)
      .eq('fraud_flag', true);

    if (fromDate) {
      query = query.gte('sale_date', fromDate);
    }

    if (toDate) {
      query = query.lte('sale_date', toDate);
    }

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    return await query;
  }
};