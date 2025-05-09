export enum UserRole {
    ADMIN = 'admin',
    TEAM_LEADER = 'team_leader',
    STAFF = 'staff'
}

export enum StaffType {
    VAN_BA = 'van_ba',
    MPESA_ONLY_AGENT = 'mpesa_only_agent',
    // Add other staff types as needed
}

export enum OnboardingRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export enum SIMStatus {
    SOLD = 'sold',
    ACTIVATED = 'activated',
    INACTIVE = 'inactive',
    PENDING = 'pending',
    FLAGGED = 'flagged'
}