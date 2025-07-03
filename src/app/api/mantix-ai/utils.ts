export
// Define role-based navigation routes with custom names/aliases
const ROLE_BASED_ROUTES = {
    // General routes available to all roles
    GENERAL: {
        'dashboard': { route: '/dashboard', name: 'Dashboard Home' },
        'home': { route: '/dashboard', name: 'Dashboard Home' },
        'profile': { route: '/profile', name: 'My Profile' },
        'notifications': { route: '/notifications', name: 'Notifications Center' },
        'help': { route: '/help', name: 'Help & Support' },
        'support': { route: '/support', name: 'Customer Support' },
        'sim-management': { route: '/sim-management', name: 'SIM Card Management' },
        'sim management': { route: '/sim-management', name: 'SIM Card Management' },
        'sims': { route: '/sim-management', name: 'SIM Cards Overview' },
        'analysis': { route: '/dashboard/analysis', name: 'System Analytics' },
    },

    // Admin-only routes
    ADMIN: {
        'users': { route: '/dashboard/users', name: 'User Management' },
        'staff': { route: '/dashboard/users', name: 'Staff Directory' },
        'teams': { route: '/dashboard/teams', name: 'Team Management' },
        'reports': { route: '/reports', name: 'Comprehensive Reports' },
        'settings': { route: '/settings', name: 'System Settings' },
        'user-management': { route: '/user-management', name: 'Advanced User Management' },
        'system-settings': { route: '/system-settings', name: 'System Configuration' },
        'picklist': { route: '/dashboard/pick', name: 'Pick list' },
        'team-creation': { route: '/team-creation', name: 'Create New Team' },
        'bulk-operations': { route: '/bulk-operations', name: 'Bulk Operations Center' }
    },

    // Team Leader routes
    TEAM_LEADER: {
        'team-performance': { route: '/team-performance', name: 'Team Performance Dashboard' },
        'team performance': { route: '/team-performance', name: 'Team Performance Dashboard' },
        'team-reports': { route: '/team-reports', name: 'Team Reports' },
        'team-analytics': { route: '/team-analytics', name: 'Team Analytics' },
        'staff-overview': { route: '/staff-overview', name: 'Staff Overview' },
        'picklist': { route: '/dashboard/picklist', name: 'Pick List Management' },
        'team-targets': { route: '/team-targets', name: 'Team Targets & Goals' },
        'performance-tracking': { route: '/performance-tracking', name: 'Performance Tracking' }
    },

    // Van Staff routes
    VAN_STAFF: {
        'my-routes': { route: '/my-routes', name: 'My Routes' },
        'route-optimization': { route: '/route-optimization', name: 'Route Optimization' },
        'daily-targets': { route: '/daily-targets', name: 'Daily Targets' },
        'my-performance': { route: '/my-performance', name: 'My Performance' },
        'field-reports': { route: '/field-reports', name: 'Field Reports' },
        'customer-visits': { route: '/customer-visits', name: 'Customer Visits' }
    }
};