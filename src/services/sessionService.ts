import {UserAccount} from '@/app/accounts/login/types';

// Enhanced UserAccount type to include tokens for authentication
interface EnhancedUserAccount extends UserAccount {
  hasStoredTokens?: boolean;
  accessToken?: string;
  refreshToken?: string;
}

// Client-side wrapper for session actions
export const sessionService = {
  // Get previously logged in accounts
  async getPreviousAccounts(): Promise<EnhancedUserAccount[]> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch previous accounts');
      }

      const accounts = await response.json();

      // Sort accounts by last login (most recent first)
      return accounts.sort((a: EnhancedUserAccount, b: EnhancedUserAccount) =>
          new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
      );
    } catch (error) {
      console.error('Error fetching previous accounts:', error);
      return [];
    }
  },

  // Store user account after successful login
  async storeUserAccount(userData: EnhancedUserAccount): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          lastLogin: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to store user account');
      }

      return true;
    } catch (error) {
      console.error('Error storing user account:', error);
      return false;
    }
  },

  // Remove a stored account
  async removeUserAccount(accountId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove user account');
      }

      return true;
    } catch (error) {
      console.error('Error removing user account:', error);
      return false;
    }
  },

  // Clear all stored accounts
  async clearAllAccounts(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/session/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear all accounts');
      }

      return true;
    } catch (error) {
      console.error('Error clearing all accounts:', error);
      return false;
    }
  }
};
