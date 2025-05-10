"use client"
import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {authService, securityService} from '@/services';
import {SecurityActivity, SecurityFormValues} from "@/types";
const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
  twoFactor: Yup.boolean(),
});

// Hook for managing security features
export const useSecurity = () => {
  // State
  const [securityActivity, setSecurityActivity] = useState<SecurityActivity | null>(null);
  const [activeSessions, setActiveSessions] = useState<{ device: string; lastActive: Date; ipAddress: string; id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'email' | 'sms'>('email');
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // Initial setup
  useEffect(() => {
    fetchSecurityData();
  }, []);

  // Fetch all security related data
  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get security activity
      const activity = await securityService.getSecurityActivity();
      setSecurityActivity(activity);

      // Get active sessions
      const sessions = await securityService.getActiveSessions();
      setActiveSessions(sessions as any); // Type casting for demo purposes

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load security data');
      setLoading(false);
    }
  };

  // Security form with formik
  const securityFormik = useFormik<SecurityFormValues>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactor: false,
    },
    validationSchema: passwordSchema,
    onSubmit: async (values, helpers) => {
      try {
        setError(null);

        // Handle password update if values are provided
        if (values.currentPassword && values.newPassword) {
          await authService.updatePassword(values.currentPassword, values.newPassword);

          // Reset password fields
          await helpers.setFieldValue('currentPassword', '');
          await helpers.setFieldValue('newPassword', '');
          await helpers.setFieldValue('confirmPassword', '');

          // Refresh security data
          await fetchSecurityData();
        }

        // Handle two-factor toggle
        //@ts-ignore
        if (values.twoFactor !== (securityActivity?.twoFactorEnabled ?? false)) {
          if (values.twoFactor) {
            await enableTwoFactor();
          } else {
            await disableTwoFactor();
          }
        }

      } catch (err: any) {
        setError(err.message || 'Failed to update security settings');
      }
    },
  });

  // Initialize form when security activity is loaded
  useEffect(() => {
    if (securityActivity) {
      //@ts-ignore
      securityFormik.setFieldValue('twoFactor', securityActivity.twoFactorEnabled || false, false);
    }
  }, [securityActivity]);

  // Enable two-factor authentication
  const enableTwoFactor = async () => {
    try {
      setTwoFactorPending(true);
      const result = await securityService.enableTwoFactor(twoFactorMethod);

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId);
      }

      await fetchSecurityData();
    } catch (err: any) {
      setError(err.message || 'Failed to enable two-factor authentication');
      securityFormik.setFieldValue('twoFactor', false, false);
    }
  };

  // Disable two-factor authentication
  const disableTwoFactor = async () => {
    try {
      await securityService.disableTwoFactor();
      setTwoFactorPending(false);
      setVerificationId(null);
      await fetchSecurityData();
    } catch (err: any) {
      setError(err.message || 'Failed to disable two-factor authentication');
      securityFormik.setFieldValue('twoFactor', true, false);
    }
  };

  // Verify two-factor code
  const verifyTwoFactorCode = async (code: string) => {
    if (!verificationId) {
      setError('No verification in progress');
      return false;
    }

    try {
      const verified = await securityService.verifyTwoFactorCode(verificationId, code);

      if (verified) {
        setTwoFactorPending(false);
        setVerificationId(null);
        await fetchSecurityData();
      } else {
        setError('Invalid verification code');
      }

      return verified;
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
      return false;
    }
  };

  // Resend verification code
  const resendVerificationCode = async () => {
    try {
      const result = await securityService.sendTwoFactorCode(twoFactorMethod);

      if (result.success) {
        setVerificationId(result.verificationId);
        return true;
      }

      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      return false;
    }
  };

  // Terminate a session
  const terminateSession = async (sessionId: string) => {
    try {
      await securityService.terminateSession(sessionId);

      // Refresh sessions
      const sessions = await securityService.getActiveSessions();
      setActiveSessions(sessions as any);

      // Refresh security activity
      await fetchSecurityData();
    } catch (err: any) {
      setError(err.message || 'Failed to terminate session');
    }
  };

  // Terminate all other sessions
  const terminateAllOtherSessions = async () => {
    try {
      await securityService.terminateAllOtherSessions();

      // Refresh sessions
      const sessions = await securityService.getActiveSessions();
      setActiveSessions(sessions as any);

      // Refresh security activity
      await fetchSecurityData();
    } catch (err: any) {
      setError(err.message || 'Failed to terminate sessions');
    }
  };

  // Change two-factor method
  const changeTwoFactorMethod = (method: 'email' | 'sms') => {
    setTwoFactorMethod(method);
  };

  return {
    securityFormik,
    securityActivity,
    activeSessions,
    loading,
    error,
    twoFactorMethod,
    twoFactorPending,
    verificationId,
    fetchSecurityData,
    terminateSession,
    terminateAllOtherSessions,
    verifyTwoFactorCode,
    resendVerificationCode,
    changeTwoFactorMethod,
  };
};

// // src/hooks/useSession.ts
// import { useState, useEffect } from 'react';
// import { User } from '@supabase/supabase-js';
// import { AuthService } from '../services/supabaseAuthService';
// import { securityService } from '@/services';
// import { SecurityFormValues } from '@/types';
//
// export const useSession = () => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//
//   useEffect(() => {
//     const checkUser = async () => {
//       try {
//         setLoading(true);
//         const currentUser = await AuthService.getCurrentUser();
//         setUser(currentUser);
//       } catch (err: any) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     checkUser();
//   }, []);
//
//   const signIn = async (email: string, password: string) => {
//     try {
//       setLoading(true);
//       setError(null);
//
//       const { user } = await AuthService.signIn(email, password);
//       setUser(user);
//
//       return { success: true, user };
//     } catch (err: any) {
//       setError(err.message);
//       return { success: false, error: err.message };
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const signOut = async () => {
//     try {
//       setLoading(true);
//       await AuthService.signOut();
//       setUser(null);
//       return { success: true };
//     } catch (err: any) {
//       setError(err.message);
//       return { success: false, error: err.message };
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   return {
//     user,
//     loading,
//     error,
//     signIn,
//     signOut,
//     isAuthenticated: !!user,
//   };
// };