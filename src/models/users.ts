import {StaffType, UserRole, UserStatus} from "@/models/types";

export interface User {
    id: string;
    created_at: string;
    email: string;
    full_name: string;
    id_number: string;
    id_front_url: string;
    id_back_url: string;
    phone_number: string;
    mobigo_number?: string;
    role: UserRole;
    team_id?: string;
    status: UserStatus;
    staff_type?: StaffType;
    is_active: boolean;
    last_login_at?: string;
    admin_id?: string;
    username?: string;
    password?: string;
    is_first_login?: boolean;
    subscription?: Subscription;
}

export interface UserCreate {
    email: string;
    password: string;
    full_name: string;
    id_number: string;
    id_front_url: string;
    id_back_url: string;
    phone_number: string;
    mobigo_number?: string;
    role: UserRole;
    team_id?: string;
    admin_id: string;
    status: UserStatus;
    staff_type?: StaffType;
    username?: string;
    is_first_login?: boolean;
}

export interface UserUpdate {
    email?: string;
    full_name?: string;
    id_number?: string;
    id_front_url?: string;
    id_back_url?: string;
    phone_number?: string;
    mobigo_number?: string;
    role?: UserRole;
    team_id?: string;
    status: UserStatus;
    staff_type?: StaffType;
    is_active?: boolean;
    last_login_at?: string;
    username?: string;
    password?: string;
    is_first_login?: boolean;
}

export type Subscription = {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    starts_at: string;
    expires_at: string;
    payment_reference?: string;
    auto_renew?: boolean;
    cancellation_date?: string;
    cancellation_reason?: string;
};
