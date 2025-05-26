'use client';

import React, {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {forumService} from '@/services/forumService';
import {ForumTopic} from '@/models/forum';
import {User} from '@/models/users';
import Link from 'next/link';
import {ChevronLeft, ChevronRight, Clock, Eye, Lock, MessageSquare, Pin, Plus, Search, ThumbsUp} from 'lucide-react';
import useApp from "@/ui/provider/AppProvider";

export default function ForumPage() {
    const [topics, setTopics] = useState<ForumTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTopics, setTotalTopics] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const {user} = useApp()
    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Get current user
    useEffect(() => {
        const fetchUser = async () => {
            if (!user)
                return
            try {
                setCurrentUser(user);
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        };

        fetchUser();
    }, [user]);

    // Fetch topics
    useEffect(() => {
        const fetchTopics = async () => {
            setLoading(true);
            try {
                const result = await forumService.getTopics(page, 10, debouncedSearchTerm);
                setTopics(result.topics);
                setTotalPages(result.totalPages);
                setTotalTopics(result.totalCount);
            } catch (err: any) {
                setError(err.message || 'Failed to load topics');
            } finally {
                setLoading(false);
            }
        };

        fetchTopics();
    }, [page, debouncedSearchTerm]);

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/forum?${params.toString()}`);
    };

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Community Forum</h1>
                {currentUser && (
                    <Link
                        href="/forum/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <Plus size={18}/>
                        New Topic
                    </Link>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400"/>
                    </div>
                    <input
                        type="text"
                        placeholder="Search topics..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                         role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                ) : topics.length === 0 ? (
                    <div className="text-center py-20">
                        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No topics found</h3>
                        <p className="text-gray-500">
                            {debouncedSearchTerm
                                ? `No topics match your search "${debouncedSearchTerm}"`
                                : "Be the first to start a discussion!"
                            }
                        </p>
                        {currentUser && (
                            <Link
                                href="/forum/new"
                                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                            >
                                Create a new topic
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Topic
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Author
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stats
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Activity
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {topics.map((topic) => (
                                    <tr key={topic.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 mr-3">
                                                    <div
                                                        className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <MessageSquare className="h-5 w-5 text-blue-600"/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center">
                                                        <Link
                                                            href={`/forum/topic/${topic.id}`}
                                                            className="text-lg font-medium text-blue-600 hover:text-blue-800"
                                                        >
                                                            {topic.title}
                                                        </Link>
                                                        {topic.is_pinned && (
                                                            <Pin size={16} className="ml-2 text-yellow-500"/>
                                                        )}
                                                        {topic.is_closed && (
                                                            <Lock size={16} className="ml-2 text-red-500"/>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                        {topic.content.length > 150
                                                            ? `${topic.content.substring(0, 150)}...`
                                                            : topic.content
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {topic.author?.full_name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <MessageSquare size={16} className="mr-1"/>
                                                    {topic.reply_count}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <ThumbsUp size={16} className="mr-1"/>
                                                    {topic.like_count}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Eye size={16} className="mr-1"/>
                                                    {topic.view_count}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock size={16} className="mr-1"/>
                                                {formatDate(topic.updated_at)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(page * 10, totalTopics)}</span> of{' '}
                                <span className="font-medium">{totalTopics}</span> topics
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className={`px-3 py-1 rounded-md ${
                                        page === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    <ChevronLeft size={18}/>
                                </button>
                                {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                    // Show pages around current page
                                    let pageNum = page;
                                    if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }

                                    // Ensure page numbers are within valid range
                                    if (pageNum <= 0 || pageNum > totalPages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-1 rounded-md ${
                                                page === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className={`px-3 py-1 rounded-md ${
                                        page === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    <ChevronRight size={18}/>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {!currentUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">Join the conversation!</h3>
                    <p className="text-blue-600 mb-4">
                        Sign in to create topics and participate in discussions.
                    </p>
                    <Link
                        href="/accounts/login"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md inline-block"
                    >
                        Sign In
                    </Link>
                </div>
            )}
        </div>
    );
}