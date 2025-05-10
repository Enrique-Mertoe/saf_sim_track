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
    status: UserStatus;
    staff_type?: StaffType;
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
}