import {SIMStatus} from "@/models/types";

export interface SIMCard {
    id: string;
    created_at: string;
    batch_id?:string;
    assigned_on?: string;
    registered_on?: string;
    serial_number: string;
    customer_msisdn: string;
    customer_id_number: string;
    customer_id_front_url?: string;
    customer_id_back_url?: string;
    agent_msisdn: string;
    sold_by_user_id: string;
    sale_date: string;
    sale_location: string;
    activation_date?: string;
    top_up_amount?: number;
    bundle_purchase_date?: number;
    bundle_amount?: number;
    usage?: string;
    ba_msisdn?: string;
    mobigo?: string;
    top_up_date?: string;
    first_usage_date?: string;
    first_usage_amount?: number;
    assigned_to_user_id?: string;
    status: SIMStatus;
    team_id: string;
    region: string;
    fraud_flag?: boolean;
    fraud_reason?: string;
    quality_score?: number;
    match: SIMStatus;
    quality: SIMStatus;
    in_transit?: boolean;
}

export interface SIMCardCreate {
    serial_number: string;
    sold_by_user_id?: string | null;
    sale_location?: string;
    team_id?: string;
    match: SIMStatus;
    quality: SIMStatus;
    batch_id: string;
    registered_by_user_id: string;
    in_transit?: boolean;
    lot?: string;
}

export interface SIMCardUpdate {
    customer_msisdn?: string;
    customer_id_number?: string;
    customer_id_front_url?: string;
    customer_id_back_url?: string;
    activation_date?: string;
    top_up_amount?: number;
    top_up_date?: string;
    first_usage_date?: string;
    first_usage_amount?: number;
    status?: SIMStatus;
    fraud_flag?: boolean;
    fraud_reason?: string;
    match?: SIMStatus;
    quality?: SIMStatus;
    quality_score?: number;
    in_transit?: boolean;
}
