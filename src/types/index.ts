// types/index.ts
import {Timestamp} from 'firebase/firestore';
import {UserRole} from "@/models";

export interface Team {
    id: string;
    name: string;
    region: string;
    createdAt: Timestamp;
    target: number;
    activationRate: number;
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    teamId?: string;
    createdAt: Timestamp;
    photo?: string; // URL or initials
    sales?: number;
}

export interface SimCard {
    id: string;
    serial: string;
    date: Timestamp;
    customerPhone: string;
    agentId: string;
    agentName?: string;
    teamId: string;
    status: 'Active' | 'Pending' | 'Inactive';
    isOffline?: boolean;
}

export interface SalesData {
    month: string;
    sales: number;
}

export interface TeamPerformance extends Team {
    sales: number;
    target: number;
    activationRate: number;
}

export interface PendingApproval {
    id: string;
    userId: string;
    name: string;
    role: UserRole;
    team: string;
    requestDate: Timestamp;
    type: 'registration' | 'role_change';
    status: 'pending' | 'approved' | 'rejected';
}

export interface SecurityFormValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    twoFactor: boolean;
}

export interface SecurityActivity {
    lastPasswordChange: Date | null;
    lastLogin: Date | null;
    activeSessions: number;
}

export interface TwoFactorMethod {
    id: string;
    type: 'email' | 'sms' | 'authenticator';
    identifier: string; // email or phone number (masked)
    isVerified: boolean;
    createdAt: Date;
}