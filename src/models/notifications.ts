import { User } from "./users";

export enum NotificationType {
  AUTH = 'auth',
  SYSTEM = 'system',
  USER = 'user'
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface NotificationCreate {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}