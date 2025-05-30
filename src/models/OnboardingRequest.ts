import {OnboardingRequestStatus, StaffType, UserRole} from "@/models/types";
import {User} from "@/models/users";
import {Team} from "@/models/teams";

export interface OnboardingRequest {
    id: string;
    created_at: string;
    requested_by_id: string;
    full_name: string;
    email?: string;
    id_number: string;
    id_front_url: string;
    id_back_url: string;
    phone_number?: string;
    username?: string;
    mobigo_number?: string;
    requestedBy?: User
    role: UserRole;
    team_id?: string;
    teams?: Team;
    staff_type?: StaffType;
    status: OnboardingRequestStatus;
    request_type: "ONBOARDING" | "DELETION";
    reviewed_by_id?: string;
    review_date?: string;
    review_notes?: string;
}

export interface OnboardingRequestCreate {
    requested_by_id: string;
    user_id?: string;
    full_name: string;
    email?: string;
    id_number: string;
    id_front_url: string;
    id_back_url: string;
    phone_number?: string;
    mobigo_number?: string;
    role: UserRole;
    request_type: "ONBOARDING" | "DELETION";
    team_id?: string;
    staff_type?: StaffType;
    admin_id: string;
    username?: string;
}

export interface OnboardingRequestUpdate {
    status?: OnboardingRequestStatus;
    reviewed_by_id?: string;
    review_date?: string;
    review_notes?: string;
    user_id?: string | null;
}