import {BatchMetadata, BatchMetadataCreate, Team, User} from "@/models";
import {undefined} from "zod";
import ClientApi from "@/lib/utils/ClientApi";
import {DeferredObject} from "@/lib/request";

export interface BatchControllerActions<T> {
    byId(id: string): DeferredObject<T | null>;

    byBatchId(id: string): DeferredObject<T | null>;

    list(options?: any): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    create(data: any): DeferredObject<T | null>;

    update(id: string, updates: Partial<T>): DeferredObject<T | null>;

    delete(id: string): DeferredObject<boolean>;

    bulkDelete(ids: string[]): DeferredObject<boolean>;

    assignToTeam(batch_ids: string[], team_id: string): DeferredObject<boolean>;

    removeFromTeam(batch_ids: string[]): DeferredObject<boolean>;

    byTeam(team_id: string, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    byCompany(company_name: string, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    byDateRange(start_date: string, end_date: string, date_field?: string, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    statistics(filters?: any): DeferredObject<any>;

    checkBatchIdExists(batch_id: string, exclude_id?: string): DeferredObject<{ exists: boolean } | null>;

    getCompanies(): DeferredObject<string[] | null>;

    getCollectionPoints(): DeferredObject<string[] | null>;

    utilization(filters?: any): DeferredObject<any>;

    search(query: string, filters?: any, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;
}


export type Batch = {
    id: string;
    batch_id: string;
    order_number?: string;
    requisition_number?: string;
    company_name?: string;
    collection_point?: string;
    move_order_number?: string;
    date_created?: string; // ISO date string
    lot_numbers?: string[];
    item_description?: string;
    quantity?: number;
    team_id?: string;
    created_by_user_id?: string;
    created_by?:User;
    team?:Team;
};
const BatchController = {
    async byId(id: string): Promise<BatchMetadata | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .byId(id)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching batch:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching batch:', error);
                    resolve(null);
                });
        });
    },
    async byBatchId(id: string): Promise<Batch | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .byBatchId(id)
                .then(response => {
                    if (response.ok) {
                        const batch = response.data as (BatchMetadata & {sim_count:any,team:any,created_by:any});
                        resolve({
                            id: batch.id,
                            batch_id: batch.batch_id,
                            order_number: batch.order_number,
                            requisition_number: batch.requisition_number,
                            company_name: batch.company_name,
                            collection_point: batch.collection_point,
                            move_order_number: batch.move_order_number,
                            date_created: batch.date_created,
                            lot_numbers: batch.lot_numbers,
                            item_description: batch.item_description,
                            quantity: batch.sim_count[0]?.count,
                            team:batch.team,
                            created_by:batch.created_by
                        });
                    } else {
                        console.error('Error fetching batch:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching batch:', error);
                    resolve(null);
                });
        });
    },

    async list(options: {
        page?: number;
        limit?: number;
        team_id?: string;
        teams?: string[];
        company_name?: string;
        collection_point?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
        created_by_user_id?: string;
    } = {}): Promise<{
        items: BatchMetadata[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .list(options)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching batches:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching batches:', error);
                    resolve(null);
                });
        });
    },

    async create(data: BatchMetadataCreate): Promise<BatchMetadata | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .create(data)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error creating batch:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error creating batch:', error);
                    resolve(null);
                });
        });
    },

    async update(id: string, updates: Partial<BatchMetadata>): Promise<BatchMetadata | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .update(id, updates)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error updating batch:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error updating batch:', error);
                    resolve(null);
                });
        });
    },

    async delete(id: string): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .delete(id)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error deleting batch:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error deleting batch:', error);
                    resolve(false);
                });
        });
    },

    async bulkDelete(ids: string[]): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .bulkDelete(ids)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error bulk deleting batches:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error bulk deleting batches:', error);
                    resolve(false);
                });
        });
    },

    async assignToTeam(batch_ids: string[], team_id: string): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .assignToTeam(batch_ids, team_id)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error assigning batches to team:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error assigning batches to team:', error);
                    resolve(false);
                });
        });
    },

    async removeFromTeam(batch_ids: string[]): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .removeFromTeam(batch_ids)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error removing batches from team:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error removing batches from team:', error);
                    resolve(false);
                });
        });
    },

    async byTeam(team_id: string, page?: number, limit?: number): Promise<{
        items: BatchMetadata[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .byTeam(team_id, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching batches by team:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching batches by team:', error);
                    resolve(null);
                });
        });
    },

    async byCompany(company_name: string, page?: number, limit?: number): Promise<{
        items: BatchMetadata[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .byCompany(company_name, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching batches by company:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching batches by company:', error);
                    resolve(null);
                });
        });
    },

    async byDateRange(start_date: string, end_date: string, date_field: string = 'date_created', page?: number, limit?: number): Promise<{
        items: BatchMetadata[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .byDateRange(start_date, end_date, date_field as 'created_at' | 'date_created', page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching batches by date range:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching batches by date range:', error);
                    resolve(null);
                });
        });
    },

    async statistics(filters: {
        team_id?: string;
        company_name?: string;
        date_from?: string;
        date_to?: string;
    } = {}): Promise<any> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .statistics(filters)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching batch statistics:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching batch statistics:', error);
                    resolve(null);
                });
        });
    },

    async checkBatchIdExists(batch_id: string, exclude_id?: string): Promise<{ exists: boolean } | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .checkBatchIdExists(batch_id, exclude_id)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error checking batch ID:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error checking batch ID:', error);
                    resolve(null);
                });
        });
    },

    async getCompanies(): Promise<string[] | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .getCompanies()
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching companies:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching companies:', error);
                    resolve(null);
                });
        });
    },

    async getCollectionPoints(): Promise<string[] | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .getCollectionPoints()
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching collection points:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching collection points:', error);
                    resolve(null);
                });
        });
    },

    async utilization(filters: { batch_id?: string; team_id?: string } = {}): Promise<any> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .utilization(filters)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching batch utilization:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching batch utilization:', error);
                    resolve(null);
                });
        });
    },

    async search(query: string, filters: {
        team_id?: string;
        company_name?: string;
        collection_point?: string;
        date_from?: string;
        date_to?: string;
    } = {}, page: number = 1, limit: number = 50): Promise<{
        items: BatchMetadata[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("batch").get()
                .search(query, filters, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error searching batches:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error searching batches:', error);
                    resolve(null);
                });
        });
    }
};

