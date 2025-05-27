'use client';

import React, {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {forumService} from '@/services/forumService';
import {ForumPost, ForumTopic} from '@/models/forum';
import {User} from '@/models/users';
import {
    AlertTriangle,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    Eye,
    Heart,
    MessageSquare,
    Send,
    Trash2,
    User as UserIcon
} from 'lucide-react';
import useApp from "@/ui/provider/AppProvider";

interface TopicPageProps {
    params: {
        id: string;
    };
}
export default function TopicPage({ params }: TopicPageProps) {
    const [topic, setTopic] = useState<ForumTopic | null>(null);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const {user} = useApp()
    const replyFormRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Get current user
    useEffect(() => {
        const fetchUser = async () => {
            if (!user) return;
            try {

                setCurrentUser(user);
            } catch (err) {
                console.error('Error fetching user:', err);
            }
        };

        fetchUser();
    }, [user]);

    useEffect(() => {
        const fetchTopicAndPosts = async () => {
            setLoading(true);
            try {
                const result = await forumService.getTopic(params.id, page);
                setTopic(result.topic);
                setPosts(result.posts);
                setTotalPages(result.totalPages);
                setTotalPosts(result.totalCount);
            } catch (err: any) {
                setError(err.message || 'Failed to load topic');
            } finally {
                setLoading(false);
            }
        };

        fetchTopicAndPosts();
    }, [params.id, page]);

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
        window.scrollTo({top: 0, behavior: 'smooth'});
    };

    // Handle reply submission
    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) {
            alert('You must be logged in to reply');
            return;
        }

        if (!replyContent.trim()) {
            alert('Reply cannot be empty');
            return;
        }

        setSubmitting(true);

        try {
            await forumService.createPost({
                topic_id: params.id,
                content: replyContent
            });

            // Refresh posts
            const result = await forumService.getTopic(params.id, page);
            setTopic(result.topic);
            setPosts(result.posts);
            setTotalPages(result.totalPages);
            setTotalPosts(result.totalCount);

            // Clear form
            setReplyContent('');
            setShowReplyForm(false);

            // Scroll to the latest post if on the last page
            if (page === totalPages) {
                window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
            } else {
                // Navigate to the last page
                setPage(result.totalPages);
            }
        } catch (err: any) {
            alert(`Error posting reply: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle like toggle
    const handleLike = async (type: 'topic' | 'post', id: string) => {
        if (!currentUser) {
            alert('You must be logged in to like content');
            return;
        }

        try {
            if (type === 'topic' && topic) {
                await forumService.toggleLike({topic_id: id});
                setTopic({
                    ...topic,
                    like_count: topic.user_has_liked
                        ? (topic.like_count || 0) - 1
                        : (topic.like_count || 0) + 1,
                    user_has_liked: !topic.user_has_liked
                });
            } else if (type === 'post') {
                await forumService.toggleLike({post_id: id});
                setPosts(posts.map(post => {
                    if (post.id === id) {
                        return {
                            ...post,
                            like_count: post.user_has_liked
                                ? (post.like_count || 0) - 1
                                : (post.like_count || 0) + 1,
                            user_has_liked: !post.user_has_liked
                        };
                    }
                    return post;
                }));
            }
        } catch (err: any) {
            alert(`Error toggling like: ${err.message}`);
        }
    };

    // Handle delete
    const handleDelete = async (type: 'topic' | 'post', id: string) => {
        if (!currentUser) {
            alert('You must be logged in to delete content');
            return;
        }

        if (confirmDelete !== id) {
            setConfirmDelete(id);
            return;
        }

        try {
            if (type === 'topic') {
                await forumService.deleteTopic(id);
                router.push('/forum');
            } else if (type === 'post') {
                await forumService.deletePost(id);

                // Refresh posts
                const result = await forumService.getTopic(params.id, page);
                setPosts(result.posts);
                setTotalPages(result.totalPages);
                setTotalPosts(result.totalCount);
            }

            setConfirmDelete(null);
        } catch (err: any) {
            alert(`Error deleting content: ${err.message}`);
        }
    };

    // Scroll to reply form
    const scrollToReplyForm = () => {
        setShowReplyForm(true);
        setTimeout(() => {
            if (replyFormRef.current) {
                replyFormRef.current.scrollIntoView({behavior: 'smooth', block: 'center'});
                const textarea = replyFormRef.current.querySelector('textarea');
                if (textarea) {
                    textarea.focus();
                }
            }
        }, 100);
    };

    // Check if user can edit/delete content
    const canModify = (createdBy: string) => {
        if (!currentUser) return false;
        return currentUser.id === createdBy || currentUser.role === 'admin';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex justify-center items-center py-20">
                        <div className="relative">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
                            <div
                                className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-r-green-400 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !topic) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
                        <div
                            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500"/>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
                        <p className="text-gray-600 mb-6">{error || 'Topic not found'}</p>
                        <Link
                            href="/forum"
                            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Back to Forum
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Back button */}
                <div className="mb-6">
                    <Link
                        href="/forum"
                        className="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Back to Forum
                    </Link>
                </div>

                {/* Topic Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
                    {/* Topic Header */}
                    <div className="bg-gradient-to-r from-green-600 to-indigo-600 p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-2xl font-bold leading-tight pr-4">{topic.title}</h1>
                            {canModify(topic.created_by) && (
                                <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2">
                                    <Link
                                        href={`/forum/topic/${topic.id}/edit`}
                                        className="text-white/80 hover:text-white transition-colors duration-200"
                                    >
                                        <Edit size={16}/>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete('topic', topic.id)}
                                        className="text-white/80 hover:text-red-300 transition-colors duration-200"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Topic Stats */}
                        <div className="flex items-center space-x-6 text-white/90 text-sm mb-4">
                            <div className="flex items-center">
                                <Clock size={14} className="mr-1.5"/>
                                {formatDate(topic.created_at)}
                            </div>
                            <div className="flex items-center">
                                <Eye size={14} className="mr-1.5"/>
                                {topic.view_count} views
                            </div>
                            <div className="flex items-center">
                                <MessageSquare size={14} className="mr-1.5"/>
                                {totalPosts} replies
                            </div>
                        </div>

                        {/* Author */}
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold text-sm">
                  {topic.author?.full_name?.charAt(0) || '?'}
                </span>
                            </div>
                            <div>
                                <div className="font-medium text-white">
                                    {topic.author?.full_name || 'Unknown'}
                                </div>
                                <div className="text-xs text-white/70 capitalize">
                                    {topic.author?.role || 'User'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Topic Content */}
                    <div className="p-6">
                        <div className="prose prose-gray max-w-none mb-6">
                            {topic.content.split('\n').map((paragraph, index) => (
                                paragraph.trim() &&
                                <p key={index} className="mb-3 text-gray-700 leading-relaxed">{paragraph}</p>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <button
                                onClick={() => handleLike('topic', topic.id)}
                                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                                    topic.user_has_liked
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Heart size={16} className={topic.user_has_liked ? 'fill-current' : ''}/>
                                <span>{topic.like_count || 0}</span>
                            </button>

                            <button
                                onClick={scrollToReplyForm}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200 hover:shadow-lg"
                            >
                                <MessageSquare size={16}/>
                                <span>Reply</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Replies Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {totalPosts === 0 ? 'No replies yet' : `${totalPosts} ${totalPosts === 1 ? 'Reply' : 'Replies'}`}
                        </h2>
                    </div>

                    <div className="p-6">
                        {posts.length === 0 ? (
                            <div className="text-center py-12">
                                <div
                                    className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="h-8 w-8 text-green-400"/>
                                </div>
                                <h3 className="text-lg font-medium text-gray-700 mb-2">Be the first to reply!</h3>
                                <p className="text-gray-500 mb-6">Share your thoughts on this topic.</p>
                                <button
                                    onClick={scrollToReplyForm}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                                >
                                    Write a reply
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {posts.map((post, index) => (
                                    <div key={post.id}
                                         className={`${index > 0 ? 'border-t border-gray-100 pt-6' : ''}`}>
                                        <div className="flex space-x-4">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-10 h-10 bg-gradient-to-br from-green-400 to-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {post.author?.full_name?.charAt(0) || '?'}
                          </span>
                                                </div>
                                            </div>

                                            {/* Post Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-900">
                              {post.author?.full_name || 'Unknown'}
                            </span>
                                                        <span className="text-sm text-gray-500">
                              {formatDate(post.created_at)}
                            </span>
                                                    </div>

                                                    {canModify(post.created_by) && (
                                                        <div className="flex items-center space-x-1">
                                                            <Link
                                                                href={`/forum/post/${post.id}/edit`}
                                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                                                            >
                                                                <Edit size={14}/>
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete('post', post.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                            >
                                                                {confirmDelete === post.id ? (
                                                                    <AlertTriangle size={14} className="text-red-500"/>
                                                                ) : (
                                                                    <Trash2 size={14}/>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="prose prose-sm max-w-none mb-3">
                                                    {post.content.split('\n').map((paragraph, index) => (
                                                        paragraph.trim() && <p key={index}
                                                                               className="mb-2 text-gray-700 leading-relaxed">{paragraph}</p>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => handleLike('post', post.id)}
                                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                        post.user_has_liked
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <Heart size={14}
                                                           className={post.user_has_liked ? 'fill-current' : ''}/>
                                                    <span>{post.like_count || 0}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center mt-8 pt-6 border-t border-gray-100">
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                        className={`p-2 rounded-lg transition-all duration-200 ${
                                            page === 1
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <ChevronLeft size={18}/>
                                    </button>

                                    {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                        let pageNum = page;
                                        if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }

                                        if (pageNum <= 0 || pageNum > totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                    page === pageNum
                                                        ? 'bg-green-600 text-white shadow-md'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
                                        className={`p-2 rounded-lg transition-all duration-200 ${
                                            page === totalPages
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <ChevronRight size={18}/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reply Form */}
                {(showReplyForm || !currentUser) && (
                    <div ref={replyFormRef} className="mt-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                                <h3 className="text-lg font-semibold text-white">Join the conversation</h3>
                            </div>

                            <div className="p-6">
                                {currentUser ? (
                                    <form onSubmit={handleSubmitReply}>
                                        <div className="flex space-x-4">
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {currentUser.full_name?.charAt(0) || '?'}
                          </span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                        <textarea
                            rows={4}
                            placeholder="Share your thoughts..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            required
                        />
                                                <div className="flex items-center justify-between mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowReplyForm(false)}
                                                        className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={submitting || !replyContent.trim()}
                                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200 hover:shadow-lg"
                                                    >
                                                        {submitting ? (
                                                            <>
                                                                <div
                                                                    className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                                <span>Posting...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send size={16}/>
                                                                <span>Post Reply</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="text-center py-8">
                                        <div
                                            className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserIcon className="h-8 w-8 text-green-400"/>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to join the
                                            discussion?</h3>
                                        <p className="text-gray-600 mb-6">
                                            Sign in to share your thoughts and connect with the community.
                                        </p>
                                        <Link
                                            href="/accounts/login"
                                            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                                        >
                                            Sign In to Reply
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}