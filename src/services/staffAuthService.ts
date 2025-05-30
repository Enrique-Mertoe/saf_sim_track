import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import {createServerClient} from '@/lib/supabase/server';
import {User, UserRole} from '@/models';

// Secret key for JWT signing - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

interface StaffAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: Partial<User>;
    accessToken?: string;
    refreshToken?: string;
  };
  error?: any;
}

interface TokenPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
}

export const staffAuthService = {
  /**
   * Authenticate a staff member using username, email, or phone and password
   */
  async authenticate(identifier: string, password: string): Promise<StaffAuthResponse> {
    try {
      const supabase = await createServerClient();

      // Determine if identifier is email, phone, or username
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', UserRole.STAFF);

      // Check if identifier is an email (contains @ symbol)
      if (identifier.includes('@')) {
        query = query.eq('email', identifier);
      } 
      // Check if identifier is a phone number (starts with + or contains only digits)
      else if (identifier.startsWith('+') || /^\d+$/.test(identifier)) {
        // Try different phone formats similar to the existing signInWithPhone method
        const normalizedPhone = identifier.replace(/\D/g, '');
        const lastNineDigits = normalizedPhone.slice(-9);

        query = query.or(
          `phone_number.eq.${identifier},phone_number.eq.+${normalizedPhone},phone_number.eq.+254${lastNineDigits},phone_number.eq.0${lastNineDigits},phone_number.ilike.%${lastNineDigits}`
        );
      } 
      // Otherwise, assume it's a username
      else {
        query = query.eq('username', identifier);
      }

      // Execute the query
      const { data: users, error } = await query;

      if (error) {
        return {
          success: false,
          message: 'Database error occurred',
          error
        };
      }
      console.log("jj",users)

      if (!users || users.length === 0) {
        return {
          success: false,
          message: 'Account not found'
        };
      }

      // We might have multiple users if phone number matched multiple formats
      // Find the first one with a valid password
      for (const user of users) {
        if (!user.password) {
          continue; // Skip users without passwords
        }

        try {
          // Verify password using argon2
          const passwordValid = await argon2.verify(user.password, password);

          if (passwordValid) {
            // Generate tokens
            const accessToken = jwt.sign(
              { userId: user.id, role: user.role, type: 'access' } as TokenPayload,
              JWT_SECRET,
              { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            const refreshToken = jwt.sign(
              { userId: user.id, role: user.role, type: 'refresh' } as TokenPayload,
              JWT_REFRESH_SECRET,
              { expiresIn: REFRESH_TOKEN_EXPIRY }
            );

            // Update last login timestamp
            await supabase
              .from('users')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', user.id);

            // Return user data and tokens
            const { password, ...userWithoutPassword } = user;

            return {
              success: true,
              message: 'Authentication successful',
              data: {
                user: userWithoutPassword,
                accessToken,
                refreshToken
              }
            };
          }
        } catch (verifyError) {
          console.error('Password verification error:', verifyError);
        }
      }

      // If we get here, no user had a valid password
      return {
        success: false,
        message: 'Invalid credentials'
      };
    } catch (error) {
      console.error('Staff authentication error:', error);
      return {
        success: false,
        message: 'Authentication failed',
        error
      };
    }
  },

  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<StaffAuthResponse> {
    try {
      // Verify the refresh token
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;

      // Check if it's a refresh token
      if (payload.type !== 'refresh') {
        return {
          success: false,
          message: 'Invalid token type'
        };
      }

      // Get user from database to ensure they still exist and are active
      const supabase = await createServerClient();
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .eq('role', UserRole.STAFF)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return {
          success: false,
          message: 'User not found or inactive',
          error
        };
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId: user.id, role: user.role, type: 'access' } as TokenPayload,
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      // Return new access token
      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken
        }
      };
    } catch (error) {
      // Handle token verification errors
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          success: false,
          message: 'Invalid token'
        };
      } else if (error instanceof jwt.TokenExpiredError) {
        return {
          success: false,
          message: 'Token expired'
        };
      }

      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Token refresh failed',
        error
      };
    }
  },

  /**
   * Hash a password using argon2
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  },

  /**
   * Reset password for a staff member
   */
  async resetPassword(userId: string, newPassword: string): Promise<StaffAuthResponse> {
    try {
      const supabase = await createServerClient();

      // Get the user from the database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('role', UserRole.STAFF)
        .single();

      if (error || !user) {
        return {
          success: false,
          message: 'User not found',
          error
        };
      }

      // Verify current password
      if (!user.password) {
        return {
          success: false,
          message: 'User has no password set'
        };
      }

      // try {
      //   const passwordValid = await argon2.verify(user.password, currentPassword);
      //
      //   if (!passwordValid) {
      //     return {
      //       success: false,
      //       message: 'Current password is incorrect'
      //     };
      //   }
      // } catch (verifyError) {
      //   console.error('Password verification error:', verifyError);
      //   return {
      //     success: false,
      //     message: 'Password verification failed',
      //     error: verifyError
      //   };
      // }

      // Hash the new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update the user's password and set is_first_login to false
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword,
          is_first_login: false
        })
        .eq('id', userId);

      if (updateError) {
        return {
          success: false,
          message: 'Failed to update password',
          error: updateError
        };
      }

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Password reset failed',
        error
      };
    }
  },

  /**
   * Verify a JWT token
   */
  verifyToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return { valid: true, payload };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      } else if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      }
      return { valid: false, error: 'Token verification failed' };
    }
  }
};
