"use client"
import {useEffect, useState} from 'react';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {authService, securityService} from '@/services';
import {SecurityActivity, SecurityFormValues} from "@/types";
import toast from 'react-hot-toast';
// Basic password schema that only enforces required fields and matching confirmation
const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
  twoFactor: Yup.boolean(),
});

// Strong password validation for warnings only
const isStrongPassword = (password: string): boolean => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

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
  const [passwordStrength, setPasswordStrength] = useState<{isStrong: boolean; warning: string | null}>({
    isStrong: true,
    warning: null
  });

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
          // Show loading toast
          const loadingToastId = toast.loading('Updating password...');

          try {
            await authService.updatePassword(values.currentPassword, values.newPassword);

            // Dismiss loading toast and show success toast
            toast.dismiss(loadingToastId);
            toast.success('Password updated successfully');

            // Reset password fields
            await helpers.setFieldValue('currentPassword', '');
            await helpers.setFieldValue('newPassword', '');
            await helpers.setFieldValue('confirmPassword', '');

            // Refresh security data
            await fetchSecurityData();
          } catch (err: any) {
            // Dismiss loading toast and show error toast
            toast.dismiss(loadingToastId);
            toast.error(err.message || 'Failed to update password');
            throw err; // Re-throw to be caught by the outer catch
          }
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
        const errorMessage = err.message || 'Failed to update security settings';
        setError(errorMessage);

        // Show error toast if not already shown by the inner catch block
        // This handles errors from two-factor authentication or other operations
        if (!errorMessage.includes('Failed to update password')) {
          toast.error(errorMessage);
        }
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

  // Check password strength when newPassword changes
  useEffect(() => {
    const password = securityFormik.values.newPassword;
    if (password) {
      if (!isStrongPassword(password)) {
        setPasswordStrength({
          isStrong: false,
          warning: 'Weak password: For stronger security, use at least 8 characters with uppercase, lowercase, numbers, and special characters.'
        });
      } else {
        setPasswordStrength({
          isStrong: true,
          warning: null
        });
      }
    } else {
      setPasswordStrength({
        isStrong: true,
        warning: null
      });
    }
  }, [securityFormik.values.newPassword]);

  // Enable two-factor authentication
  const enableTwoFactor = async () => {
    // Show loading toast
    const loadingToastId = toast.loading('Enabling two-factor authentication...');

    try {
      setTwoFactorPending(true);
      const result = await securityService.enableTwoFactor(twoFactorMethod);

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId);
        // Dismiss loading toast and show info toast
        toast.dismiss(loadingToastId);
        toast.success('Verification code sent. Please verify to complete setup.');
      } else {
        // Dismiss loading toast and show success toast
        toast.dismiss(loadingToastId);
        toast.success('Two-factor authentication enabled');
      }

      await fetchSecurityData();
    } catch (err: any) {
      // Dismiss loading toast and show error toast
      toast.dismiss(loadingToastId);
      const errorMessage = err.message || 'Failed to enable two-factor authentication';
      setError(errorMessage);
      toast.error(errorMessage);
      securityFormik.setFieldValue('twoFactor', false, false);
    }
  };

  // Disable two-factor authentication
  const disableTwoFactor = async () => {
    // Show loading toast
    const loadingToastId = toast.loading('Disabling two-factor authentication...');

    try {
      await securityService.disableTwoFactor();
      setTwoFactorPending(false);
      setVerificationId(null);
      await fetchSecurityData();

      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToastId);
      toast.success('Two-factor authentication disabled');
    } catch (err: any) {
      // Dismiss loading toast and show error toast
      toast.dismiss(loadingToastId);
      const errorMessage = err.message || 'Failed to disable two-factor authentication';
      setError(errorMessage);
      toast.error(errorMessage);
      securityFormik.setFieldValue('twoFactor', true, false);
    }
  };

  // Verify two-factor code
  const verifyTwoFactorCode = async (code: string) => {
    if (!verificationId) {
      const errorMessage = 'No verification in progress';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }

    // Show loading toast
    const loadingToastId = toast.loading('Verifying code...');

    try {
      const verified = await securityService.verifyTwoFactorCode(verificationId, code);

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      if (verified) {
        setTwoFactorPending(false);
        setVerificationId(null);
        await fetchSecurityData();
        toast.success('Two-factor authentication enabled successfully');
      } else {
        const errorMessage = 'Invalid verification code';
        setError(errorMessage);
        toast.error(errorMessage);
      }

      return verified;
    } catch (err: any) {
      // Dismiss loading toast and show error toast
      toast.dismiss(loadingToastId);
      const errorMessage = err.message || 'Failed to verify code';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  // Resend verification code
  const resendVerificationCode = async () => {
    // Show loading toast
    const loadingToastId = toast.loading('Sending verification code...');

    try {
      const result = await securityService.sendTwoFactorCode(twoFactorMethod);

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      if (result.success) {
        setVerificationId(result.verificationId);
        toast.success('Verification code sent successfully');
        return true;
      }

      toast.error('Failed to send verification code');
      return false;
    } catch (err: any) {
      // Dismiss loading toast and show error toast
      toast.dismiss(loadingToastId);
      const errorMessage = err.message || 'Failed to send verification code';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  // Terminate a session
  const terminateSession = async (sessionId: string) => {
    // Show loading toast
    const loadingToastId = toast.loading('Terminating session...');

    try {
      await securityService.terminateSession(sessionId);

      // Refresh sessions
      const sessions = await securityService.getActiveSessions();
      setActiveSessions(sessions as any);

      // Refresh security activity
      await fetchSecurityData();

      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToastId);
      toast.success('Session terminated successfully');
    } catch (err: any) {
      // Dismiss loading toast and show error toast
      toast.dismiss(loadingToastId);
      const errorMessage = err.message || 'Failed to terminate session';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Terminate all other sessions
  const terminateAllOtherSessions = async () => {
    // Show loading toast
    const loadingToastId = toast.loading('Terminating all other sessions...');

    try {
      await securityService.terminateAllOtherSessions();

      // Refresh sessions
      const sessions = await securityService.getActiveSessions();
      setActiveSessions(sessions as any);

      // Refresh security activity
      await fetchSecurityData();

      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToastId);
      toast.success('All other sessions terminated successfully');
    } catch (err: any) {
      // Dismiss loading toast and show error toast
      toast.dismiss(loadingToastId);
      const errorMessage = err.message || 'Failed to terminate sessions';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Change two-factor method
  const changeTwoFactorMethod = (method: 'email' | 'sms') => {
    setTwoFactorMethod(method);
    toast.success(`Two-factor method changed to ${method}`);
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
    passwordStrength,
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
