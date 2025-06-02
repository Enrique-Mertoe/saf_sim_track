"use client"
import {StaffType, User, UserRole, UserStatus} from "@/models";


class UserManager {
    private readonly user: User | null;

    constructor(user: User |null) {
        this.user = user;
    }

    isAdmin(): boolean {
        return this.user?.role === UserRole.ADMIN;
    }

    isTeamLeader(): boolean {
        return this.user?.role === UserRole.TEAM_LEADER;
    }

    isStaff(): boolean {
        return this.user?.role === UserRole.STAFF;
    }

    isActive(): boolean {
        return !!(this.user?.is_active && this.user?.status === UserStatus.ACTIVE);
    }

    isPending(): boolean {
        return this.user?.status === UserStatus.PENDING_APPROVAL;
    }

    isBlocked(): boolean {
        return this.user?.status === UserStatus.SUSPENDED || !this.user?.is_active;
    }

    isFirstLogin(): boolean {
        return this.user?.is_first_login || false;
    }

    hasTeam(): boolean {
        return !!this.user?.team_id;
    }

    isFieldAgent(): boolean {
        return this.user?.staff_type === StaffType.VAN_BA;
    }

    isOfficeStaff(): boolean {
        return this.user?.staff_type === StaffType.MPESA_ONLY_AGENT;
    }

    canAccessAdminPanel(): boolean {
        return this.isAdmin() || this.isTeamLeader();
    }

    canManageUsers(): boolean {
        return this.isAdmin();
    }

    canManageTeam(): boolean {
        return this.isAdmin() || this.isTeamLeader();
    }

    getUser(): User | null {
        return this.user;
    }
}

export default UserManager;