export interface ActivityLog {
    id: string;
    created_at: string;
    user_id: string;
    action_type: string;
    details: any;
    ip_address?: string;
    device_info?: string;
    is_offline_action: boolean;
    sync_date?: string;
}

export interface ActivityLogCreate {
    user_id: string;
    action_type: string;
    details: any;
    ip_address?: string;
    device_info?: string;
    is_offline_action: boolean;
    sync_date?: string;
}