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