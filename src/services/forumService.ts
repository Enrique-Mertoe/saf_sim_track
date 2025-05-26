import {createSupabaseClient} from "@/lib/supabase/client";
import {CreatePostRequest, CreateTopicRequest, ForumPost, ForumTopic, ToggleLikeRequest} from "@/models/forum";
import {authService} from "@/services/authService";

export const forumService = {
    // Get all topics with pagination
    async getTopics(page = 1, pageSize = 10, searchTerm = '') {
        const supabase = createSupabaseClient();
        const startIndex = (page - 1) * pageSize;

        let query = supabase
            .from('forum_topics')
            .select(`
                *,
                users!created_by(id, full_name, email),
                reply_count:forum_posts(count),
                like_count:forum_likes(count)
            `, { count: 'exact' })
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query
            .range(startIndex, startIndex + pageSize - 1);

        if (error) throw error;

        // Get current user to check if they liked each topic
        const { user } = await authService.getCurrentUser();

        // Transform the data to match our model
        const topics: ForumTopic[] = data?.map(item => ({
            ...item,
            author: item.users,
            reply_count: item.reply_count[0]?.count || 0,
            like_count: item.like_count[0]?.count || 0,
            user_has_liked: false // Will be updated below if user is logged in
        })) || [];

        // If user is logged in, check which topics they've liked
        if (user) {
            const topicIds = topics.map(t => t.id);
            const { data: userLikes } = await supabase
                .from('forum_likes')
                .select('topic_id')
                .eq('user_id', user.id)
                .in('topic_id', topicIds);

            if (userLikes) {
                const likedTopicIds = new Set(userLikes.map(like => like.topic_id));
                topics.forEach(topic => {
                    topic.user_has_liked = likedTopicIds.has(topic.id);
                });
            }
        }

        return {
            topics,
            totalCount: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize)
        };
    },

    // Get a single topic with its posts
    async getTopic(id: string, page = 1, pageSize = 20) {
        const supabase = createSupabaseClient();

        // Get the topic
        const { data: topicData, error: topicError } = await supabase
            .from('forum_topics')
            .select(`
                *,
                users!created_by(id, full_name, email),
                like_count:forum_likes(count)
            `)
            .eq('id', id)
            .single();
        console.log("data",topicData)

        if (topicError) throw topicError;

        // Increment view count
        await supabase
            .from('forum_topics')
            .update({ view_count: (topicData.view_count || 0) + 1 })
            .eq('id', id);

        // Get the posts with pagination
        const startIndex = (page - 1) * pageSize;
        const { data: postsData, error: postsError, count } = await supabase
            .from('forum_posts')
            .select(`
                *,
                users!created_by(id, full_name, email),
                like_count:forum_likes(count)
            `, { count: 'exact' })
            .eq('topic_id', id)
            .order('created_at', { ascending: true })
            .range(startIndex, startIndex + pageSize - 1);

        if (postsError) throw postsError;

        // Get current user to check if they liked the topic and posts
        const { user } = await authService.getCurrentUser();

        // Transform the topic data
        const topic: ForumTopic = {
            ...topicData,
            author: topicData.users,
            like_count: topicData.like_count[0]?.count || 0,
            user_has_liked: false // Will be updated below if user is logged in
        };

        // Transform the posts data
        const posts: ForumPost[] = postsData?.map(item => ({
            ...item,
            author: item.users,
            like_count: item.like_count[0]?.count || 0,
            user_has_liked: false // Will be updated below if user is logged in
        })) || [];

        // If user is logged in, check what they've liked
        if (user) {
            // Check if user liked the topic
            const { data: topicLike } = await supabase
                .from('forum_likes')
                .select('id')
                .eq('user_id', user.id)
                .eq('topic_id', id)
                .maybeSingle();

            topic.user_has_liked = !!topicLike;

            // Check which posts user liked
            if (posts.length > 0) {
                const postIds = posts.map(p => p.id);
                const { data: postLikes } = await supabase
                    .from('forum_likes')
                    .select('post_id')
                    .eq('user_id', user.id)
                    .in('post_id', postIds);

                if (postLikes) {
                    const likedPostIds = new Set(postLikes.map(like => like.post_id));
                    posts.forEach(post => {
                        post.user_has_liked = likedPostIds.has(post.id);
                    });
                }
            }
        }

        return {
            topic,
            posts,
            totalCount: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize)
        };
    },

    // Create a new topic
    async createTopic(data: CreateTopicRequest) {
        const supabase = createSupabaseClient();
        const { user } = await authService.getCurrentUser();

        if (!user) {
            throw new Error('You must be logged in to create a topic');
        }

        const { data: topicData, error } = await supabase
            .from('forum_topics')
            .insert({
                title: data.title,
                content: data.content,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return topicData;
    },

    // Create a new post (reply)
    async createPost(data: CreatePostRequest) {
        const supabase = createSupabaseClient();
        const { user } = await authService.getCurrentUser();

        if (!user) {
            throw new Error('You must be logged in to reply to a topic');
        }

        const { data: postData, error } = await supabase
            .from('forum_posts')
            .insert({
                topic_id: data.topic_id,
                content: data.content,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return postData;
    },

    // Toggle like on a topic or post
    async toggleLike(data: ToggleLikeRequest) {
        const supabase = createSupabaseClient();
        const { user } = await authService.getCurrentUser();

        if (!user) {
            throw new Error('You must be logged in to like content');
        }

        // Check if the user has already liked this content
        let query = supabase
            .from('forum_likes')
            .select('id');

        if (data.topic_id) {
            query = query
                .eq('user_id', user.id)
                .eq('topic_id', data.topic_id);
        } else if (data.post_id) {
            query = query
                .eq('user_id', user.id)
                .eq('post_id', data.post_id);
        } else {
            throw new Error('Either topic_id or post_id must be provided');
        }

        const { data: existingLike } = await query.maybeSingle();

        // If like exists, remove it; otherwise, add it
        if (existingLike) {
            const { error } = await supabase
                .from('forum_likes')
                .delete()
                .eq('id', existingLike.id);

            if (error) throw error;
            return { liked: false };
        } else {
            const { error } = await supabase
                .from('forum_likes')
                .insert({
                    user_id: user.id,
                    topic_id: data.topic_id,
                    post_id: data.post_id
                });

            if (error) throw error;
            return { liked: true };
        }
    },

    // Update a topic (title and content)
    async updateTopic(id: string, title: string, content: string) {
        const supabase = createSupabaseClient();
        const { user } = await authService.getCurrentUser();

        if (!user) {
            throw new Error('You must be logged in to update a topic');
        }

        // Check if user is the author or an admin
        const { data: topic } = await supabase
            .from('forum_topics')
            .select('created_by')
            .eq('id', id)
            .single();

        if (!topic) {
            throw new Error('Topic not found');
        }

        const isAdmin = user.role === 'admin';
        const isAuthor = topic.created_by === user.id;

        if (!isAdmin && !isAuthor) {
            throw new Error('You do not have permission to update this topic');
        }

        const { data, error } = await supabase
            .from('forum_topics')
            .update({ title, content })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update a post (content only)
    async updatePost(id: string, content: string) {
        const supabase = createSupabaseClient();
        const { user } = await authService.getCurrentUser();

        if (!user) {
            throw new Error('You must be logged in to update a post');
        }

        // Check if user is the author or an admin
        const { data: post } = await supabase
            .from('forum_posts')
            .select('created_by')
            .eq('id', id)
            .single();

        if (!post) {
            throw new Error('Post not found');
        }

        const isAdmin = user.role === 'admin';
        const isAuthor = post.created_by === user.id;

        if (!isAdmin && !isAuthor) {
            throw new Error('You do not have permission to update this post');
        }

        const { data, error } = await supabase
            .from('forum_posts')
            .update({ content })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete a topic
    async deleteTopic(id: string) {
        const supabase = createSupabaseClient();
        const { user } = await authService.getCurrentUser();

        if (!user) {
            throw new Error('You must be logged in to delete a topic');
        }

        // Check if user is the author or an admin
        const { data: topic } = await supabase
            .from('forum_topics')
            .select('created_by')
            .eq('id', id)
            .single();

        if (!topic) {
            throw new Error('Topic not found');
        }

        const isAdmin = user.role === 'admin';
        const isAuthor = topic.created_by === user.id;

        if (!isAdmin && !isAuthor) {
            throw new Error('You do not have permission to delete this topic');
        }

        const { error } = await supabase
            .from('forum_topics')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    },

    // Delete a post
    async deletePost(id: string) {
        const supabase = createSupabaseClient();
        const { user } = await authService.getCurrentUser();

        if (!user) {
            throw new Error('You must be logged in to delete a post');
        }

        // Check if user is the author or an admin
        const { data: post } = await supabase
            .from('forum_posts')
            .select('created_by')
            .eq('id', id)
            .single();

        if (!post) {
            throw new Error('Post not found');
        }

        const isAdmin = user.role === 'admin';
        const isAuthor = post.created_by === user.id;

        if (!isAdmin && !isAuthor) {
            throw new Error('You do not have permission to delete this post');
        }

        const { error } = await supabase
            .from('forum_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    }
};