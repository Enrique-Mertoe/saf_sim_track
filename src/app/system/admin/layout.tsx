import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Administration',
  description: 'System administration panel for website management',
};

export default function SystemAdminLayout({
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