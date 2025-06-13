import React from 'react';
import {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Login to the system administration panel',
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {children}
    </div>
  );
}