import {User} from "@/models/users";

// Forum Topic model
export interface ForumTopic {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    is_pinned: boolean;
    is_closed: boolean;
    view_count: number;
    
    // Joined fields (not in the database)
    author?: User;
    reply_count?: number;
    like_count?: number;
    user_has_liked?: boolean;
}

// Forum Post (reply) model
export interface ForumPost {
    id: string;
    topic_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    
    // Joined fields (not in the database)
    author?: User;
    like_count?: number;
    user_has_liked?: boolean;
}

// Forum Like model
export interface ForumLike {
    id: string;
    user_id: string;
    topic_id?: string;
    post_id?: string;
    created_at: string;
}

// Create Topic request
export interface CreateTopicRequest {
    title: string;
    content: string;
}

// Create Post request
export interface CreatePostRequest {
    topic_id: string;
    content: string;
}

// Toggle Like request
export interface ToggleLikeRequest {
    topic_id?: string;
    post_id?: string;
}