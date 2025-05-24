"use client"
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useApp from "@/ui/provider/AppProvider";
import { UserRole } from "@/models/types";

interface RoleBasedSettingsWrapperProps {
  children: React.ReactNode;
}

const RoleBasedSettingsWrapper: React.FC<RoleBasedSettingsWrapperProps> = ({ children }) => {
  const { user } = useApp();
  const router = useRouter();

  useEffect(() => {
    // If user is STAFF, redirect to dashboard
    if (user?.role === UserRole.STAFF) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // If user is STAFF, don't render children (to prevent flash of content)
  if (user?.role === UserRole.STAFF) {
    return null;
  }

  // For ADMIN and TEAM_LEADER, render the settings page
  return <>{children}</>;
};

export default RoleBasedSettingsWrapper;