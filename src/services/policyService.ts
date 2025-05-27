/**
 * Service for checking and enforcing policies
 */

import {User} from '@/models';
import {Policy, PolicyFactory} from '@/models/policies';

/**
 * Service for checking and enforcing policies
 */
export class PolicyService {
  /**
   * Check if a user is authorized to perform an action
   * @param user The current user
   * @param action The action to check
   * @param resource The resource being accessed (optional)
   * @returns True if the user is authorized, false otherwise
   */
  static isAuthorized(user: User, action: string, resource?: any): boolean {
    if (!user) return false;

    // Get the appropriate policies for the action
    const policies = this.getPoliciesForAction(action, resource);
    
    // Check if any of the policies allow the action
    return policies.some(policy => policy.check(user, resource));
  }

  /**
   * Get the appropriate policies for an action
   * @param action The action to check
   * @param resource The resource being accessed (optional)
   * @returns An array of policies
   */
  private static getPoliciesForAction(action: string, resource?: any): Policy[] {
    const policies: Policy[] = [];
    
    switch (action) {
      case 'view_dashboard':
        // Anyone can view the dashboard
        policies.push(PolicyFactory.isAdmin());
        policies.push(PolicyFactory.isTeamLeader());
        policies.push(PolicyFactory.isStaff());
        break;
        
      case 'view_admin_dashboard':
        // Only admins can view the admin dashboard
        policies.push(PolicyFactory.isAdmin());
        break;
        
      case 'view_team_dashboard':
        // Team leaders can view their team dashboard
        policies.push(PolicyFactory.isTeamLeader());
        // Admins can view any team dashboard
        policies.push(PolicyFactory.isAdmin());
        break;
        
      case 'view_user':
        // Check if the user has access to the target user
        policies.push(PolicyFactory.hasAccessToUser());
        break;
        
      case 'create_user':
        // Only admins can create users
        policies.push(PolicyFactory.isAdmin());
        break;
        
      case 'update_user':
        // Check if the user has access to the target user
        policies.push(PolicyFactory.hasAccessToUser());
        break;
        
      case 'delete_user':
        // Only admins can delete users
        policies.push(PolicyFactory.isAdmin());
        break;
        
      case 'view_team':
        // Admins can view any team
        policies.push(PolicyFactory.isAdmin());
        // Team leaders can view their own team
        policies.push(PolicyFactory.isTeamLeaderOfTeam());
        // Team members can view their team
        policies.push(PolicyFactory.isTeamMember());
        break;
        
      case 'create_team':
        // Only admins can create teams
        policies.push(PolicyFactory.isAdmin());
        break;
        
      case 'update_team':
        // Admins can update any team
        policies.push(PolicyFactory.isAdmin());
        // Team leaders can update their own team
        policies.push(PolicyFactory.isTeamLeaderOfTeam());
        break;
        
      case 'delete_team':
        // Only admins can delete teams
        policies.push(PolicyFactory.isAdmin());
        break;
        
      case 'view_sim_card':
        // Check if the user has access to the resource
        policies.push(PolicyFactory.hasAccessToResource());
        break;
        
      case 'create_sim_card':
        // Admins, team leaders, and staff can create SIM cards
        policies.push(PolicyFactory.canCreateResource());
        break;
        
      case 'update_sim_card':
        // Check if the user can update the resource
        policies.push(PolicyFactory.canUpdateResource());
        break;
        
      case 'delete_sim_card':
        // Check if the user can delete the resource
        policies.push(PolicyFactory.canDeleteResource());
        break;
        
      case 'view_batch_metadata':
        // Check if the user has access to the resource
        policies.push(PolicyFactory.hasAccessToResource());
        break;
        
      case 'create_batch_metadata':
        // Admins, team leaders, and staff can create batch metadata
        policies.push(PolicyFactory.canCreateResource());
        break;
        
      case 'update_batch_metadata':
        // Check if the user can update the resource
        policies.push(PolicyFactory.canUpdateResource());
        break;
        
      case 'delete_batch_metadata':
        // Check if the user can delete the resource
        policies.push(PolicyFactory.canDeleteResource());
        break;
        
      case 'view_payment_request':
        // Check if the user has access to the resource
        policies.push(PolicyFactory.hasAccessToResource());
        break;
        
      case 'create_payment_request':
        // Admins, team leaders, and staff can create payment requests
        policies.push(PolicyFactory.canCreateResource());
        break;
        
      case 'update_payment_request':
        // Check if the user can update the resource
        policies.push(PolicyFactory.canUpdateResource());
        break;
        
      case 'delete_payment_request':
        // Check if the user can delete the resource
        policies.push(PolicyFactory.canDeleteResource());
        break;
        
      case 'view_subscription':
        // Check if the user has access to the resource
        policies.push(PolicyFactory.hasAccessToResource());
        break;
        
      case 'create_subscription':
        // Admins, team leaders, and staff can create subscriptions
        policies.push(PolicyFactory.canCreateResource());
        break;
        
      case 'update_subscription':
        // Check if the user can update the resource
        policies.push(PolicyFactory.canUpdateResource());
        break;
        
      case 'delete_subscription':
        // Check if the user can delete the resource
        policies.push(PolicyFactory.canDeleteResource());
        break;
        
      default:
        // For unknown actions, default to requiring admin privileges
        policies.push(PolicyFactory.isAdmin());
        break;
    }
    
    return policies;
  }

