'use server';

import {createServerClient} from '@/lib/supabase/server';

// Type for storing user account information
type UserAccount = {
  id: string;
  email: string;
  fullName: string;
  lastLogin: string;
};

// Table name for storing user accounts
const USER_ACCOUNTS_TABLE = 'previous_accounts';

/**
 * Store a user account in the database
 * This will be called after successful login
 */
export async function storeUserAccount(user: UserAccount): Promise<void> {
  try {
    const supabase = await createServerClient();

    // Check if this account already exists
    const { data: existingAccount } = await supabase
      .from(USER_ACCOUNTS_TABLE)
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingAccount) {
      // Update existing account with new login time
      await supabase
        .from(USER_ACCOUNTS_TABLE)
        .update({
          lastLogin: new Date().toISOString()
        })
        .eq('id', user.id);
    } else {
      // Add new account with current login time
      await supabase
        .from(USER_ACCOUNTS_TABLE)
        .insert({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          lastLogin: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error storing user account in database:', error);
  }
}

/**
 * Get previously logged in accounts from database
 */
export async function getPreviousAccounts(): Promise<UserAccount[]> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from(USER_ACCOUNTS_TABLE)
      .select('*')
      .order('lastLogin', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    return data as UserAccount[] || [];
  } catch (error) {
    console.error('Error getting previous accounts from database:', error);
    return [];
  }
}
