import {SIMCard, SIMCardCreate, SIMStatus} from "@/models";
import ClientApi from "@/lib/utils/ClientApi";
import {DeferredObject} from "@/lib/request";

export interface SimControllerActions<T> {
    byId(id: string): DeferredObject<T>;

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

    assignToUser(sim_ids: string[], user_id: string): DeferredObject<boolean>;

    unassignFromUser(sim_ids: string[]): DeferredObject<boolean>;

    updateStatus(sim_ids: string[], status: any): DeferredObject<boolean>;

    createSIMCardBatch(data: any, batchSize: number, progressCallback: Closure): DeferredObject<boolean>;

    byBatch(batch_id: string, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    byLot(lot: string, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    byTeam(team_id: string, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    byUser(user_id: string, type: 'sold' | 'assigned', page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    statistics(filters?: any): DeferredObject<any>;

    createBatch(data: any, batchSize: number, progressCallback: any): DeferredObject<any>;

    search(query: string, filters?: any, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    lotStatistics(lot: string): DeferredObject<any>;

// Get lot details
    lotDetails(lot: string): DeferredObject<any>;
}

const SimController = {
    async byId(id: string): Promise<SIMCard | null> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .byId(id)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching SIM card:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching SIM card:', error);
                    resolve(null);
                });
        });
    },

    async list(options: {
        page?: number;
        limit?: number;
        team_id?: string;
        status?: string;
        batch_id?: string;
        lot?: string;
        search?: string;
        sold_by_user_id?: string;
        assigned_to_user_id?: string;
    } = {}): Promise<{ items: SIMCard[]; total: number; page: number; limit: number; totalPages: number } | null> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .list(options)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching SIM cards:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching SIM cards:', error);
                    resolve(null);
                });
        });
    },
// ...existing methods

    async lotDetails(lot: string): Promise<any> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .lotDetails(lot)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching lot details:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching lot details:', error);
                    resolve(null);
                });
        });
    },
    async create(data: SIMCardCreate): Promise<SIMCard | null> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .create(data)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error creating SIM card:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error creating SIM card:', error);
                    resolve(null);
                });
        });
    },

    async update(id: string, updates: Partial<SIMCard>): Promise<SIMCard | null> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .update(id, updates)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error updating SIM card:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error updating SIM card:', error);
                    resolve(null);
                });
        });
    },

    async delete(id: string): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .delete(id)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error deleting SIM card:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error deleting SIM card:', error);
                    resolve(false);
                });
        });
    },

    async bulkDelete(ids: string[]): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .bulkDelete(ids)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error bulk deleting SIM cards:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error bulk deleting SIM cards:', error);
                    resolve(false);
                });
        });
    },

    async assignToUser(sim_ids: string[], user_id: string): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .assignToUser(sim_ids, user_id)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error assigning SIM cards:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error assigning SIM cards:', error);
                    resolve(false);
                });
        });
    },

    async unassignFromUser(sim_ids: string[]): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .unassignFromUser(sim_ids)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error unassigning SIM cards:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error unassigning SIM cards:', error);
                    resolve(false);
                });
        });
    },

    async updateStatus(sim_ids: string[], status: SIMStatus): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .updateStatus(sim_ids, status)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error updating SIM card status:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error updating SIM card status:', error);
                    resolve(false);
                });
        });
    },

    async byBatch(batch_id: string, page?: number, limit?: number): Promise<{
        items: SIMCard[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .byBatch(batch_id, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching SIM cards by batch:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching SIM cards by batch:', error);
                    resolve(null);
                });
        });
    },

    async byLot(lot: string, page?: number, limit?: number): Promise<{
        items: SIMCard[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .byLot(lot, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching SIM cards by lot:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching SIM cards by lot:', error);
                    resolve(null);
                });
        });
    },

    async byTeam(team_id: string, page?: number, limit?: number): Promise<{
        items: SIMCard[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .byTeam(team_id, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching SIM cards by team:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching SIM cards by team:', error);
                    resolve(null);
                });
        });
    },

    async byUser(user_id: string, type: 'sold' | 'assigned', page?: number, limit?: number): Promise<{
        items: SIMCard[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .byUser(user_id, type, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching SIM cards by user:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching SIM cards by user:', error);
                    resolve(null);
                });
        });
    },

    async statistics(filters: { team_id?: string; user_id?: string; batch_id?: string } = {}): Promise<any> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .statistics(filters)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching SIM statistics:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching SIM statistics:', error);
                    resolve(null);
                });
        });
    },

    async createBatch(data: any, batchSize: number, progressCallback: any): Promise<any> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .createSIMCardBatch(data, batchSize, progressCallback)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error creating SIM card batch:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error creating SIM card batch:', error);
                    resolve(null);
                });
        });
    },

    async search(query: string, filters: {
        team_id?: string;
        status?: string;
        batch_id?: string;
        lot?: string;
    } = {}, page: number = 1, limit: number = 50): Promise<{
        items: SIMCard[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("sim").get()
                .search(query, filters, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error searching SIM cards:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error searching SIM cards:', error);
                    resolve(null);
                });
        });
    }
};

// Additional utility methods that can be used directly
export const SimUtils = {
    // Get SIM cards that need attention (inactive, unassigned, etc.)
    async getNeedsAttention(team_id?: string): Promise<SIMCard[]> {
        const results = await Promise.all([
            SimController.list({status: 'INACTIVE', team_id, limit: 100}),
            //@ts-ignore
            SimController.list({assigned_to_user_id: null, team_id, limit: 100})
        ]);

        const inactive = results[0]?.items || [];
        const unassigned = results[1]?.items || [];

        // Combine and deduplicate
        const combined = [...inactive, ...unassigned];
        const unique = combined.filter((sim, index, self) =>
            index === self.findIndex(s => s.id === sim.id)
        );

        return unique;
    },

    // Get performance summary for dashboard
    // async getDashboardSummary(team_id?: string) {
    //     const stats = await SimController.statistics({team_id});
    //     const todaysSales = await ClientApi.of("sim").get().getSoldToday(team_id);
    //     const weeklyActivations = await ClientApi.of("sim").get().getActivatedThisWeek(team_id);
    //
    //     return {
    //         totalSIMs: stats?.total || 0,
    //         activationRate: stats?.activationRate || 0,
    //         matchRate: stats?.matchRate || 0,
    //         qualityRate: stats?.qualityRate || 0,
    //         todaysSales: todaysSales?.items?.length || 0,
    //         weeklyActivations: weeklyActivations?.items?.length || 0
    //     };
    // },

    // Format SIM serial number for display
    formatSerialNumber(serial: string): string {
        if (serial.length > 6) {
            return `SIM #${serial.slice(-6)}`;
        }
        return serial;
    },

    // Get status color for UI
    getStatusColor(status: SIMStatus): string {
        const colors = {
            'ACTIVATED': 'green',
            'PENDING': 'yellow',
            'INACTIVE': 'red',
            'MATCHED': 'blue',
            'QUALITY': 'purple'
        };
        //@ts-ignore
        return colors[status] || 'gray';
    }
};

export default SimController;