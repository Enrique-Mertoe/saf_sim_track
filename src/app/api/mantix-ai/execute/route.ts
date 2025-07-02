import {NextRequest, NextResponse} from 'next/server';
import {createSuperClient} from '@/lib/supabase/server';
import Accounts from '@/lib/accounts';
import {SIMStatus, UserRole} from "@/models";
import {applyFilters} from "@/helper";

// Security: Verify user authentication
async function verifyUserAndGetContext() {
    try {
        const currentUser = await Accounts.user();

        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const allowedRoles = [UserRole.ADMIN, UserRole.TEAM_LEADER, UserRole.STAFF];
        if (!allowedRoles.includes(currentUser.role)) {
            throw new Error('Insufficient permissions for AI assistant');
        }

        if (!currentUser.is_active) {
            throw new Error('User account is not active');
        }

        return currentUser;
    } catch (error) {
        console.error('Authentication verification failed:', error);
        throw new Error('Authentication failed');
    }
}

// Execute directive operations
async function executeDirectiveOperation(directive: any, userContext: any) {
    const supabase = await createSuperClient();

    try {
        switch (directive.operation) {
            case 'get_team_performance':
                return await getTeamPerformance(supabase, userContext, directive.params);

            case 'get_staff_list':
                return await getStaffList(supabase, userContext, directive.params);

            case 'get_user_activity':
                return await getUserActivity(supabase, userContext, directive.params);

            case 'get_sim_status':
                return await getSimStatus(supabase, userContext, directive.params);

            case 'get_activation_rates':
                return await getActivationRates(supabase, userContext, directive.params);

            case 'get_sales_performance':
                return await getSalesPerformance(supabase, userContext, directive.params);

            case 'get_route_optimization':
                return await getRouteOptimization(supabase, userContext, directive.params);

            case 'get_daily_targets':
                return await getDailyTargets(supabase, userContext, directive.params);

            case 'get_inventory_status':
                return await getInventoryStatus(supabase, userContext, directive.params);

            case 'get_earnings_summary':
                return await getEarningsSummary(supabase, userContext, directive.params);

            case 'get_pending_approvals':
                return await getPendingApprovals(supabase, userContext, directive.params);

            case 'get_quality_metrics':
                return await getQualityMetrics(supabase, userContext, directive.params);

            case 'navigate_to_page':
                return await handleNavigation(directive.params);

            default:
                return {
                    success: false,
                    error: `Unknown operation: ${directive.operation}`,
                    summary: `I can only perform predefined SIM management operations. This request is outside my capabilities.`
                };
        }
    } catch (error) {
        console.error(`Error executing ${directive.operation}:`, error);
        return {
            success: false,
            error: (error as Error).message,
            summary: `Failed to execute ${directive.operation}: ${(error as Error).message}`
        };
    }
}

// Team performance data
async function getTeamPerformance(supabase: any, userContext: any, params: any) {
    const userId = userContext.id;
    const userRole = userContext.role;

    let query = supabase
        .from('teams')
        .select(`
            id,
            name,
            region,
            territory,
            users:users!team_id(count),
            sim_cards:sim_cards!team_id(count)
        `);

    // Apply role-based filtering
    if (userRole !== 'ADMIN') {
        if (userContext.team_id) {
            query = query.eq('id', userContext.team_id);
        } else {
            // User has no team, return empty result
            return {
                success: true,
                data: [],
                summary: "No team data available for your account"
            };
        }
    }

    const {data: teams, error} = await query.limit(10);

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    return {
        success: true,
        data: teams || [],
        summary: `Retrieved performance data for ${teams?.length || 0} team(s)`
    };
}

// Staff list data
async function getStaffList(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    let query = supabase
        .from('users')
        .select(`
            id,
            full_name,
            email,
            role,
            status,
            team_id,
            teams:teams(name)
        `);

    // Apply role-based filtering
    if (userRole === 'TEAM_LEADER' && userContext.team_id) {
        query = query.eq('team_id', userContext.team_id);
    } else if (userRole === 'VAN_STAFF') {
        query = query.eq('id', userContext.id); // Only own data
    }

    const {data: staff, error} = await query
        .not('role', 'eq', 'ADMIN')
        .limit(20);

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    return {
        success: true,
        data: staff || [],
        summary: `Retrieved data for ${staff?.length || 0} staff member(s)`
    };
}

// User activity data
async function getUserActivity(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    let query = supabase
        .from('activity_logs')
        .select(`
            id,
            action_type,
            details,
            created_at,
            users:users!user_id(full_name, role)
        `);

    // Apply role-based filtering
    if (userRole !== 'ADMIN') {
        query = query.eq('user_id', userContext.id);
    }

    const {data: activities, error} = await query
        .order('created_at', {ascending: false})
        .limit(50);

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    return {
        success: true,
        data: activities || [],
        summary: `Retrieved ${activities?.length || 0} activity log entries`
    };
}

