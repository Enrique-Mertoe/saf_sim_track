import {OnboardingRequestStatus, StaffType} from "@/models/types";

export interface OnboardingRequest {
    id: string;
    created_at: string;
    requested_by_id: string;
    full_name: string;
    id_number: string;
    id_front_url: string;
    id_back_url: string;
    phone_number: string;
    mobigo_number?: string;
    role: UserRole;
    team_id?: string;
    staff_type?: StaffType;
    status: OnboardingRequestStatus;
    reviewed_by_id?: string;
    review_date?: string;
    review_notes?: string;
}

export interface OnboardingRequestCreate {
    requested_by_id: string;
    full_name: string;
    id_number: string;
    id_front_url: string;
    id_back_url: string;
    phone_number: string;
    mobigo_number?: string;
    role: UserRole;
    team_id?: string;
    staff_type?: StaffType;
}

export interface OnboardingRequestUpdate {
    status?: OnboardingRequestStatus;
    reviewed_by_id?: string;
    review_date?: string;
    review_notes?: string;
}