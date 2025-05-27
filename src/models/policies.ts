/**
 * Policy definitions for the application
 * These policies define what actions users can perform based on their roles
 */

import {Team, UserRole} from ".";
import {User} from "./users";


/**
 * Interface representing a policy that can be checked
 */
export interface Policy {
  /**
   * Check if the policy allows the action
   * @param user The current user
   * @param resource The resource being accessed (optional)
   * @returns True if the action is allowed, false otherwise
   */
  check(user: User, resource?: any): boolean;
}

/**
 * Policy to check if a user is an admin
 */
export class IsAdminPolicy implements Policy {
  check(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }
}

/**
 * Policy to check if a user is a team leader
 */
export class IsTeamLeaderPolicy implements Policy {
  check(user: User): boolean {
    return user.role === UserRole.TEAM_LEADER;
  }
}

/**
 * Policy to check if a user is a staff member
 */
export class IsStaffPolicy implements Policy {
  check(user: User): boolean {
    return user.role === UserRole.STAFF;
  }
}

/**
 * Policy to check if a user is a team leader of a specific team
 */
export class IsTeamLeaderOfTeamPolicy implements Policy {
  check(user: User, team: Team): boolean {
    if (!team) return false;
    return user.role === UserRole.TEAM_LEADER && team.leader_id === user.id;
  }
}

/**
 * Policy to check if a user is an admin of a specific team
 */
export class IsAdminOfTeamPolicy implements Policy {
  check(user: User, team: Team): boolean {
    if (!team) return false;
    return user.role === UserRole.ADMIN && team.admin_id === user.id;
  }
}

/**
 * Policy to check if a user is a member of a specific team
 */
export class IsTeamMemberPolicy implements Policy {
  check(user: User, team: Team): boolean {
    if (!team) return false;
    return user.team_id === team.id;
  }
}

/**
 * Policy to check if a user has access to a specific user
 */
export class HasAccessToUserPolicy implements Policy {
  check(user: User, targetUser: User): boolean {
    if (!targetUser) return false;
    
    // Users can always access themselves
    if (user.id === targetUser.id) return true;
    
    // Admins can access users in teams they administer
    if (user.role === UserRole.ADMIN && targetUser.team_id) {
      // This would need to be checked against the database
      // to see if the admin administers the team
      // For now, we'll assume they do if the user has a team
      return true;
    }
    
    // Team leaders can access users in their team
    if (user.role === UserRole.TEAM_LEADER && user.team_id === targetUser.team_id) {
      return true;
    }
    
    return false;
  }
}

/**
 * Policy to check if a user has access to a specific resource
 */
export class HasAccessToResourcePolicy implements Policy {
  check(user: User, resource: any): boolean {
    if (!resource) return false;
    
    // Users can always access resources they created
    if (resource.created_by_user_id === user.id || resource.user_id === user.id) {
      return true;
    }
    
    // Admins can access resources for teams they administer
    if (user.role === UserRole.ADMIN && resource.team_id) {
      // This would need to be checked against the database
      // to see if the admin administers the team
      // For now, we'll assume they do if the resource has a team
      return true;
    }
    
    // Team leaders can access resources for their team
    if (user.role === UserRole.TEAM_LEADER && user.team_id === resource.team_id) {
      return true;
    }
    
    return false;
  }
}

/**
 * Policy to check if a user can create a resource
 */
export class CanCreateResourcePolicy implements Policy {
  check(user: User, resourceType: string): boolean {
    // Admins can create any resource
    if (user.role === UserRole.ADMIN) return true;
    
    // Team leaders can create most resources
    if (user.role === UserRole.TEAM_LEADER) {
      // Team leaders can't create certain resources
      const restrictedResources = ['teams', 'users'];
      return !restrictedResources.includes(resourceType);
    }
    
    // Staff can create limited resources
    if (user.role === UserRole.STAFF) {
      const allowedResources = ['sim_cards', 'payment_requests'];
      return allowedResources.includes(resourceType);
    }
    
    return false;
  }
}

/**
 * Policy to check if a user can update a resource
 */
export class CanUpdateResourcePolicy implements Policy {
  check(user: User, resource: any): boolean {
    if (!resource) return false;
    
    // Users can always update resources they created
    if (resource.created_by_user_id === user.id || resource.user_id === user.id) {
      return true;
    }
    
    // Admins can update resources for teams they administer
    if (user.role === UserRole.ADMIN && resource.team_id) {
      // This would need to be checked against the database
      // to see if the admin administers the team
      // For now, we'll assume they do if the resource has a team
      return true;
    }
    
    // Team leaders can update resources for their team
    if (user.role === UserRole.TEAM_LEADER && user.team_id === resource.team_id) {
      return true;
    }
    
    return false;
  }
}

/**
 * Policy to check if a user can delete a resource
 */
export class CanDeleteResourcePolicy implements Policy {
  check(user: User, resource: any): boolean {
    if (!resource) return false;
    
    // Only admins and team leaders can delete resources
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.TEAM_LEADER) {
      return false;
    }
    
    // Admins can delete resources for teams they administer
    if (user.role === UserRole.ADMIN && resource.team_id) {
      // This would need to be checked against the database
      // to see if the admin administers the team
      // For now, we'll assume they do if the resource has a team
      return true;
    }
    
    // Team leaders can delete resources for their team
    if (user.role === UserRole.TEAM_LEADER && user.team_id === resource.team_id) {
      return true;
    }
    
    return false;
  }
}

/**
 * Policy checker utility to check multiple policies
 */
export class PolicyChecker {
  /**
   * Check if any of the policies allow the action
   * @param policies The policies to check
   * @param user The current user
   * @param resource The resource being accessed (optional)
   * @returns True if any policy allows the action, false otherwise
   */
  static checkAny(policies: Policy[], user: User, resource?: any): boolean {
    return policies.some(policy => policy.check(user, resource));
  }
  
  /**
   * Check if all of the policies allow the action
   * @param policies The policies to check
   * @param user The current user
   * @param resource The resource being accessed (optional)
   * @returns True if all policies allow the action, false otherwise
   */
  static checkAll(policies: Policy[], user: User, resource?: any): boolean {
    return policies.every(policy => policy.check(user, resource));
  }
}

/**
 * Policy factory to create policy instances
 */
export class PolicyFactory {
  static isAdmin(): Policy {
    return new IsAdminPolicy();
  }
  
  static isTeamLeader(): Policy {
    return new IsTeamLeaderPolicy();
  }
  
  static isStaff(): Policy {
    return new IsStaffPolicy();
  }
  
  static isTeamLeaderOfTeam(): Policy {
    return new IsTeamLeaderOfTeamPolicy();
  }
  
  static isAdminOfTeam(): Policy {
    return new IsAdminOfTeamPolicy();
  }
  
  static isTeamMember(): Policy {
    return new IsTeamMemberPolicy();
  }
  
  static hasAccessToUser(): Policy {
    return new HasAccessToUserPolicy();
  }
  
  static hasAccessToResource(): Policy {
    return new HasAccessToResourcePolicy();
  }
  
  static canCreateResource(): Policy {
    return new CanCreateResourcePolicy();
  }
  
  static canUpdateResource(): Policy {
    return new CanUpdateResourcePolicy();
  }
  
  static canDeleteResource(): Policy {
    return new CanDeleteResourcePolicy();
  }
}