import {createSupabaseClient} from "@/lib/supabase/client";
import {Notification, NotificationCreate, NotificationType} from "@/models";

export const notificationService = {
  /**
   * Create a new notification
   */
  async createNotification(notification: NotificationCreate): Promise<{ data: Notification | null; error: any }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        metadata: notification.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    console.log("nerror",error)
    
    return { data, error };
  },

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit: number = 10): Promise<{ data: Notification[] | null; error: any }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<{ data: any; error: any }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    return { data, error };
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ data: any; error: any }> {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);
    
    return { data, error };
  },

  /**
   * Create an auth notification
   */
  async createAuthNotification(userId: string, action: string, details?: string): Promise<{ data: Notification | null; error: any }> {
    let title = '';
    let message = '';
    
    switch (action) {
      case 'login':
        title = 'New Login';
        message = details || 'You have successfully logged in';
        break;
      case 'logout':
        title = 'Logged Out';
        message = details || 'You have been logged out';
        break;
      case 'password_change':
        title = 'Password Changed';
        message = details || 'Your password has been successfully changed';
        break;
      case 'password_reset':
        title = 'Password Reset Requested';
        message = details || 'A password reset has been requested for your account';
        break;
      default:
        title = 'Account Activity';
        message = details || `Authentication action: ${action}`;
    }
    
    return this.createNotification({
      user_id: userId,
      title,
      message,
      type: NotificationType.AUTH,
      metadata: { action }
    });
  },

  /**
   * Subscribe to notifications for a user
   */
  subscribeToUserNotifications(userId: string, callback: (notification: Notification) => void): { unsubscribe: () => void } {
    const supabase = createSupabaseClient();
    
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
    
    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      }
    };
  }
};