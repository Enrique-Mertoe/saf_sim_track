import {StaffType, User, UserCreate, UserRole, UserStatus} from "@/models";
import ClientApi from "@/lib/utils/ClientApi";
import {DeferredObject} from "@/lib/request";

export interface UserControllerActions<T> {
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

    toggleActiveStatus(user_ids: string[], is_active: boolean): DeferredObject<boolean>;

    updateStatus(user_ids: string[], status: any): DeferredObject<boolean>;

    assignToTeam(user_ids: string[], team_id: string): DeferredObject<boolean>;

    removeFromTeam(user_ids: string[]): DeferredObject<boolean>;

    byTeam(team_id: string, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    byRole(role: any, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;

    resetPassword(user_id: string, new_password: string): DeferredObject<boolean>;

    statistics(filters?: any): Promise<any>;

    checkExists(data: any): Promise<any>;

    search(query: string, filters?: any, page?: number, limit?: number): DeferredObject<{
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null>;
}

const UserController = {
    async byId(id: string): Promise<User | null> {
        if (!id) return null;
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .byId(id)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching user:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching user:', error);
                    resolve(null);
                });
        });
    },

    async list(options: {
        page?: number;
        limit?: number;
        team_id?: string;
        role?: UserRole;
        status?: UserStatus;
        staff_type?: StaffType;
        search?: string;
        is_active?: boolean;
    } = {}): Promise<{ items: User[]; total: number; page: number; limit: number; totalPages: number } | null> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .list(options)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching users:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching users:', error);
                    resolve(null);
                });
        });
    },

    async create(data: UserCreate): Promise<User | null> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .create(data)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error creating user:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error creating user:', error);
                    resolve(null);
                });
        });
    },

    async update(id: string, updates: Partial<User>): Promise<User | null> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .update(id, updates)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error updating user:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error updating user:', error);
                    resolve(null);
                });
        });
    },

    async delete(id: string): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .delete(id)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error deleting user:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error deleting user:', error);
                    resolve(false);
                });
        });
    },

    async bulkDelete(ids: string[]): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .bulkDelete(ids)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error bulk deleting users:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error bulk deleting users:', error);
                    resolve(false);
                });
        });
    },

    async toggleActiveStatus(user_ids: string[], is_active: boolean): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .toggleActiveStatus(user_ids, is_active)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error toggling user active status:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error toggling user active status:', error);
                    resolve(false);
                });
        });
    },

    async updateStatus(user_ids: string[], status: UserStatus): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .updateStatus(user_ids, status)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error updating user status:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error updating user status:', error);
                    resolve(false);
                });
        });
    },

    async assignToTeam(user_ids: string[], team_id: string): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .assignToTeam(user_ids, team_id)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error assigning users to team:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error assigning users to team:', error);
                    resolve(false);
                });
        });
    },

    async removeFromTeam(user_ids: string[]): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .removeFromTeam(user_ids)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error removing users from team:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error removing users from team:', error);
                    resolve(false);
                });
        });
    },

    async byTeam(team_id: string, page?: number, limit?: number): Promise<{
        items: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .byTeam(team_id, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching users by team:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching users by team:', error);
                    resolve(null);
                });
        });
    },

    async byRole(role: UserRole, page?: number, limit?: number): Promise<{
        items: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .byRole(role, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching users by role:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching users by role:', error);
                    resolve(null);
                });
        });
    },

    async resetPassword(user_id: string, new_password: string): Promise<boolean> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .resetPassword(user_id, new_password)
                .then(response => {
                    if (response.ok) {
                        resolve(true);
                    } else {
                        console.error('Error resetting password:', response.error);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('Error resetting password:', error);
                    resolve(false);
                });
        });
    },

    async statistics(filters: { team_id?: string; role?: UserRole } = {}): Promise<any> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .statistics(filters)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error fetching user statistics:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching user statistics:', error);
                    resolve(null);
                });
        });
    },

    async checkExists(data: {
        email?: string;
        username?: string;
        id_number?: string;
        phone_number?: string;
        exclude_id?: string;
    }): Promise<any> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .checkExists(data)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error checking user existence:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error checking user existence:', error);
                    resolve(null);
                });
        });
    },

    async search(query: string, filters: {
        team_id?: string;
        role?: UserRole;
        status?: UserStatus;
        staff_type?: StaffType;
        is_active?: boolean;
    } = {}, page: number = 1, limit: number = 50): Promise<{
        items: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number
    } | null> {
        return new Promise(resolve => {
            ClientApi.of("user").get()
                .search(query, filters, page, limit)
                .then(response => {
                    if (response.ok) {
                        resolve(response.data);
                    } else {
                        console.error('Error searching users:', response.error);
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error searching users:', error);
                    resolve(null);
                });
        });
    }
};

