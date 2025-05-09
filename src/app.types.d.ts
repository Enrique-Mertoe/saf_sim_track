// Define user role types
declare type UserRole = 'admin' | 'teamLeader' | 'staff';
declare type UserInfo = {
    name: string;
    id: string;
    email: string;
    role: UserRole
}

declare type Closure = (...args) => void;