// SIM status data
async function getSimStatus(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    let query = supabase
        .from('sim_cards')
        .select(`
            id,
            serial_number,
            status,
            activation_date,
            batch_id,
            teams:teams(name)
        `);

    // Apply role-based filtering
    if (userRole === 'TEAM_LEADER' && userContext.team_id) {
        query = query.eq('team_id', userContext.team_id);
    } else if (userRole === 'VAN_STAFF') {
        query = query.eq('assigned_to', userContext.id);
    }

    const {data: sims, error} = await query.limit(100);

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    return {
        success: true,
        data: sims || [],
        summary: `Retrieved status for ${sims?.length || 0} SIM cards`
    };
}

// Activation rates data
async function getActivationRates(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    let query = supabase
        .from('sim_cards')
        .select('status, activation_date, created_at');

    // Apply role-based filtering
    if (userRole === 'TEAM_LEADER' && userContext.team_id) {
        query = query.eq('team_id', userContext.team_id);
    } else if (userRole === 'VAN_STAFF') {
        query = query.eq('assigned_to', userContext.id);
    }

    const {data: sims, error} = await query;

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    // Calculate activation rates
    const totalSims = sims?.length || 0;
    //@ts-ignore
    const activatedSims = sims?.filter(sim => sim.status === SIMStatus.ACTIVATED).length || 0;
    const activationRate = totalSims > 0 ? ((activatedSims / totalSims) * 100).toFixed(2) : '0';

    const stats = {
        total: totalSims,
        activated: activatedSims,
        pending: totalSims - activatedSims,
        activationRate: `${activationRate}%`
    };

    return {
        success: true,
        data: stats,
        summary: `Activation rate: ${activationRate}% (${activatedSims}/${totalSims} SIMs activated)`
    };
}

// Sales performance data
async function getSalesPerformance(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    // Get sales data from sim_cards or transactions table
    let query = applyFilters(
        supabase
            .from('sim_cards')
            .select(`
            created_at,
            status,
            teams:teams(name),
            users:users!assigned_to_user_id(full_name)
        `)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        , [
            ["registered_on", "not", "is", null]
        ]
    )
    // Apply role-based filtering
    if (userRole === UserRole.TEAM_LEADER && userContext.team_id) {
        query = query.eq('team_id', userContext.team_id);
    } else if (userRole === 'VAN_STAFF') {
        query = query.eq('assigned_to', userContext.id);
    }

    const {data: sales, error} = await query;

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    // Calculate sales metrics
    const totalSales = sales?.length || 0;
    //@ts-ignore
    const todaySales = sales?.filter(sale => {
        const saleDate = new Date(sale.created_at).toDateString();
        const today = new Date().toDateString();
        return saleDate === today;
    }).length || 0;

    const stats = {
        totalSales,
        todaySales,
        averageDaily: totalSales > 0 ? (totalSales / 30).toFixed(1) : '0',
        trend: todaySales > (totalSales / 30) ? 'up' : 'down'
    };

    return {
        success: true,
        data: stats,
        summary: `Sales performance: ${totalSales} total sales, ${todaySales} today (avg: ${stats.averageDaily}/day)`
    };
}

// Route optimization data
async function getRouteOptimization(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    // For VAN_STAFF, show their assigned routes and optimization suggestions
    if (userRole !== 'VAN_STAFF') {
        return {
            success: false,
            error: "Route optimization is only available for Van Staff",
            summary: "Route optimization feature is restricted to field staff"
        };
    }

    // Get user's assigned locations/customers
    let query = supabase
        .from('sim_cards')
        .select(`
            id,
            status,
            location,
            customer_name,
            created_at,
            activation_date
        `)
        .eq('assigned_to', userContext.id)
        .order('created_at', {ascending: false})
        .limit(50);

    const {data: assignments, error} = await query;

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    // Calculate route metrics
    const totalAssignments = assignments?.length || 0;
    const activeRoutes = assignments?.filter((a: any) => a.status === 'ASSIGNED').length || 0;
    const completedToday = assignments?.filter((a: any) => {
        const assignmentDate = new Date(a.activation_date || a.created_at).toDateString();
        const today = new Date().toDateString();
        return assignmentDate === today && a.status === 'ACTIVE';
    }).length || 0;

    const routeData = {
        totalAssignments,
        activeRoutes,
        completedToday,
        efficiency: totalAssignments > 0 ? ((completedToday / totalAssignments) * 100).toFixed(1) : '0',
        suggestions: [
            "Complete nearby locations first to optimize travel time",
            "Focus on high-priority customers in your assigned area",
            "Check inventory before visiting remote locations"
        ]
    };

    return {
        success: true,
        data: routeData,
        summary: `Route optimization: ${completedToday} completed today, ${activeRoutes} active routes, ${routeData.efficiency}% efficiency`
    };
}

