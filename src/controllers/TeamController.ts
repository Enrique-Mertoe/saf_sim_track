import {Team, TeamCreate} from "@/models";
import ClientApi from "@/lib/utils/ClientApi";
import {DeferredObject} from "@/lib/request";

export interface TeamControllerActions<T> {
    byId(id: string): DeferredObject<T | null>;

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

    toggleActiveStatus(team_ids: string[], is_active: boolean): DeferredObject<boolean>;

    assignLeader(team_ids: string[], leader_id: string): DeferredObject<boolean>;

    removeLeader(team_ids: string[]): DeferredObject<boolean>;

    byRegion(region: string, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    byLeader(leader_id: string, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    performance(team_id: string, date_from?: string, date_to?: string): DeferredObject<any>;

    statistics(filters?: any): DeferredObject<any>;

    checkNameExists(name: string, exclude_id?: string): DeferredObject<{ exists: boolean } | null>;

    getRegions(): DeferredObject<string[] | null>;

    getTerritories(region: string): DeferredObject<string[] | null>;

    getTeamBatches(team_id: string, page?: number, limit?: number): DeferredObject<any>;

    search(query: string, filters?: any, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;
}

const TeamController = {
    async byId(id: string): Promise<Team | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .byId(id)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching team:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching team:', error);
                    resolve(null);
                });
        });
    },

    async list(options: {
        page?: number;
        limit?: number;
        region?: string;
        territory?: string;
        leader_id?: string;
        is_active?: boolean;
        search?: string;
        has_van?: boolean;
    } = {}): Promise<{ items: Team[]; total: number; page: number; limit: number; totalPages: number } | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .list(options)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching teams:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching teams:', error);
                    resolve(null);
                });
        });
    },

    async create(data: TeamCreate): Promise<Team | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .create(data)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error creating team:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error creating team:', error);
                    resolve(null);
                });
        });
    },

    async update(id: string, updates: Partial<Team>): Promise<Team | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .update(id, updates)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error updating team:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error updating team:', error);
                    resolve(null);
                });
        });
    },

    async delete(id: string): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .delete(id)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error deleting team:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error deleting team:', error);
                    resolve(false);
                });
        });
    },

    async bulkDelete(ids: string[]): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .bulkDelete(ids)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error bulk deleting teams:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error bulk deleting teams:', error);
                    resolve(false);
                });
        });
    },

    async toggleActiveStatus(team_ids: string[], is_active: boolean): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .toggleActiveStatus(team_ids, is_active)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error toggling team active status:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error toggling team active status:', error);
                    resolve(false);
                });
        });
    },

    async assignLeader(team_ids: string[], leader_id: string): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .assignLeader(team_ids, leader_id)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error assigning team leader:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error assigning team leader:', error);
                    resolve(false);
                });
        });
    },

    async removeLeader(team_ids: string[]): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .removeLeader(team_ids)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error removing team leader:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error removing team leader:', error);
                    resolve(false);
                });
        });
    },

    async byRegion(region: string, page?: number, limit?: number): Promise<{
        items: Team[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .byRegion(region, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching teams by region:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching teams by region:', error);
                    resolve(null);
                });
        });
    },

    async byLeader(leader_id: string, page?: number, limit?: number): Promise<{
        items: Team[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .byLeader(leader_id, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching teams by leader:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching teams by leader:', error);
                    resolve(null);
                });
        });
    },

    async performance(team_id: string, date_from?: string, date_to?: string): Promise<any> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .performance(team_id, date_from, date_to)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching team performance:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching team performance:', error);
                    resolve(null);
                });
        });
    },

    async statistics(filters: { region?: string } = {}): Promise<any> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .statistics(filters)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching team statistics:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching team statistics:', error);
                    resolve(null);
                });
        });
    },

    async checkNameExists(name: string, exclude_id?: string): Promise<{ exists: boolean } | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .checkNameExists(name, exclude_id)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error checking team name:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error checking team name:', error);
                    resolve(null);
                });
        });
    },

    async getRegions(): Promise<string[] | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .getRegions()
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching regions:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching regions:', error);
                    resolve(null);
                });
        });
    },

    async getTerritories(region: string): Promise<string[] | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .getTerritories(region)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching territories:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching territories:', error);
                    resolve(null);
                });
        });
    },

    async search(query: string, filters: {
        region?: string;
        territory?: string;
        leader_id?: string;
        is_active?: boolean;
        has_van?: boolean;
    } = {}, page: number = 1, limit: number = 50): Promise<{
        items: Team[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .search(query, filters, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error searching teams:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error searching teams:', error);
                    resolve(null);
                });
        });
    },
    // ...existing methods

// Get team batches
    // ...existing methods

    async getTeamBatches(team_id: string, page?: number, limit?: number): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("team").get()
                .getTeamBatches(team_id, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching team batches:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching team batches:', error);
                    resolve(null);
                });
        });
    }
};