// Additional utility methods for User management
export const UserUtils = {
    // Get users that need approval
    async getNeedsApproval(): Promise<User[]> {
        const result = await UserController.list({status: UserStatus.PENDING_APPROVAL, limit: 100});
        return result?.items || [];
    },

    // Get inactive users who haven't logged in recently
    // async getInactiveUsers(days: number = 30): Promise<User[]> {
    //     const result = await ClientApi.of("user").get().getInactiveLogins(days, 1, 100);
    //     return result?.ok ? result.data.items : [];
    // },

    // Get users without teams
    async getUsersWithoutTeams(): Promise<User[]> {
        //@ts-ignore
        const result = await UserController.list({team_id: null, limit: 100});
        return result?.items || [];
    },

    // Get team leaders for dropdowns
    async getTeamLeaderOptions(): Promise<{ id: string; name: string }[]> {
        const result = await UserController.byRole(UserRole.TEAM_LEADER, 1, 100);
        return result?.items.map(user => ({
            id: user.id,
            name: user.full_name
        })) || [];
    },

    // Get user dashboard summary
    // async getDashboardSummary(team_id?: string) {
    //     const stats = await UserController.statistics({team_id});
    //     const recentUsers = await ClientApi.of("user").get().getRecentlyCreated(7);
    //     const pendingApproval = await UserController.list({status: 'PENDING_APPROVAL', limit: 10});
    //
    //     return {
    //         totalUsers: stats?.total || 0,
    //         activeUsers: stats?.active || 0,
    //         inactiveUsers: stats?.inactive || 0,
    //         pendingApproval: stats?.pending || 0,
    //         suspendedUsers: stats?.suspended || 0,
    //         recentlyCreated: recentUsers?.ok ? recentUsers.data.items.length : 0,
    //         needsApproval: pendingApproval?.items || []
    //     };
    // },

    // Validate user form data
    validateUserData(userData: Partial<User>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!userData.full_name?.trim()) {
            errors.push('Full name is required');
        }

        if (!userData.email?.trim()) {
            errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            errors.push('Invalid email format');
        }

        if (!userData.phone_number?.trim()) {
            errors.push('Phone number is required');
        } else if (!/^\+?[\d\s-()]+$/.test(userData.phone_number)) {
            errors.push('Invalid phone number format');
        }

        if (!userData.id_number?.trim()) {
            errors.push('ID number is required');
        }

        if (!userData.role) {
            errors.push('Role is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Format user display name
    formatUserName(user: User): string {
        return `${user.full_name} (${user.email})`;
    },

    // Get role display name
    getRoleDisplayName(role: UserRole): string {
        const roleNames = {
            'ADMIN': 'Administrator',
            'TEAM_LEADER': 'Team Leader',
            'VAN_STAFF': 'Van Staff',
            'MPESA_ONLY_AGENT': 'M-Pesa Agent',
            'NON_MPESA_AGENT': 'Non M-Pesa Agent'
        };
        //@ts-ignore
        return roleNames[role] || role;
    },

    // Get status color for UI
    getStatusColor(status: UserStatus): string {
        const colors = {
            'ACTIVE': 'green',
            'SUSPENDED': 'red',
            'PENDING_APPROVAL': 'yellow'
        };
        return colors[status] || 'gray';
    },

    // Get role color for UI
    getRoleColor(role: UserRole): string {
        const colors = {
            'ADMIN': 'purple',
            'TEAM_LEADER': 'blue',
            'VAN_STAFF': 'green',
            'MPESA_ONLY_AGENT': 'orange',
            'NON_MPESA_AGENT': 'gray'
        };
        //@ts-ignore
        return colors[role] || 'gray';
    },

    // Check if user can perform action (basic permission check)
    canPerformAction(currentUser: User, targetUser: User, action: string): boolean {
        // Admins can do everything
        if (currentUser.role === UserRole.ADMIN) return true;

        // Team leaders can manage their team members (except other team leaders)
        if (currentUser.role === 'TEAM_LEADER') {
            if (targetUser.team_id === currentUser.team_id && targetUser.role !== 'TEAM_LEADER') {
                return ['view', 'edit', 'activate', 'deactivate'].includes(action);
            }
        }

        // Users can only view their own profile
        if (currentUser.id === targetUser.id) {
            return action === 'view';
        }

        return false;
    },

    // Generate random password
    generateRandomPassword(length: number = 8): string {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    },

    // Format last login time
    formatLastLogin(lastLogin?: string): string {
        if (!lastLogin) return 'Never';

        const loginDate = new Date(lastLogin);
        const now = new Date();
        const diffMs = now.getTime() - loginDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

        return loginDate.toLocaleDateString();
    }
};

export default UserController;