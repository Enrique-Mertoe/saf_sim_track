export enum TransferStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

export interface SimCardTransfer {
  id: string;
  created_at: string;
  updated_at: string;
  source_team_id: string;
  destination_team_id: string;
  requested_by_id: string;
  approved_by_id?: string;
  admin_id?: string;
  approval_date?: string;
  status: TransferStatus;
  reason?: string;
  sim_cards: string[]; // Array of SIM card IDs
  notes?: string;
}

export interface SimCardTransferCreate {
  source_team_id: string;
  destination_team_id: string;
  requested_by_id: string;
  admin_id?: string;
  sim_cards: string[];
  reason?: string;
  notes?: string;
}

export interface SimCardTransferUpdate {
  status?: TransferStatus;
  approved_by_id?: string;
  approval_date?: string;
  notes?: string;
}