// Daily targets data
async function getDailyTargets(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    // Get user's targets and progress
    let targetQuery = supabase
        .from('sim_cards')
        .select('status, created_at, activation_date')
        .gte('created_at', new Date().toDateString()); // Today's data

    // Apply role-based filtering
    if (userRole === 'TEAM_LEADER' && userContext.team_id) {
        targetQuery = targetQuery.eq('team_id', userContext.team_id);
    } else if (userRole === 'VAN_STAFF') {
        targetQuery = targetQuery.eq('assigned_to', userContext.id);
    }

    const {data: todayData, error} = await targetQuery;

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    // Calculate targets (these could come from a targets table in production)
    const dailyTarget = userRole === 'ADMIN' ? 100 : userRole === 'TEAM_LEADER' ? 50 : 20;
    const achieved = todayData?.filter((item: any) => item.status === 'ACTIVE').length || 0;
    const pending = todayData?.filter((item: any) => item.status === 'ASSIGNED').length || 0;
    const progress = dailyTarget > 0 ? ((achieved / dailyTarget) * 100).toFixed(1) : '0';

    const targetData = {
        dailyTarget,
        achieved,
        pending,
        remaining: Math.max(0, dailyTarget - achieved),
        progress: `${progress}%`,
        status: achieved >= dailyTarget ? 'completed' : achieved >= dailyTarget * 0.8 ? 'on-track' : 'behind'
    };

    return {
        success: true,
        data: targetData,
        summary: `Daily targets: ${achieved}/${dailyTarget} achieved (${progress}%), ${targetData.remaining} remaining`
    };
}

// Inventory status data
async function getInventoryStatus(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    let query = supabase
        .from('sim_cards')
        .select('status, batch_id, created_at');

    // Apply role-based filtering
    if (userRole === 'TEAM_LEADER' && userContext.team_id) {
        query = query.eq('team_id', userContext.team_id);
    } else if (userRole === 'VAN_STAFF') {
        query = query.eq('assigned_to', userContext.id);
    }

    const {data: inventory, error} = await query;

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    // Calculate inventory metrics
    const total = inventory?.length || 0;
    const available = inventory?.filter((item: any) => item.status === 'AVAILABLE').length || 0;
    const assigned = inventory?.filter((item: any) => item.status === 'ASSIGNED').length || 0;
    const active = inventory?.filter((item: any) => item.status === 'ACTIVE').length || 0;
    const lowStock = available < 10;

    const inventoryData = {
        total,
        available,
        assigned,
        active,
        lowStock,
        stockLevel: available >= 20 ? 'good' : available >= 10 ? 'medium' : 'low'
    };

    return {
        success: true,
        data: inventoryData,
        summary: `Inventory: ${available} available, ${assigned} assigned, ${active} active. Stock level: ${inventoryData.stockLevel}`
    };
}

// Earnings summary data
async function getEarningsSummary(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    // Get commission/earnings data (this would typically come from a transactions or commissions table)
    let query = supabase
        .from('sim_cards')
        .select('status, created_at, activation_date')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    // Apply role-based filtering
    if (userRole === 'TEAM_LEADER' && userContext.team_id) {
        query = query.eq('team_id', userContext.team_id);
    } else if (userRole === 'VAN_STAFF') {
        query = query.eq('assigned_to', userContext.id);
    }

    const {data: sales, error} = await query;

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    // Calculate earnings (example rates - these would come from configuration)
    const commissionPerSale = userRole === 'VAN_STAFF' ? 50 : userRole === 'TEAM_LEADER' ? 30 : 20;
    const activatedSales = sales?.filter((sale: any) => sale.status === 'ACTIVE').length || 0;
    const totalEarnings = activatedSales * commissionPerSale;

    const todayEarnings = sales?.filter((sale: any) => {
        const saleDate = new Date(sale.activation_date || sale.created_at).toDateString();
        const today = new Date().toDateString();
        return saleDate === today && sale.status === 'ACTIVE';
    }).length * commissionPerSale || 0;

    const earningsData = {
        totalEarnings,
        todayEarnings,
        activatedSales,
        commissionPerSale,
        averageDaily: Math.round(totalEarnings / 30),
        currency: 'KSH'
    };

    return {
        success: true,
        data: earningsData,
        summary: `Earnings: KSH ${totalEarnings} total, KSH ${todayEarnings} today, ${activatedSales} sales at KSH ${commissionPerSale} each`
    };
}

