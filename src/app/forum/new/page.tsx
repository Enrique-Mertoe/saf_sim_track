'use client';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {forumService} from '@/services/forumService';
import {authService} from '@/services/authService';
import {User} from '@/models/users';
import {ArrowLeft, Send} from 'lucide-react';

export default function NewTopicPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  
  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user } = await authService.getCurrentUser();
        setCurrentUser(user);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching user:', err);
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to create a topic');
      return;
    }
    
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }
    
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const newTopic = await forumService.createTopic({
        title: title.trim(),
        content: content.trim()
      });
      
      // Redirect to the new topic
      router.push(`/forum/topic/${newTopic.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create topic');
      setSubmitting(false);
    }
  };
  
  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // If not logged in, show login prompt
  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/forum" className="text-blue-600 hover:underline flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forum
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            You need to be logged in to create a new topic.
          </p>
          <Link 
            href="/accounts/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/forum" className="text-blue-600 hover:underline flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forum
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-50 p-6 border-b border-blue-100">
          <h1 className="text-2xl font-bold text-gray-800">Create New Topic</h1>
          <p className="text-gray-600 mt-2">
            Share your thoughts, questions, or experiences with the community.
          </p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Topic Title
              </label>
              <input
                type="text"
                id="title"
                placeholder="Enter a descriptive title for your topic"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="content"
                rows={10}
                placeholder="Write your topic content here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              ></textarea>
              <p className="text-sm text-gray-500 mt-2">
                Be clear and specific. Include all relevant details to help others understand your topic.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Link
                href="/forum"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Create Topic
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Community Guidelines</h3>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>Be respectful and considerate of others</li>
              <li>Stay on topic and provide relevant information</li>
              <li>Do not post offensive, inappropriate, or spam content</li>
              <li>Respect privacy and confidentiality</li>
              <li>Use clear and concise language</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}