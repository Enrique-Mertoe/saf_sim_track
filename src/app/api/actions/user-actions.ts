import {makeResponse} from "@/helper";
import {supabaseAdmin} from "@/lib/supabase/server";
import Accounts from "@/lib/accounts";
import {admin_id} from "@/services/helper";
import {StaffType, User, UserCreate, UserRole, UserStatus} from "@/models";
import {staffAuthService} from "@/services/staffAuthService";

class UserActions {
    // Get user by ID
    static async byId(data: { id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {data: userData, error} = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', data.id)
                .eq('admin_id', await admin_id(user))
                .single();

            if (error) {
                return makeResponse({error: error.message});
            }

            // Remove sensitive data before sending
            const {password, ...safeUserData} = userData;

            return makeResponse({ok: true, data: safeUserData});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get multiple users with filters and pagination
    static async list(data: {
        page?: number;
        limit?: number;
        team_id?: string;
        role?: UserRole;
        status?: UserStatus;
        staff_type?: StaffType;
        search?: string;
        is_active?: boolean;
    }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {page = 1, limit = 50, team_id, role, status, staff_type, search, is_active} = data;
            const offset = (page - 1) * limit;

            let query = supabaseAdmin
                .from('users')
                .select('*, teams(name)', {count: 'exact'})
                .eq('admin_id', await admin_id(user));

            // Apply filters
            if (team_id) query = query.eq('team_id', team_id);
            if (role) query = query.eq('role', role);
            if (status) query = query.eq('status', status);
            if (staff_type) query = query.eq('staff_type', staff_type);
            if (typeof is_active === 'boolean') query = query.eq('is_active', is_active);

            // Apply search
            if (search) {
                query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%,username.ilike.%${search}%,id_number.ilike.%${search}%`);
            }

            // Apply pagination and ordering
            query = query.range(offset, offset + limit - 1).order('created_at', {ascending: false});

            const {data: users, error, count} = await query;

            if (error) {
                return makeResponse({error: error.message});
            }

            // Remove sensitive data
            const safeUsers = users.map(({password, ...user}) => user);

            return makeResponse({
                ok: true,
                data: {
                    items: safeUsers,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Create new user
    static async create(data: UserCreate) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            // Hash password if provided
            let hashedPassword = null;
            if (data.password) {
                // hashedPassword = await bcrypt.hash(data.password, 10);
            }

            const userData = {
                ...data,
                admin_id: await admin_id(user),
                password: hashedPassword,
                team_id: data.team_id === '' ? null : data.team_id,
                is_first_login: true,
                created_at: new Date().toISOString()
            };

            const {data: newUser, error} = await supabaseAdmin
                .from('users')
                .insert(userData)
                .select('*')
                .single();

            if (error) {
                return makeResponse({error: error.message});
            }

            // Remove sensitive data before sending
            const {password, ...safeUserData} = newUser;

            return makeResponse({ok: true, data: safeUserData, message: "User created successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Update user
    static async update(data: { id: string; updates: Partial<User> }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {id, updates} = data;

            // Clean up empty strings and handle password
            const cleanUpdates = {...updates};
            //@ts-ignore
            if (cleanUpdates.team_id === '') cleanUpdates.team_id = null;

            // Hash password if being updated
            if (cleanUpdates.password) {
                // cleanUpdates.password = await bcrypt.hash(cleanUpdates.password, 10);
            }

            // Remove sensitive fields that shouldn't be updated directly
            delete cleanUpdates.admin_id;
            delete cleanUpdates.created_at;

            const {data: updatedUser, error} = await supabaseAdmin
                .from('users')
                .update(cleanUpdates)
                .eq('id', id)
                .eq('admin_id', await admin_id(user))
                .select('*')
                .single();

            if (error) {
                return makeResponse({error: error.message});
            }

            // Remove sensitive data
            const {password, ...safeUserData} = updatedUser;

            return makeResponse({ok: true, data: safeUserData, message: "User updated successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Delete user
    static async delete(data: { id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('users')
                .delete()
                .eq('id', data.id)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: "User deleted successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Bulk delete users
    static async bulk_delete(data: { ids: string[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('users')
                .delete()
                .in('id', data.ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `${data.ids.length} users deleted successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Activate/Deactivate users
    static async toggle_active_status(data: { user_ids: string[]; is_active: boolean }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('users')
                .update({is_active: data.is_active})
                .in('id', data.user_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            const action = data.is_active ? 'activated' : 'deactivated';
            return makeResponse({ok: true, message: `${data.user_ids.length} users ${action} successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Update user status
    static async update_status(data: { user_ids: string[]; status: UserStatus }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('users')
                .update({status: data.status})
                .in('id', data.user_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `${data.user_ids.length} users status updated successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Assign users to team
    static async assign_to_team(data: { user_ids: string[]; team_id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('users')
                .update({team_id: data.team_id})
                .in('id', data.user_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `${data.user_ids.length} users assigned to team successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Remove users from team
    static async remove_from_team(data: { user_ids: string[] }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('users')
                .update({team_id: null})
                .in('id', data.user_ids)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: `${data.user_ids.length} users removed from team successfully`});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get users by team
    static async by_team(data: { team_id: string; page?: number; limit?: number }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {team_id, page = 1, limit = 100} = data;
            const offset = (page - 1) * limit;

            const {data: users, error, count} = await supabaseAdmin
                .from('users')
                .select('*', {count: 'exact'})
                .eq('team_id', team_id)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', {ascending: false});

            if (error) {
                return makeResponse({error: error.message});
            }

            // Remove sensitive data
            const safeUsers = users.map(({password, ...user}) => user);

            return makeResponse({
                ok: true,
                data: {
                    items: safeUsers,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get users by role
    static async by_role(data: { role: UserRole; page?: number; limit?: number }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {role, page = 1, limit = 100} = data;
            const offset = (page - 1) * limit;

            const {data: users, error, count} = await supabaseAdmin
                .from('users')
                .select('*', {count: 'exact'})
                .eq('role', role)
                .eq('admin_id', await admin_id(user))
                .range(offset, offset + limit - 1)
                .order('created_at', {ascending: false});

            if (error) {
                return makeResponse({error: error.message});
            }

            // Remove sensitive data
            const safeUsers = users.map(({password, ...user}) => user);

            return makeResponse({
                ok: true,
                data: {
                    items: safeUsers,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Reset user password
    static async reset_password(data: { user_id: string; new_password: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }


            const hashedPassword = await staffAuthService.hashPassword(data.new_password)

            const {error} = await supabaseAdmin
                .from('users')
                .update({
                    password: hashedPassword,
                    is_first_login: true
                })
                .eq('id', data.user_id)
                .eq('admin_id', await admin_id(user));

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: "Password reset successfully"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Get user statistics
    static async statistics(data: { team_id?: string; role?: UserRole }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            let query = supabaseAdmin
                .from('users')
                .select('role, status, is_active, last_login_at, created_at')
                .eq('admin_id', await admin_id(user));

            // Apply filters
            if (data.team_id) query = query.eq('team_id', data.team_id);
            if (data.role) query = query.eq('role', data.role);

            const {data: users, error} = await query;

            if (error) {
                return makeResponse({error: error.message});
            }

            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const stats = {
                total: users.length,
                active: users.filter(u => u.is_active).length,
                inactive: users.filter(u => !u.is_active).length,
                pending: users.filter(u => u.status === 'PENDING_APPROVAL').length,
                suspended: users.filter(u => u.status === 'SUSPENDED').length,
                admins: users.filter(u => u.role === 'ADMIN').length,
                teamLeaders: users.filter(u => u.role === 'TEAM_LEADER').length,
                vanStaff: users.filter(u => u.role === 'VAN_STAFF').length,
                mpesaAgents: users.filter(u => u.role === 'MPESA_ONLY_AGENT').length,
                nonMpesaAgents: users.filter(u => u.role === 'NON_MPESA_AGENT').length,
                loggedInLast30Days: users.filter(u => {
                    if (!u.last_login_at) return false;
                    return new Date(u.last_login_at) > thirtyDaysAgo;
                }).length,
                createdThisMonth: users.filter(u => {
                    const createdDate = new Date(u.created_at);
                    return createdDate.getMonth() === now.getMonth() &&
                        createdDate.getFullYear() === now.getFullYear();
                }).length
            };

            return makeResponse({ok: true, data: stats});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Check if email/username exists
    static async check_exists(data: {
        email?: string;
        username?: string;
        id_number?: string;
        phone_number?: string;
        exclude_id?: string
    }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {email, username, id_number, phone_number, exclude_id} = data;
            const checks = [];

            if (email) {
                let query = supabaseAdmin.from('users').select('id').eq('email', email).eq('admin_id', await admin_id(user));
                if (exclude_id) query = query.neq('id', exclude_id);
                checks.push(query.then(({data, error}) => ({
                    field: 'email',
                    exists: !error && data && data.length > 0
                })));
            }

            if (username) {
                let query = supabaseAdmin.from('users').select('id').eq('username', username).eq('admin_id', await admin_id(user));
                if (exclude_id) query = query.neq('id', exclude_id);
                checks.push(query.then(({data, error}) => ({
                    field: 'username',
                    exists: !error && data && data.length > 0
                })));
            }

            if (id_number) {
                let query = supabaseAdmin.from('users').select('id').eq('id_number', id_number).eq('admin_id', await admin_id(user));
                if (exclude_id) query = query.neq('id', exclude_id);
                checks.push(query.then(({data, error}) => ({
                    field: 'id_number',
                    exists: !error && data && data.length > 0
                })));
            }

            if (phone_number) {
                let query = supabaseAdmin.from('users').select('id').eq('phone_number', phone_number).eq('admin_id', await admin_id(user));
                if (exclude_id) query = query.neq('id', exclude_id);
                checks.push(query.then(({data, error}) => ({
                    field: 'phone_number',
                    exists: !error && data && data.length > 0
                })));
            }

            const results = await Promise.all(checks);
            const conflicts = results.filter(result => result.exists);

            return makeResponse({
                ok: true,
                data: {
                    hasConflicts: conflicts.length > 0,
                    conflicts: conflicts.map(c => c.field)
                }
            });
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Update login timestamp
    static async update_last_login(data: { user_id: string }) {
        try {
            const user = await Accounts.user();
            if (!user) {
                return makeResponse({error: "User not authenticated"});
            }

            const {error} = await supabaseAdmin
                .from('users')
                .update({
                    last_login_at: new Date().toISOString(),
                    is_first_login: false
                })
                .eq('id', data.user_id);

            if (error) {
                return makeResponse({error: error.message});
            }

            return makeResponse({ok: true, message: "Login timestamp updated"});
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }

    // Router method
    static async builder(target: string, data: any) {
        try {
            const action = (UserActions as any)[target];
            if (typeof action === 'function') {
                return await action(data);
            } else {
                throw new Error(`Action '${target}' is not a function`);
            }
        } catch (error) {
            return makeResponse({error: (error as Error).message});
        }
    }
}

export default UserActions;