-- Forum Tables Migration Script

-- Create forum_topics table
CREATE TABLE IF NOT EXISTS forum_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0
);

-- Create forum_posts table for replies
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create forum_likes table for tracking likes on topics and posts
CREATE TABLE IF NOT EXISTS forum_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT topic_or_post_required CHECK (
        (topic_id IS NOT NULL AND post_id IS NULL) OR
        (topic_id IS NULL AND post_id IS NOT NULL)
    ),
    CONSTRAINT unique_topic_like UNIQUE (user_id, topic_id),
    CONSTRAINT unique_post_like UNIQUE (user_id, post_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_by ON forum_topics(created_by);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_at ON forum_topics(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id ON forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_by ON forum_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_forum_likes_user_id ON forum_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_topic_id ON forum_likes(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_post_id ON forum_likes(post_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_forum_topics_updated_at ON forum_topics;
CREATE TRIGGER update_forum_topics_updated_at
BEFORE UPDATE ON forum_topics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for forum_topics
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;

-- Everyone can view topics
CREATE POLICY forum_topics_select_policy ON forum_topics
    FOR SELECT USING (true);

-- Only authenticated users can insert topics
CREATE POLICY forum_topics_insert_policy ON forum_topics
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can only update their own topics, admins can update any
CREATE POLICY forum_topics_update_policy ON forum_topics
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Users can only delete their own topics, admins can delete any
CREATE POLICY forum_topics_delete_policy ON forum_topics
    FOR DELETE USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Create RLS policies for forum_posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view posts
CREATE POLICY forum_posts_select_policy ON forum_posts
    FOR SELECT USING (true);

-- Only authenticated users can insert posts
CREATE POLICY forum_posts_insert_policy ON forum_posts
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can only update their own posts, admins can update any
CREATE POLICY forum_posts_update_policy ON forum_posts
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Users can only delete their own posts, admins can delete any
CREATE POLICY forum_posts_delete_policy ON forum_posts
    FOR DELETE USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Create RLS policies for forum_likes
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;

-- Everyone can view likes
CREATE POLICY forum_likes_select_policy ON forum_likes
    FOR SELECT USING (true);

-- Only authenticated users can insert likes
CREATE POLICY forum_likes_insert_policy ON forum_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
CREATE POLICY forum_likes_delete_policy ON forum_likes
    FOR DELETE USING (auth.uid() = user_id);