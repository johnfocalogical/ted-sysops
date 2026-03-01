-- ============================================================================
-- Migration 032: TED Comms - Internal Messaging Tables
-- Description: Creates the messaging infrastructure for deal-centric
--              team communication. Includes conversations, participants,
--              messages, deal links, and file attachments.
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Conversation type
DO $$ BEGIN
    CREATE TYPE conversation_type AS ENUM ('dm', 'group', 'channel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Message sender type
DO $$ BEGIN
    CREATE TYPE message_sender_type AS ENUM ('user', 'system', 'automator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Conversations - Core messaging entity
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    type conversation_type NOT NULL,
    name TEXT,                          -- Required for channels, optional for groups, null for DMs
    description TEXT,                   -- Channels only
    is_default BOOLEAN NOT NULL DEFAULT FALSE,  -- Default "General" channel
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ        -- For sorting by recent activity
);

-- ----------------------------------------------------------------------------
-- 2.2 Conversation Participants - Junction table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_message_id UUID,         -- For unread tracking (FK added after messages table)
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin' or 'member' for channel distinction
    UNIQUE(conversation_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 2.3 Messages - Message content
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Null for system messages
    sender_type message_sender_type NOT NULL DEFAULT 'user',
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',    -- Rich references, deal snapshots, financial figures
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Soft delete for tombstones
    sender_automator_id UUID REFERENCES automators(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from conversation_participants.last_read_message_id -> messages.id
ALTER TABLE conversation_participants
    ADD CONSTRAINT fk_last_read_message
    FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 2.4 Conversation Deal Links - Many-to-many junction
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_deal_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    linked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, deal_id)
);

-- ----------------------------------------------------------------------------
-- 2.5 Message Attachments - File metadata
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_team_id
    ON conversations(team_id);
CREATE INDEX IF NOT EXISTS idx_conversations_team_type
    ON conversations(team_id, type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
    ON conversations(last_message_at DESC);

-- Conversation Participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
    ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv_user
    ON conversation_participants(conversation_id, user_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
    ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id
    ON messages(sender_id) WHERE sender_id IS NOT NULL;

-- Conversation Deal Links
CREATE INDEX IF NOT EXISTS idx_conversation_deal_links_deal_id
    ON conversation_deal_links(deal_id);
CREATE INDEX IF NOT EXISTS idx_conversation_deal_links_conv_id
    ON conversation_deal_links(conversation_id);

-- Message Attachments
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id
    ON message_attachments(message_id);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_deal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Helper: check conversation membership without triggering RLS (breaks recursion)
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = p_conversation_id
        AND user_id = p_user_id
    );
$$;

-- ----------------------------------------------------------------------------
-- 5.1 Conversations - Visible to participants only
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations
    FOR SELECT USING (
        is_conversation_participant(id, auth.uid())
        OR created_by = auth.uid()
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert" ON conversations
    FOR INSERT WITH CHECK (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update" ON conversations
    FOR UPDATE USING (
        -- Creator or team admin can update conversation metadata
        created_by = auth.uid()
        OR is_team_admin(team_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "conversations_delete" ON conversations;
CREATE POLICY "conversations_delete" ON conversations
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 5.2 Conversation Participants - Visible to co-participants
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "conversation_participants_select" ON conversation_participants;
CREATE POLICY "conversation_participants_select" ON conversation_participants
    FOR SELECT USING (
        is_conversation_participant(conversation_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "conversation_participants_insert" ON conversation_participants;
CREATE POLICY "conversation_participants_insert" ON conversation_participants
    FOR INSERT WITH CHECK (
        -- User adding themselves, or team admin managing channel membership
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND is_team_admin(c.team_id, auth.uid())
        )
        -- Or conversation creator adding initial participants
        OR EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND c.created_by = auth.uid()
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "conversation_participants_update" ON conversation_participants;
CREATE POLICY "conversation_participants_update" ON conversation_participants
    FOR UPDATE USING (
        -- Users can update their own participation (mute, last_read)
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND is_team_admin(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "conversation_participants_delete" ON conversation_participants;
CREATE POLICY "conversation_participants_delete" ON conversation_participants
    FOR DELETE USING (
        -- Users can leave conversations, admins can remove anyone
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND is_team_admin(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 5.3 Messages - Visible to conversation participants
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
    FOR SELECT USING (
        is_conversation_participant(conversation_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
    FOR INSERT WITH CHECK (
        is_conversation_participant(conversation_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages
    FOR UPDATE USING (
        -- Users can edit their own messages
        sender_id = auth.uid()
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "messages_delete" ON messages;
CREATE POLICY "messages_delete" ON messages
    FOR DELETE USING (
        -- Users can delete their own messages, team admins can delete any
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND is_team_admin(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 5.4 Conversation Deal Links - Follow conversation visibility
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "conversation_deal_links_select" ON conversation_deal_links;
CREATE POLICY "conversation_deal_links_select" ON conversation_deal_links
    FOR SELECT USING (
        is_conversation_participant(conversation_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "conversation_deal_links_insert" ON conversation_deal_links;
CREATE POLICY "conversation_deal_links_insert" ON conversation_deal_links
    FOR INSERT WITH CHECK (
        is_conversation_participant(conversation_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "conversation_deal_links_delete" ON conversation_deal_links;
CREATE POLICY "conversation_deal_links_delete" ON conversation_deal_links
    FOR DELETE USING (
        -- Linker can unlink, or team admin
        linked_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND is_team_admin(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 5.5 Message Attachments - Follow message visibility
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "message_attachments_select" ON message_attachments;
CREATE POLICY "message_attachments_select" ON message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_attachments.message_id
            AND is_conversation_participant(m.conversation_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "message_attachments_insert" ON message_attachments;
CREATE POLICY "message_attachments_insert" ON message_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_attachments.message_id
            AND is_conversation_participant(m.conversation_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "message_attachments_delete" ON message_attachments;
CREATE POLICY "message_attachments_delete" ON message_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_attachments.message_id
            AND m.sender_id = auth.uid()
        )
        OR is_superadmin(auth.uid())
    );

-- ============================================================================
-- 6. REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 get_unread_counts - Returns unread count per conversation for a user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_unread_counts(
    p_user_id UUID,
    p_team_id UUID
)
RETURNS TABLE (
    conversation_id UUID,
    unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.conversation_id,
        COUNT(m.id) AS unread_count
    FROM conversation_participants cp
    JOIN conversations c ON c.id = cp.conversation_id
    LEFT JOIN messages m ON m.conversation_id = cp.conversation_id
        AND m.created_at > COALESCE(
            (SELECT m2.created_at FROM messages m2 WHERE m2.id = cp.last_read_message_id),
            cp.joined_at
        )
        AND m.sender_id != p_user_id  -- Don't count own messages as unread
        AND m.is_deleted = FALSE
    WHERE cp.user_id = p_user_id
      AND c.team_id = p_team_id
    GROUP BY cp.conversation_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 7.2 get_user_conversations - Returns conversations with preview & metadata
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_conversations(
    p_user_id UUID,
    p_team_id UUID,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    conversation_id UUID,
    conversation_type conversation_type,
    conversation_name TEXT,
    is_default BOOLEAN,
    last_message_at TIMESTAMPTZ,
    last_message_content TEXT,
    last_message_sender_id UUID,
    last_message_sender_name TEXT,
    unread_count BIGINT,
    participant_count BIGINT,
    participant_names TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS conversation_id,
        c.type AS conversation_type,
        c.name AS conversation_name,
        c.is_default,
        c.last_message_at,
        last_msg.content AS last_message_content,
        last_msg.sender_id AS last_message_sender_id,
        last_msg_user.full_name AS last_message_sender_name,
        COALESCE(unread.unread_count, 0) AS unread_count,
        (SELECT COUNT(*) FROM conversation_participants cp2
         WHERE cp2.conversation_id = c.id) AS participant_count,
        (SELECT ARRAY_AGG(u.full_name ORDER BY u.full_name)
         FROM conversation_participants cp3
         JOIN users u ON u.id = cp3.user_id
         WHERE cp3.conversation_id = c.id
         AND cp3.user_id != p_user_id
         LIMIT 5) AS participant_names
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = p_user_id
    -- Last message via lateral join
    LEFT JOIN LATERAL (
        SELECT m.content, m.sender_id, m.created_at
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.is_deleted = FALSE
        ORDER BY m.created_at DESC
        LIMIT 1
    ) last_msg ON TRUE
    LEFT JOIN users last_msg_user ON last_msg_user.id = last_msg.sender_id
    -- Unread count
    LEFT JOIN LATERAL (
        SELECT COUNT(m.id) AS unread_count
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.created_at > COALESCE(
              (SELECT m2.created_at FROM messages m2 WHERE m2.id = cp.last_read_message_id),
              cp.joined_at
          )
          AND m.sender_id != p_user_id
          AND m.is_deleted = FALSE
    ) unread ON TRUE
    WHERE c.team_id = p_team_id
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ============================================================================
-- COMPLETE
-- ============================================================================
