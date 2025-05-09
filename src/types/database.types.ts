export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    created_at: string;
                    email: string;
                    full_name: string;
                    id_number: string;
                    id_front_url: string;
                    id_back_url: string;
                    phone_number: string;
                    mobigo_number: string | null;
                    role: string;
                    team_id: string | null;
                    staff_type: string | null;
                    is_active: boolean;
                    last_login_at: string | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    email: string;
                    full_name: string;
                    id_number: string;
                    id_front_url: string;
                    id_back_url: string;
                    phone_number: string;
                    mobigo_number?: string | null;
                    role: string;
                    team_id?: string | null;
                    staff_type?: string | null;
                    is_active?: boolean;
                    last_login_at?: string | null;
                };
                Update: {
                    email?: string;
                    full_name?: string;
                    id_number?: string;
                    id_front_url?: string;
                    id_back_url?: string;
                    phone_number?: string;
                    mobigo_number?: string | null;
                    role?: string;
                    team_id?: string | null;
                    staff_type?: string | null;
                    is_active?: boolean;
                    last_login_at?: string | null;
                };
            };
            teams: {
                Row: {
                    id: string;
                    created_at: string;
                    name: string;
                    leader_id: string;
                    region: string;
                    territory: string | null;
                    van_number_plate: string | null;
                    van_location: string | null;
                    is_active: boolean;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    name: string;
                    leader_id: string;
                    region: string;
                    territory?: string | null;
                    van_number_plate?: string | null;
                    van_location?: string | null;
                    is_active?: boolean;
                };
                Update: {
                    name?: string;
                    leader_id?: string;
                    region?: string;
                    territory?: string | null;
                    van_number_plate?: string | null;
                    van_location?: string | null;
                    is_active?: boolean;
                };
            };
            sim_cards: {
                Row: {
                    id: string;
                    created_at: string;
                    serial_number: string;
                    customer_msisdn: string;
                    customer_id_number: string;
                    customer_id_front_url: string | null;
                    customer_id_back_url: string | null;
                    agent_msisdn: string;
                    sold_by_user_id: string;
                    sale_date: string;
                    sale_location: string;
                    activation_date: string | null;
                    top_up_amount: number | null;
                    top_up_date: string | null;
                    first_usage_date: string | null;
                    first_usage_amount: number | null;
                    status: string;
                    team_id: string;
                    region: string;
                    fraud_flag: boolean | null;
                    fraud_reason: string | null;
                    quality_score: number | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    serial_number: string;
                    customer_msisdn: string;
                    customer_id_number: string;
                    customer_id_front_url?: string | null;
                    customer_id_back_url?: string | null;
                    agent_msisdn: string;
                    sold_by_user_id: string;
                    sale_date: string;
                    sale_location: string;
                    activation_date?: string | null;
                    top_up_amount?: number | null;
                    top_up_date?: string | null;
                    first_usage_date?: string | null;
                    first_usage_amount?: number | null;
                    status: string;
                    team_id: string;
                    region: string;
                    fraud_flag?: boolean | null;
                    fraud_reason?: string | null;
                    quality_score?: number | null;
                };
                Update: {
                    serial_number?: string;
                    customer_msisdn?: string;
                    customer_id_number?: string;
                    customer_id_front_url?: string | null;
                    customer_id_back_url?: string | null;
                    activation_date?: string | null;
                    top_up_amount?: number | null;
                    top_up_date?: string | null;
                    first_usage_date?: string | null;
                    first_usage_amount?: number | null;
                    status?: string;
                    fraud_flag?: boolean | null;
                    fraud_reason?: string | null;
                    quality_score?: number | null;
                };
            };
            onboarding_requests: {
                Row: {
                    id: string;
                    created_at: string;
                    requested_by_id: string;
                    full_name: string;
                    id_number: string;
                    id_front_url: string;
                    id_back_url: string;
                    phone_number: string;
                    mobigo_number: string | null;
                    role: string;
                    team_id: string | null;
                    staff_type: string | null;
                    status: string;
                    reviewed_by_id: string | null;
                    review_date: string | null;
                    review_notes: string | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    requested_by_id: string;
                    full_name: string;
                    id_number: string;
                    id_front_url: string;
                    id_back_url: string;
                    phone_number: string;
                    mobigo_number?: string | null;
                    role: string;
                    team_id?: string | null;
                    staff_type?: string | null;
                    status?: string;
                    reviewed_by_id?: string | null;
                    review_date?: string | null;
                    review_notes?: string | null;
                };
                Update: {
                    status?: string;
                    reviewed_by_id?: string | null;
                    review_date?: string | null;
                    review_notes?: string | null;
                };
            };
            activity_logs: {
                Row: {
                    id: string;
                    created_at: string;
                    user_id: string;
                    action_type: string;
                    details: any;
                    ip_address: string | null;
                    device_info: string | null;
                    is_offline_action: boolean;
                    sync_date: string | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    user_id: string;
                    action_type: string;
                    details: any;
                    ip_address?: string | null;
                    device_info?: string | null;
                    is_offline_action: boolean;
                    sync_date?: string | null;
                };
                Update: {
                    sync_date?: string | null;
                };
            };
        };
        Views: {
            team_performance: {
                Row: {
                    team_id: string;
                    team_name: string;
                    leader_name: string;
                    sim_cards_sold: number;
                    activation_rate: number;
                    avg_top_up: number;
                    fraud_flags: number;
                    region: string;
                    period: string;
                };
            };
            staff_performance: {
                Row: {
                    user_id: string;
                    full_name: string;
                    team_id: string;
                    team_name: string;
                    sim_cards_sold: number;
                    activation_rate: number;
                    avg_top_up: number;
                    fraud_flags: number;
                    period: string;
                };
            };
        };
        Functions: {
            get_team_hierarchy: {
                Args: { team_id: string };
                Returns: {
                    team_id: string;
                    team_name: string;
                    leader_id: string;
                    leader_name: string;
                    staff_count: number;
                    staff: {
                        user_id: string;
                        full_name: string;
                        staff_type: string;
                        sim_sales_count: number;
                    }[];
                };
            };
            search_sim_cards: {
                Args: {
                    search_term: string;
                    status_filter?: string;
                    team_id?: string;
                    from_date?: string;
                    to_date?: string;
                };
                Returns: {
                    id: string;
                    serial_number: string;
                    customer_msisdn: string;
                    agent_msisdn: string;
                    sold_by_name: string;
                    sale_date: string;
                    status: string;
                    team_name: string;
                }[];
            };
        };
    };
};
