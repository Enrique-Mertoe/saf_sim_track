import {Team as Team1, User} from "@/models";

// Define TypeScript interfaces
export interface SerialNumber {
    id: string; // Unique identifier for each serial
    value: string;
    isValid: boolean;
    isChecking: boolean;
    checkError: string | null;
    exists: boolean;
    isUploading: boolean;
    isUploaded: boolean;
    uploadError: string | null;
}

export type Team = Team1 & {
    users?: User,
    leader: string
}

// Tab types
export type TabType = 'upload' | 'view';

// Generate a unique ID
export const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Props for SerialItem component
export interface SerialItemProps {
    serial: SerialNumber;
    editSerial: (id: string, value: string) => void;
    removeSerial: (id: string) => void;
    selectedTeam: string;
    teams: Team[];
    onCheckComplete: () => void;
    onUploadComplete: (success: boolean) => void;
    updateSerialStatus: (id: string, updates: Partial<SerialNumber>) => void;
    user: User;
}

// Props for PaginatedSerialGrid component
export interface PaginatedSerialGridProps {
    serialNumbers: SerialNumber[];
    editSerial: (id: string, value: string) => void;
    removeSerial: (id: string) => void;
    selectedTeam: string;
    teams: Team[];
    onCheckComplete: () => void;
    onUploadComplete: (success: boolean) => void;
    updateSerialStatus: (id: string, updates: Partial<SerialNumber>) => void;
    user: User;
}