// Pending approvals data
async function getPendingApprovals(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    // Get pending approval requests
    let query = supabase
        .from('sim_cards')
        .select(`
            id,
            serial_number,
            status,
            created_at,
            customer_name,
            users:users!assigned_to_user_id(full_name)
        `)
        .eq('status', 'PENDING_APPROVAL');

    // Apply role-based filtering
    if (userRole === 'TEAM_LEADER' && userContext.team_id) {
        query = query.eq('team_id', userContext.team_id);
    } else if (userRole === 'VAN_STAFF') {
        query = query.eq('assigned_to', userContext.id);
    }

    const {data: approvals, error} = await query.limit(20);

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    const pendingCount = approvals?.length || 0;
    const urgent = approvals?.filter((approval: any) => {
        const daysSince = (Date.now() - new Date(approval.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 2;
    }).length || 0;

    const approvalsData = {
        pending: pendingCount,
        urgent,
        recent: approvals?.slice(0, 5) || [],
        canApprove: userRole === 'ADMIN' || userRole === 'TEAM_LEADER'
    };

    return {
        success: true,
        data: approvalsData,
        summary: `Pending approvals: ${pendingCount} total, ${urgent} urgent (>2 days old)`
    };
}

// Quality metrics data
async function getQualityMetrics(supabase: any, userContext: any, params: any) {
    const userRole = userContext.role;

    // Get quality-related data
    let query = supabase
        .from('sim_cards')
        .select('status, created_at, activation_date')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    // Apply role-based filtering
    if (userRole === 'TEAM_LEADER' && userContext.team_id) {
        query = query.eq('team_id', userContext.team_id);
    } else if (userRole === 'VAN_STAFF') {
        query = query.eq('assigned_to', userContext.id);
    }

    const {data: qualityData, error} = await query;

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    // Calculate quality metrics
    const total = qualityData?.length || 0;
    const successful = qualityData?.filter((item: any) => item.status === 'ACTIVE').length || 0;
    const failed = qualityData?.filter((item: any) => item.status === 'FAILED' || item.status === 'CANCELLED').length || 0;

    const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '0';
    const failureRate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0';

    // Quality score calculation (example algorithm)
    let qualityScore = parseFloat(successRate);
    if (qualityScore >= 95) qualityScore = 100;
    else if (qualityScore >= 90) qualityScore = 90;
    else if (qualityScore >= 80) qualityScore = 80;
    else qualityScore = Math.max(50, qualityScore);

    const metricsData = {
        qualityScore: qualityScore.toFixed(0),
        successRate: `${successRate}%`,
        failureRate: `${failureRate}%`,
        totalProcessed: total,
        successful,
        failed,
        grade: qualityScore >= 90 ? 'A' : qualityScore >= 80 ? 'B' : qualityScore >= 70 ? 'C' : 'D'
    };

    return {
        success: true,
        data: metricsData,
        summary: `Quality score: ${qualityScore}/100 (Grade ${metricsData.grade}), ${successRate}% success rate`
    };
}

// Handle navigation requests
async function handleNavigation(params: any) {
    if (!params || !params.route) {
        return {
            success: false,
            error: "Navigation route not specified",
            summary: "Navigation request requires a valid route parameter"
        };
    }

    // Define allowed routes for security
    const allowedRoutes = [
        '/dashboard', '/team-performance', '/teams', '/sim-management',
        '/reports', '/analytics', '/settings', '/profile', '/users',
        '/inventory', '/notifications', '/help', '/support'
    ];

    if (!allowedRoutes.includes(params.route)) {
        return {
            success: false,
            error: "Invalid navigation route",
            summary: "Navigation requested to an unauthorized or non-existent page"
        };
    }

    return {
        success: true,
        data: {
            route: params.route,
            navigationType: 'client_redirect'
        },
        summary: `Navigation prepared for ${params.route}`
    };
}

export async function POST(request: NextRequest) {
    try {
        // Verify user authentication
        const userContext = await verifyUserAndGetContext();

        const {directive, context} = await request.json();

        if (!directive) {
            return NextResponse.json(
                {error: 'Directive is required'},
                {status: 400}
            );
        }

        // Execute the directive
        const result = await executeDirectiveOperation(directive, userContext);

        // Log directive execution
        const supabase = await createSuperClient();
        await supabase.from('activity_logs').insert({
            user_id: userContext.id,
            action_type: 'AI_DIRECTIVE_EXECUTION',
            details: `Executed directive: ${directive.name} (${directive.operation})`,
            ip_address: request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown'
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Directive execution error:', error);
        return NextResponse.json(
            {
                success: false,
                error: (error as Error).message,
                summary: `Execution failed: ${(error as Error).message}`
            },
            {status: 500}
        );
    }
}