// Additional utility methods for Batch management
export const BatchUtils = {
    // Get batches that need attention
    // async getNeedsAttention(): Promise<BatchMetadata[]> {
    //     const results = await Promise.all([
    //         BatchController.list({ team_id: null, limit: 50 }), // Unassigned batches
    //         ClientApi.of("batch").get().getLowUtilization(20), // Low utilization
    //         ClientApi.of("batch").get().getEmptyBatches() // Empty batches
    //     ]);
    //
    //     const unassigned = results[0]?.items || [];
    //     const lowUtilization = results[1]?.ok ? results[1].data : [];
    //     const empty = results[2]?.ok ? results[2].data : [];
    //
    //     // Combine and deduplicate
    //     const combined = [...unassigned, ...lowUtilization, ...empty];
    //     const unique = combined.filter((batch, index, self) =>
    //         index === self.findIndex(b => b.id === batch.id)
    //     );
    //
    //     return unique;
    // },

    // Get batch dashboard summary
    // async getDashboardSummary(team_id?: string, days: number = 30) {
    //     const date_from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    //     const date_to = new Date().toISOString().split('T')[0];
    //
    //     const [stats, utilization, recent] = await Promise.all([
    //         BatchController.statistics({ team_id, date_from, date_to }),
    //         BatchController.utilization({ team_id }),
    //         ClientApi.of("batch").get().getRecent(7)
    //     ]);
    //
    //     const avgUtilization = utilization && utilization.length > 0
    //         ? utilization.reduce((sum: number, u: any) => sum + u.utilization_rate, 0) / utilization.length
    //         : 0;
    //
    //     return {
    //         totalBatches: stats?.total || 0,
    //         totalQuantity: stats?.total_quantity || 0,
    //         averageQuantity: stats?.average_quantity || 0,
    //         batchesThisMonth: stats?.this_month || 0,
    //         quantityThisMonth: stats?.quantity_this_month || 0,
    //         recentBatches: recent?.ok ? recent.data.items.length : 0,
    //         averageUtilization: Math.round(avgUtilization),
    //         companies: Object.keys(stats?.by_company || {}).length,
    //         topCompany: stats?.by_company ? Object.keys(stats.by_company).reduce((a, b) =>
    //             stats.by_company[a] > stats.by_company[b] ? a : b, Object.keys(stats.by_company)[0]
    //         ) : null
    //     };
    // },

    // Validate batch form data
    validateBatchData(batchData: Partial<BatchMetadata>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!batchData.batch_id?.trim()) {
            errors.push('Batch ID is required');
        }

        if (!batchData.company_name?.trim()) {
            errors.push('Company name is required');
        }

        //@ts-ignore
        if (batchData.quantity !== undefined && (batchData.quantity < 0 || !Number.isInteger(batchData.quantity))) {
            errors.push('Quantity must be a positive integer');
        }

        if (batchData.date_created && !isValidDate(batchData.date_created)) {
            errors.push('Invalid date format');
        }

        if (batchData.lot_numbers && !Array.isArray(batchData.lot_numbers)) {
            errors.push('Lot numbers must be an array');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Format batch display name
    formatBatchName(batch: BatchMetadata): string {
        return `${batch.batch_id} (${batch.company_name})`;
    },

    // Get utilization color for UI
    getUtilizationColor(utilizationRate: number): string {
        if (utilizationRate < 20) return 'red';
        if (utilizationRate < 50) return 'yellow';
        if (utilizationRate < 80) return 'blue';
        return 'green';
    },

    // Get utilization status text
    getUtilizationStatus(utilizationRate: number): string {
        if (utilizationRate === 0) return 'Empty';
        if (utilizationRate < 20) return 'Very Low';
        if (utilizationRate < 50) return 'Low';
        if (utilizationRate < 80) return 'Good';
        if (utilizationRate < 100) return 'High';
        return 'Full';
    },

    // Calculate batch value (if you have pricing)
    calculateBatchValue(batch: BatchMetadata, pricePerUnit: number = 0): number {
        return (batch.quantity || 0) * pricePerUnit;
    },

    // Get batch age in days
    getBatchAge(batch: BatchMetadata): number {
        const createdDate = new Date(batch.date_created || batch.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdDate.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    },

    // Format batch age
    formatBatchAge(batch: BatchMetadata): string {
        const days = this.getBatchAge(batch);
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return `${Math.floor(days / 365)} years ago`;
    },

    // Get company options for dropdowns
    async getCompanyOptions(): Promise<{ value: string; label: string }[]> {
        const companies = await BatchController.getCompanies();
        return companies?.map(company => ({
            value: company,
            label: company
        })) || [];
    },

    // Get collection point options for dropdowns
    async getCollectionPointOptions(): Promise<{ value: string; label: string }[]> {
        const points = await BatchController.getCollectionPoints();
        return points?.map(point => ({
            value: point,
            label: point
        })) || [];
    },

    // Generate batch report summary
    generateReportSummary(stats: any): string {
        if (!stats) return 'No data available';

        const avgUtilization = stats.utilization_data
            ? stats.utilization_data.reduce((sum: number, u: any) => sum + u.utilization_rate, 0) / stats.utilization_data.length
            : 0;

        return `Total batches: ${stats.total || 0}, Total quantity: ${(stats.total_quantity || 0).toLocaleString()}, ` +
            `Average utilization: ${avgUtilization.toFixed(1)}%, Companies: ${Object.keys(stats.by_company || {}).length}`;
    },

    // Quick batch analysis
    analyzeUtilization(utilization: any[]): {
        total: number;
        empty: number;
        low: number;
        good: number;
        high: number;
        full: number;
    } {
        if (!utilization || !Array.isArray(utilization)) {
            return {total: 0, empty: 0, low: 0, good: 0, high: 0, full: 0};
        }

        return {
            total: utilization.length,
            empty: utilization.filter(u => u.utilization_rate === 0).length,
            low: utilization.filter(u => u.utilization_rate > 0 && u.utilization_rate < 50).length,
            good: utilization.filter(u => u.utilization_rate >= 50 && u.utilization_rate < 80).length,
            high: utilization.filter(u => u.utilization_rate >= 80 && u.utilization_rate < 100).length,
            full: utilization.filter(u => u.utilization_rate === 100).length
        };
    },

    // Format quantity with units
    formatQuantity(quantity: number): string {
        if (quantity >= 1000000) {
            return `${(quantity / 1000000).toFixed(1)}M`;
        }
        if (quantity >= 1000) {
            return `${(quantity / 1000).toFixed(1)}K`;
        }
        return quantity.toString();
    },

    // Quick batch setup helper
    async quickBatchSetup(batch_id: string, quantity: number, company_name: string, team_id?: string) {
        const batchData: any = {
            batch_id,
            quantity,
            company_name,
            date_created: new Date().toISOString().split('T')[0],
            lot_numbers: []
        };

        if (team_id) batchData.team_id = team_id;

        return BatchController.create(batchData);
    }
};

// Helper function for date validation
function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

export default BatchController;