  /**
   * Enforce a policy check, throwing an error if the check fails
   * @param user The current user
   * @param action The action to check
   * @param resource The resource being accessed (optional)
   * @throws Error if the user is not authorized
   */
  static enforcePolicy(user: User, action: string, resource?: any): void {
    if (!this.isAuthorized(user, action, resource)) {
      throw new Error(`User is not authorized to perform action: ${action}`);
    }
  }

  /**
   * Filter a list of resources based on the user's access
   * @param user The current user
   * @param resources The resources to filter
   * @returns The filtered resources
   */
  static filterAccessibleResources<T>(user: User, resources: T[]): T[] {
    if (!user || !resources) return [];
    
    const policy = PolicyFactory.hasAccessToResource();
    return resources.filter(resource => policy.check(user, resource));
  }

  /**
   * Filter a list of users based on the current user's access
   * @param currentUser The current user
   * @param users The users to filter
   * @returns The filtered users
   */
  static filterAccessibleUsers(currentUser: User, users: User[]): User[] {
    if (!currentUser || !users) return [];
    
    const policy = PolicyFactory.hasAccessToUser();
    return users.filter(user => policy.check(currentUser, user));
  }

  /**
   * Get the actions a user is authorized to perform on a resource
   * @param user The current user
   * @param resource The resource
   * @returns An array of authorized actions
   */
  static getAuthorizedActions(user: User, resource: any): string[] {
    if (!user || !resource) return [];
    
    const allActions = [
      'view', 'create', 'update', 'delete'
    ];
    
    return allActions.filter(action => {
      const actionKey = `${action}_${this.getResourceType(resource)}`;
      return this.isAuthorized(user, actionKey, resource);
    });
  }

  /**
   * Get the type of a resource
   * @param resource The resource
   * @returns The resource type
   */
  private static getResourceType(resource: any): string {
    if (!resource) return 'unknown';
    
    // Try to determine the resource type from its properties
    if ('serial_number' in resource) return 'sim_card';
    if ('batch_id' in resource) return 'batch_metadata';
    if ('reference' in resource) return 'payment_request';
    if ('plan_id' in resource) return 'subscription';
    if ('leader_id' in resource) return 'team';
    if ('role' in resource) return 'user';
    
    return 'unknown';
  }
}

// Export a singleton instance
const policyService = new PolicyService();
export default policyService;