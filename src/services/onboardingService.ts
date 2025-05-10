import { createSupabaseClient } from "@/lib/supabase/client";
import {OnboardingRequestCreate, OnboardingRequestStatus, OnboardingRequestUpdate} from "@/models";

export const onboardingService = {
    // Get all onboarding requests
    async getAllRequests() {
        const supabase = createSupabaseClient();
        return supabase
            .from('onboarding_requests')
            .select(`
        *,
        requestedBy:requested_by_id(full_name,role),
        reviewedBy:reviewed_by_id(full_name,role),
        teams:team_id(*)
      `)
            .order('created_at', {ascending: false});
    },

    // Get pending onboarding requests
    async getPendingRequests() {
        const supabase = createSupabaseClient();
        return supabase
            .from('onboarding_requests')
            .select(`
        *,
        requestedBy:requested_by_id(full_name),
        teams:team_id(name)
      `)
            .eq('status', OnboardingRequestStatus.PENDING)
            .order('created_at', {ascending: false});
    },

    // Get onboarding requests by team
    async getRequestsByTeam(teamId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('onboarding_requests')
            .select(`
        *,
        requestedBy:requested_by_id(full_name),
        reviewedBy:reviewed_by_id(full_name)
      `)
            .eq('team_id', teamId)
            .order('created_at', {ascending: false});
    },

    // Get onboarding requests by requested user
    async getRequestsByUser(userId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('onboarding_requests')
            .select(`
        *,
        reviewedBy:reviewed_by_id(full_name),
        teams:team_id(name)
      `)
            .eq('requested_by_id', userId)
            .order('created_at', {ascending: false});
    },

    // Get a single onboarding request by ID
    async getRequestById(requestId: string) {
        const supabase = createSupabaseClient();
        return supabase
            .from('onboarding_requests')
            .select(`
        *,
        requestedBy:requested_by_id(full_name),
        reviewedBy:reviewed_by_id(full_name),
        teams:team_id(name)
      `)
            .eq('id', requestId)
            .single();
    },

    // Create a new onboarding request
    async createRequest(requestData: OnboardingRequestCreate) {
        const supabase = createSupabaseClient();
        return supabase
            .from('onboarding_requests')
            .insert(requestData)
            .select()
            .single();
    },

    // Update request status (approve/reject)
    async updateRequestStatus(
        requestId: string,
        statusData: OnboardingRequestUpdate & { reviewerId: string }
    ) {
        const supabase = createSupabaseClient();
        const {reviewerId, ...updateData} = statusData;

        return supabase
            .from('onboarding_requests')
            .update({
                ...updateData,
                reviewed_by_id: reviewerId,
                review_date: new Date().toISOString()
            })
            .eq('id', requestId)
            .select()
            .single();
    }
};