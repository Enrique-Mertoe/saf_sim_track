import React from 'react';
import {Metadata} from 'next';
import AdminSidebar from '@/ui/components/admin/AdminSidebar';

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            <div className="fixed">
                <AdminSidebar/>
            </div>
            <div className="flex-1 p-4 lg:ml-64">
                {children}
            </div>
        </div>
    );
}
