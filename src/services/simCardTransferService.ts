import {createSupabaseClient} from "@/lib/supabase/client";
import {
  NotificationType,
  SimCardTransfer,
  SimCardTransferCreate,
  SimCardTransferUpdate,
  TransferStatus
} from "@/models";
import {notificationService} from "./notificationService";

export const simCardTransferService = {
  /**
   * Create a new SIM card transfer request
   */
  async createTransferRequest(transferData: SimCardTransferCreate): Promise<{ data: SimCardTransfer | null; error: any }> {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('sim_card_transfers')
      .insert({
        source_team_id: transferData.source_team_id,
        destination_team_id: transferData.destination_team_id,
        requested_by_id: transferData.requested_by_id,
        admin_id: transferData.admin_id,
        sim_cards: transferData.sim_cards,
        reason: transferData.reason || '',
        notes: transferData.notes || '',
        status: TransferStatus.PENDING,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get transfer requests with various filters
   */
  async getTransferRequests({
    sourceTeamId,
    destinationTeamId,
    status,
    requestedById,
    adminId,
    page = 1,
    pageSize = 10,
      // startSate
  }: {
    sourceTeamId?: string;
    destinationTeamId?: string;
    status?: TransferStatus;
    requestedById?: string;
    adminId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: SimCardTransfer[] | null; count: number; error: any }> {
    const supabase = createSupabaseClient();

    let query = supabase
      .from('sim_card_transfers')
      .select('*', { count: 'exact' });

    if (sourceTeamId) {
      query = query.eq('source_team_id', sourceTeamId);
    }

    if (destinationTeamId) {
      query = query.eq('destination_team_id', destinationTeamId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (requestedById) {
      query = query.eq('requested_by_id', requestedById);
    }

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    // Add pagination
    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;

    return { data, count: count || 0, error };
  },

  /**
   * Get a single transfer request by ID
   */
  async getTransferRequestById(transferId: string): Promise<{ data: SimCardTransfer | null; error: any }> {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('sim_card_transfers')
      .select(`
        *,
        source_team:source_team_id(id, name),
        destination_team:destination_team_id(id, name),
        requested_by:requested_by_id(id, full_name),
        approved_by:approved_by_id(id, full_name)
      `)
      .eq('id', `${transferId}::uuid`)
      .single();

    return { data, error };
  },

  /**
   * Update a transfer request
   */
  async updateTransferRequest(
    transferId: string, 
    updateData: SimCardTransferUpdate
  ): Promise<{ data: SimCardTransfer | null; error: any }> {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('sim_card_transfers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Cancel a transfer request (can only be done by the requester and if status is pending)
   */
  async cancelTransferRequest(
    transferId: string, 
    userId: string
  ): Promise<{ data: SimCardTransfer | null; error: any }> {
    const supabase = createSupabaseClient();

    // First check if the request exists and is pending
    const { data: existingTransfer, error: fetchError } = await supabase
      .from('sim_card_transfers')
      .select('*')
      .eq('id', transferId)
      .eq('requested_by_id', userId)
      .eq('status', TransferStatus.PENDING)
      .single();

    if (fetchError || !existingTransfer) {
      return { 
        data: null, 
        error: fetchError || new Error('Transfer request not found or cannot be cancelled') 
      };
    }

    // Update the status to cancelled
    const { data, error } = await supabase
      .from('sim_card_transfers')
      .update({
        status: TransferStatus.CANCELLED,
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .eq('requested_by_id', userId)
      .eq('status', TransferStatus.PENDING)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Approve a transfer request (can only be done by an admin)
   */
  async approveTransferRequest(
    transferId: string, 
    adminId: string
  ): Promise<{ data: SimCardTransfer | null; error: any }> {
    const supabase = createSupabaseClient();

    // First, get the transfer request to access sim_cards and destination_team_id
    const { data: transferRequest, error: fetchError } = await supabase
      .from('sim_card_transfers')
      .select('*')
      .eq('id', transferId)
      .eq('status', TransferStatus.PENDING)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    // Update the status to approved
    const { data, error } = await supabase
      .from('sim_card_transfers')
      .update({
        status: TransferStatus.APPROVED,
        approved_by_id: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .eq('status', TransferStatus.PENDING)
      .select()
      .single();

    if (error) {
      return { data, error };
    }

    // Update the team_id for each SIM card in the transfer
    const simCards = transferRequest.sim_cards || [];
    const destinationTeamId = transferRequest.destination_team_id;

    if (simCards.length > 0) {
      const { error: updateSimCardsError } = await supabase
        .from('sim_cards')
        .update({
          team_id: destinationTeamId,
          updated_at: new Date().toISOString()
        })
        .in('id', simCards);

      if (updateSimCardsError) {
        return { data, error: updateSimCardsError };
      }
    }

    return { data, error };
  },

  /**
   * Reject a transfer request (can only be done by an admin)
   */
  async rejectTransferRequest(
    transferId: string, 
    adminId: string,
    reason: string
  ): Promise<{ data: SimCardTransfer | null; error: any }> {
    const supabase = createSupabaseClient();

    // Update the status to rejected
    const { data, error } = await supabase
      .from('sim_card_transfers')
      .update({
        status: TransferStatus.REJECTED,
        approved_by_id: adminId,
        notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .eq('status', TransferStatus.PENDING)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get unsold SIM cards for a team (for transfer selection)
   */
  async getUnsoldSimCards(teamId: string): Promise<{ data: any[] | null; error: any }> {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('sim_cards')
      .select('id, serial_number, status, lot')
      .eq('team_id', teamId)
      .neq('status', 'sold');

    return { data, error };
  },

  /**
   * Create a notification for a transfer request
   */
  async createTransferNotification(
    transferRequest: SimCardTransfer, 
    recipientId: string, 
    action: 'created' | 'approved' | 'rejected' | 'cancelled'
  ): Promise<void> {
    let title = '';
    let message = '';

    // Get team names for better notification messages
    const supabase = createSupabaseClient();
    const { data: sourceTeam } = await supabase
      .from('teams')
      .select('name')
      .eq('id', transferRequest.source_team_id)
      .single();

    const { data: destinationTeam } = await supabase
      .from('teams')
      .select('name')
      .eq('id', transferRequest.destination_team_id)
      .single();

    const sourceTeamName = sourceTeam?.name || 'Unknown team';
    const destinationTeamName = destinationTeam?.name || 'Unknown team';
    const simCardCount = Array.isArray(transferRequest.sim_cards) 
      ? transferRequest.sim_cards.length 
      : 0;

    switch (action) {
      case 'created':
        title = 'New SIM Card Transfer Request';
        message = `A request to transfer ${simCardCount} SIM cards from ${sourceTeamName} to ${destinationTeamName} has been created.`;
        break;
      case 'approved':
        title = 'SIM Card Transfer Approved';
        message = `Your request to transfer ${simCardCount} SIM cards from ${sourceTeamName} to ${destinationTeamName} has been approved.`;
        break;
      case 'rejected':
        title = 'SIM Card Transfer Rejected';
        message = `Your request to transfer ${simCardCount} SIM cards from ${sourceTeamName} to ${destinationTeamName} has been rejected.`;
        break;
      case 'cancelled':
        title = 'SIM Card Transfer Cancelled';
        message = `A request to transfer ${simCardCount} SIM cards from ${sourceTeamName} to ${destinationTeamName} has been cancelled.`;
        break;
    }

    await notificationService.createNotification({
      user_id: recipientId,
      title,
      message,
      type: NotificationType.SYSTEM,
      metadata: {
        transfer_id: transferRequest.id,
        source_team_id: transferRequest.source_team_id,
        destination_team_id: transferRequest.destination_team_id,
        action
      }
    });
  },

  /**
   * Subscribe to transfer request changes
   */
  subscribeToTransferRequests(callback: (transfer: SimCardTransfer) => void): { unsubscribe: () => void } {
    const supabase = createSupabaseClient();

    const subscription = supabase
      .channel('sim_card_transfers_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sim_card_transfers'
        },
        (payload) => {
          callback(payload.new as SimCardTransfer);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      }
    };
  }
};
