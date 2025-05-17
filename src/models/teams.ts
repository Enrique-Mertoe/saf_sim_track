export interface Team {
    id: string;
    created_at: string;
    name: string;
    leader_id: string;
    region: string;
    territory?: string;
    van_number_plate?: string;
    van_location?: string;
    is_active: boolean;
}

export interface TeamCreate {
    name: string;
    leader_id: string;
    region: string;
    territory?: string;
    van_number_plate?: string;
    van_location?: string;
}

export interface TeamUpdate {
    name?: string;
    leader_id?: string;
    region?: string;
    territory?: string;
    van_number_plate?: string;
    van_location?: string;
    is_active?: boolean;
}

export type TeamHierarchy = {
    id: string; // team UUID
    name: string;
    leader_id: string;
    leader_name: string;
    active_member_count: number;
    staff: {
        user_id: string;
        full_name: string;
        role: string;
        staff_type: string;
        sim_sales_count: number;
    }[];
};

export type TeamStatsPerf = {
  totalMembers: number;
  matchRate: number;
  qualityPercentage: number;     // as percentage (0–100)
  monthlyTarget: number;
  targetCompletion: number;      // as percentage (0–100)
  performanceTrend: number;      // as percentage (0–100)
};