// Additional utility methods for Team management
export const TeamUtils = {
    // Get teams that need attention
    async getNeedsAttention(): Promise<Team[]> {
        const results = await Promise.all([
            TeamController.list({is_active: false, limit: 50}), // Inactive teams
            //@ts-ignore
            TeamController.list({leader_id: null, limit: 50}), // Teams without leaders
            TeamController.list({has_van: false, limit: 50}) // Teams without vans
        ]);

        const inactive = results[0]?.items || [];
        const noLeader = results[1]?.items || [];
        const noVan = results[2]?.items || [];

        // Combine and deduplicate
        const combined = [...inactive, ...noLeader, ...noVan];
        const unique = combined.filter((team, index, self) =>
            index === self.findIndex(t => t.id === team.id)
        );

        return unique;
    },

    // Get team dashboard summary
    // async getDashboardSummary(region?: string) {
    //     const stats = await TeamController.statistics({ region });
    //     const recentTeams = await ClientApi.of("team").get().getRecentlyCreated(7);
    //     const needsAttention = await this.getNeedsAttention();
    //
    //     return {
    //         totalTeams: stats?.total || 0,
    //         activeTeams: stats?.active || 0,
    //         inactiveTeams: stats?.inactive || 0,
    //         teamsWithVans: stats?.with_vans || 0,
    //         teamsWithoutVans: stats?.without_vans || 0,
    //         totalMembers: stats?.total_members || 0,
    //         averageTeamSize: stats?.average_team_size || 0,
    //         recentlyCreated: recentTeams?.ok ? recentTeams.data.items.length : 0,
    //         needsAttention: needsAttention.length,
    //         byRegion: stats?.by_region || {}
    //     };
    // },

    // Get team performance summary
    async getPerformanceSummary(team_id: string, days: number = 30) {
        const date_from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const date_to = new Date().toISOString().split('T')[0];

        const performance = await TeamController.performance(team_id, date_from, date_to);
        return performance;
    },

    // Validate team form data
    validateTeamData(teamData: Partial<Team>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!teamData.name?.trim()) {
            errors.push('Team name is required');
        }

        if (!teamData.region?.trim()) {
            errors.push('Region is required');
        }

        if (teamData.van_number_plate && !/^[A-Z]{3}\s?\d{3}[A-Z]?$/i.test(teamData.van_number_plate)) {
            errors.push('Invalid van number plate format (e.g., KCA 123A)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Format team display name
    formatTeamName(team: Team): string {
        return `${team.name} (${team.region}${team.territory ? ` - ${team.territory}` : ''})`;
    },

    // Get team status color for UI
    getStatusColor(team: Team): string {
        if (!team.is_active) return 'red';
        if (!team.leader_id) return 'yellow';
        return 'green';
    },

    // Get team status text
    getStatusText(team: Team): string {
        if (!team.is_active) return 'Inactive';
        if (!team.leader_id) return 'No Leader';
        return 'Active';
    },

    // Check if team is complete (has leader, is active, etc.)
    isTeamComplete(team: Team): boolean {
        return team.is_active && !!team.leader_id;
    },

    // Get team members for dropdown
    async getTeamOptions(): Promise<{ id: string; name: string; region: string }[]> {
        const result = await TeamController.list({is_active: true, limit: 100});
        return result?.items.map(team => ({
            id: team.id,
            name: team.name,
            region: team.region
        })) || [];
    },

    // Get regional hierarchy
    async getRegionalHierarchy(): Promise<Record<string, { territories: string[]; teams: Team[] }>> {
        const allTeams = await TeamController.list({limit: 1000});
        const teams = allTeams?.items || [];

        const hierarchy: Record<string, { territories: string[]; teams: Team[] }> = {};

        teams.forEach(team => {
            if (!hierarchy[team.region]) {
                hierarchy[team.region] = {territories: [], teams: []};
            }

            hierarchy[team.region].teams.push(team);

            if (team.territory && !hierarchy[team.region].territories.includes(team.territory)) {
                hierarchy[team.region].territories.push(team.territory);
            }
        });

        // Sort territories
        Object.keys(hierarchy).forEach(region => {
            hierarchy[region].territories.sort();
        });

        return hierarchy;
    },

    // Calculate team efficiency score
    calculateEfficiencyScore(performance: any): number {
        if (!performance || !performance.sim_cards) return 0;

        const {sim_cards, rates, members} = performance;

        // Weighted scoring
        const activationWeight = 0.3;
        const matchWeight = 0.3;
        const qualityWeight = 0.2;
        const productivityWeight = 0.2;

        const activationScore = rates.activation_rate || 0;
        const matchScore = rates.match_rate || 0;
        const qualityScore = rates.quality_rate || 0;
        const productivityScore = members.active > 0 ? (sim_cards.total / members.active) * 10 : 0; // SIMs per member * 10

        const score = (
            activationScore * activationWeight +
            matchScore * matchWeight +
            qualityScore * qualityWeight +
            Math.min(productivityScore, 100) * productivityWeight
        );

        return Math.round(score);
    },

    // Get efficiency rating text
    getEfficiencyRating(score: number): string {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Fair';
        return 'Needs Improvement';
    },

    // Format van number plate
    formatVanPlate(plate: string): string {
        if (!plate) return '';
        return plate.toUpperCase().replace(/\s+/g, ' ').trim();
    },

    // Generate team report summary
    generateReportSummary(performance: any): string {
        if (!performance) return 'No data available';

        const {team_info, sim_cards, rates, members} = performance;
        const efficiency = this.calculateEfficiencyScore(performance);

        return `Team ${team_info.name} has ${members.total} members and processed ${sim_cards.total} SIM cards. ` +
            `Activation rate: ${rates.activation_rate.toFixed(1)}%, Match rate: ${rates.match_rate.toFixed(1)}%, ` +
            `Quality rate: ${rates.quality_rate.toFixed(1)}%. Efficiency score: ${efficiency}/100 (${this.getEfficiencyRating(efficiency)}).`;
    },

    // Quick team setup helper
    async quickTeamSetup(name: string, region: string, leader_id?: string, van_plate?: string) {
        const teamData: any = {
            name,
            region,
            is_active: true
        };

        if (leader_id) teamData.leader_id = leader_id;
        if (van_plate) teamData.van_number_plate = this.formatVanPlate(van_plate);

        return TeamController.create(teamData);
    }
};

export default TeamController;