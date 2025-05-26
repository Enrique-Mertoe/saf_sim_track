import React from 'react';
import Link from 'next/link';
import {Home, MessageSquare} from 'lucide-react';
import {AppProvider} from "@/ui/provider/AppProvider";

export const metadata = {
    title: 'Community Forum | SafaricomSIM Tracking',
    description: 'Discuss topics and share experiences with the community',
};

export default function ForumLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    return (
        <AppProvider>
            <div className="min-h-screen bg-gray-50">
                {/* Breadcrumb navigation */}
                <div className="bg-white border-b border-gray-200">
                    <div className="container mx-auto px-4 py-3">
                        <nav className="flex" aria-label="Breadcrumb">
                            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                <li className="inline-flex items-center">
                                    <Link
                                        href="/"
                                        className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                                    >
                                        <Home className="mr-2 h-4 w-4"/>
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <svg
                                            className="w-3 h-3 text-gray-400 mx-1"
                                            aria-hidden="true"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 6 10"
                                        >
                                            <path
                                                stroke="currentColor"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="m1 9 4-4-4-4"
                                            />
                                        </svg>
                                        <Link
                                            href="/forum"
                                            className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                                        >
                                            Forum
                                        </Link>
                                    </div>
                                </li>
                            </ol>
                        </nav>
                    </div>
                </div>

                {/* Forum header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-full">
                                <MessageSquare className="h-8 w-8"/>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Community Forum</h1>
                                <p className="text-blue-100">
                                    Share your experiences and discuss topics with the community
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <main>{children}</main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 mt-12">
                    <div className="container mx-auto px-4 py-6">
                        <div className="text-center text-gray-500 text-sm">
                            <p>
                                &copy; {new Date().getFullYear()} SafaricomSIM Tracking. All rights
                                reserved.
                            </p>
                            <p className="mt-2">
                                Please follow our community guidelines when posting in the forum.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppProvider>
    );
}