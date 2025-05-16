export enum UserStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    PENDING_APPROVAL = "PENDING_APPROVAL"
}

export enum UserRole {
    ADMIN = 'admin',
    TEAM_LEADER = 'TEAM_LEADER',
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
    MATCH = 'Y',
    UNMATCH = 'N',
    QUALITY = 'QUALITY',
    NONQUALITY = 'NONQUALITY',
}
