-- ============================================
-- CHAT SYSTEM SECURITY POLICIES
-- ============================================
-- Description: Row Level Security (RLS) policies
-- Version: 1.0
-- Last Updated: 2024
-- ============================================

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CONVERSATIONS POLICIES
-- ============================================

-- Policy: Users can view their own conversations
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  auth.uid() = user1_id OR
  auth.uid() = user2_id
);

-- Policy: Users can create conversations
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (
  auth.uid() = user1_id OR
  auth.uid() = user2_id
);

-- Policy: Users can update their conversations
CREATE POLICY "Users can update their conversations"
ON conversations FOR UPDATE
USING (
  auth.uid() = user1_id OR
  auth.uid() = user2_id
);

-- ============================================
-- 3. MESSAGES POLICIES
-- ============================================

-- Policy: Users can view messages in their conversations
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
);

-- Policy: Users can send messages in their conversations
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
);

-- Policy: Users can update their own messages (for read status)
CREATE POLICY "Users can update message read status"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
);
