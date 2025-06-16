"use client"

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Filter, 
  Loader2, 
  Lock, 
  RefreshCw, 
  Search, 
  Shield, 
  User, 
  X, 
  AlertTriangle, 
  Info, 
  MessageSquare,
  Calendar,
  Clock,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useApp from "@/ui/provider/AppProvider";
import { notificationService } from '@/services';
import { toast } from 'react-hot-toast';
import Dashboard from "@/ui/components/dash/Dashboard";
import { Notification, NotificationType } from '@/models/notifications';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const slideIn = {
  hidden: { x: 20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const notificationItem = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } }
};

export default function NotificationsPage() {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [subscription, setSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Fetch all notifications for the user (no limit)
      const { data, error } = await notificationService.getUserNotifications(user.id, 100);

      if (error) {
        throw error;
      }

      setNotifications(data || []);
      applyFilters(data || [], filter, typeFilter, searchQuery);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
      toast.error('Failed to load notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to notifications
  const applyFilters = (
    notifs: Notification[], 
    readFilter: 'all' | 'unread' | 'read', 
    type: NotificationType | 'all', 
    search: string
  ) => {
    let filtered = [...notifs];

    // Apply read/unread filter
    if (readFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (readFilter === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Apply type filter
    if (type !== 'all') {
      filtered = filtered.filter(n => n.type === type);
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) || 
        n.message.toLowerCase().includes(searchLower)
      );
    }

    setFilteredNotifications(filtered);
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();

      // Subscribe to real-time notifications
      const sub = notificationService.subscribeToUserNotifications(
        user.id,
        (newNotification) => {
          setNotifications(prev => {
            const updated = [newNotification, ...prev];
            applyFilters(updated, filter, typeFilter, searchQuery);
            return updated;
          });

          // Show toast for new notification
          toast.success(`New notification: ${newNotification.title}`);
        }
      );

      setSubscription(sub);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user?.id]);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters(notifications, filter, typeFilter, searchQuery);
  }, [filter, typeFilter, searchQuery]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );

      // Update filtered notifications
      setFilteredNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id || notifications.filter(n => !n.read).length === 0) return;

    try {
      await notificationService.markAllAsRead(user.id);

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setFilteredNotifications(prev => prev.map(n => ({ ...n, read: true })));

      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Format notification time
  const formatNotificationTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.AUTH:
        return <Lock className="text-blue-500" />;
      case NotificationType.SYSTEM:
        return <Shield className="text-purple-500" />;
      case NotificationType.USER:
        return <User className="text-green-500" />;
      default:
        return <Bell className="text-gray-500" />;
    }
  };

  // Get detailed notification icon based on content
  const getDetailedIcon = (notification: Notification) => {
    // Check type first
    if (notification.type === NotificationType.AUTH) {
      // Check metadata for specific auth actions
      if (notification.metadata?.action === 'login') {
        return <Lock className="text-blue-500" />;
      } else if (notification.metadata?.action === 'logout') {
        return <Lock className="text-red-500" />;
      } else if (notification.metadata?.action === 'password_change' || notification.metadata?.action === 'password_reset') {
        return <Key className="text-yellow-500" />;
      }
      return <Lock className="text-blue-500" />;
    }

    if (notification.type === NotificationType.SYSTEM) {
      // Check for specific keywords in title or message
      const content = (notification.title + notification.message).toLowerCase();
      if (content.includes('error') || content.includes('fail') || content.includes('issue')) {
        return <AlertTriangle className="text-red-500" />;
      } else if (content.includes('update') || content.includes('upgrade')) {
        return <RefreshCw className="text-purple-500" />;
      } else if (content.includes('schedule') || content.includes('appointment')) {
        return <Calendar className="text-indigo-500" />;
      }
      return <Shield className="text-purple-500" />;
    }

    if (notification.type === NotificationType.USER) {
      // Check for specific keywords in title or message
      const content = (notification.title + notification.message).toLowerCase();
      if (content.includes('message') || content.includes('reply')) {
        return <MessageSquare className="text-green-500" />;
      } else if (content.includes('reminder')) {
        return <Clock className="text-amber-500" />;
      } else if (content.includes('info') || content.includes('information')) {
        return <Info className="text-blue-500" />;
      }
      return <User className="text-green-500" />;
    }

    // Default fallback
    return <Bell className="text-gray-500" />;
  };

  // Get notification background color based on type and read status
  const getNotificationBgColor = (notification: Notification) => {
    if (!notification.read) {
      return 'bg-blue-50 dark:bg-blue-900/20';
    }

    return 'bg-white dark:bg-gray-800';
  };

  // Get notification border color based on type
  const getNotificationBorderColor = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.AUTH:
        return 'border-l-4 border-l-blue-500';
      case NotificationType.SYSTEM:
        return 'border-l-4 border-l-purple-500';
      case NotificationType.USER:
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-gray-300';
    }
  };

  return (
    <Dashboard>
      <div className="mx-auto min-h-screen py-8 px-4">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <Bell className="mr-3 text-green-600 dark:text-green-400" size={28} />
            Notifications
          </h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage all your notifications</p>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg  mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={18} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              {/* Filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Filter size={18} />
                  <span>Filter</span>
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-10 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-medium text-gray-800 dark:text-white">Status</h3>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <input
                              type="radio"
                              checked={filter === 'all'}
                              onChange={() => setFilter('all')}
                              className="form-radio text-green-600"
                            />
                            <span>All</span>
                          </label>
                          <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <input
                              type="radio"
                              checked={filter === 'unread'}
                              onChange={() => setFilter('unread')}
                              className="form-radio text-green-600"
                            />
                            <span>Unread</span>
                          </label>
                          <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <input
                              type="radio"
                              checked={filter === 'read'}
                              onChange={() => setFilter('read')}
                              className="form-radio text-green-600"
                            />
                            <span>Read</span>
                          </label>
                        </div>
                      </div>

                      <div className="p-3">
                        <h3 className="font-medium text-gray-800 dark:text-white">Type</h3>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <input
                              type="radio"
                              checked={typeFilter === 'all'}
                              onChange={() => setTypeFilter('all')}
                              className="form-radio text-green-600"
                            />
                            <span>All</span>
                          </label>
                          <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <input
                              type="radio"
                              checked={typeFilter === NotificationType.AUTH}
                              onChange={() => setTypeFilter(NotificationType.AUTH)}
                              className="form-radio text-green-600"
                            />
                            <span className="flex items-center">
                              <Lock size={14} className="mr-1 text-blue-500" />
                              Authentication
                            </span>
                          </label>
                          <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <input
                              type="radio"
                              checked={typeFilter === NotificationType.SYSTEM}
                              onChange={() => setTypeFilter(NotificationType.SYSTEM)}
                              className="form-radio text-green-600"
                            />
                            <span className="flex items-center">
                              <Shield size={14} className="mr-1 text-purple-500" />
                              System
                            </span>
                          </label>
                          <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <input
                              type="radio"
                              checked={typeFilter === NotificationType.USER}
                              onChange={() => setTypeFilter(NotificationType.USER)}
                              className="form-radio text-green-600"
                            />
                            <span className="flex items-center">
                              <User size={14} className="mr-1 text-green-500" />
                              User
                            </span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
              </button>

              {/* Mark all as read button */}
              <button
                onClick={markAllAsRead}
                disabled={loading || notifications.filter(n => !n.read).length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600"
              >
                <Check size={18} />
              </button>
            </div>
          </div>

          {/* Notification stats */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">All:</span>
              <span className="text-sm font-bold text-gray-800 dark:text-white">{notifications.length}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Unread:</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{notifications.filter(n => !n.read).length}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Auth:</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{notifications.filter(n => n.type === NotificationType.AUTH).length}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">System:</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{notifications.filter(n => n.type === NotificationType.SYSTEM).length}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">User:</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{notifications.filter(n => n.type === NotificationType.USER).length}</span>
            </div>
          </div>

          {/* Notifications list */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700 min-h-[calc(100vh-300px)] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-green-600" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <AlertTriangle size={32} className="mx-auto mb-4 text-red-500" />
                <p className="text-red-500">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Try Again
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell size={32} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || filter !== 'all' || typeFilter !== 'all'
                    ? 'No notifications match your filters'
                    : 'No notifications yet'}
                </p>
                {(searchQuery || filter !== 'all' || typeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilter('all');
                      setTypeFilter('all');
                    }}
                    className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="divide-y divide-gray-200 dark:divide-gray-700"
              >
                <AnimatePresence>
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      variants={notificationItem}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className={`p-4 ${getNotificationBgColor(notification)} ${getNotificationBorderColor(notification)} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                          {getDetailedIcon(notification)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className={`text-sm font-medium ${notification.read ? 'text-gray-800 dark:text-gray-200' : 'text-black dark:text-white font-semibold'}`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center ml-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {formatNotificationTime(notification.created_at)}
                              </span>
                              {!notification.read && (
                                <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {notification.message}
                          </p>

                          {/* Metadata display if available */}
                          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              {Object.entries(notification.metadata).map(([key, value]) => (
                                <div key={key} className="flex items-start">
                                  <span className="font-medium mr-1">{key}:</span>
                                  <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-2 flex items-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              notification.type === NotificationType.AUTH 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                : notification.type === NotificationType.SYSTEM 
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {notification.type}
                            </span>

                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </Dashboard>
  );
}
