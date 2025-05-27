export interface BatchMetadata {
    id: string;
    created_at: string;
    batch_id: string;
    order_number?: string;
    requisition_number?: string;
    company_name?: string;
    collection_point?: string;
    move_order_number?: string;
    date_created?: string;
    lot_numbers?: string[];
    item_description?: string;
    quantity?: number;
    team_id: string;
    created_by_user_id: string;
}

export interface BatchMetadataCreate {
    batch_id: string;
    order_number?: string;
    requisition_number?: string;
    company_name?: string;
    collection_point?: string;
    move_order_number?: string;
    date_created?: string;
    lot_numbers?: string[];
    item_description?: string;
    quantity?: number;
    team_id: string;
    created_by_user_id: string;
}

export interface BatchMetadataUpdate {
    order_number?: string;
    requisition_number?: string;
    company_name?: string;
    collection_point?: string;
    move_order_number?: string;
    date_created?: string;
    lot_numbers?: string[];
    item_description?: string;
    quantity?: number;
}