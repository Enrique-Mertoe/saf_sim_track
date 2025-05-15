import {SIMStatus} from "@/models/types";

export interface SIMCard {
    id: string;
    created_at: string;
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
    ba_msisdn?: number;
    top_up_date?: string;
    first_usage_date?: string;
    first_usage_amount?: number;
    status: SIMStatus;
    team_id: string;
    region: string;
    fraud_flag?: boolean;
    fraud_reason?: string;
    quality_score?: number;
}

export interface SIMCardCreate {
    serial_number: string;
    customer_msisdn: string;
    customer_id_number: string;
    customer_id_front_url?: string;
    customer_id_back_url?: string;
    agent_msisdn: string;
    sold_by_user_id: string;
    sale_date: string;
    sale_location: string;
    team_id: string;
    region: string;
    status: SIMStatus;
    top_up_amount?: number;
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
    quality_score?: number;
}