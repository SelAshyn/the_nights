-- ============================================
-- CHAT SYSTEM HELPER FUNCTIONS
-- ============================================
-- Description: Utility functions for chat operations
-- Version: 1.0
-- Last Updated: 2024
-- ============================================

-- ============================================
-- 1. GET OR CREATE CONVERSATION
-- ============================================
-- Returns existing conversation or creates a new one
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_user1_name TEXT DEFAULT NULL,
  p_user2_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_smaller_id UUID;
  v_larger_id UUID;
BEGIN
  -- Ensure consistent ordering (smaller UUID first)
  IF p_user1_id < p_user2_id THEN
    v_smaller_id := p_user1_id;
    v_larger_id := p_user2_id;
  ELSE
    v_smaller_id := p_user2_id;
    v_larger_id := p_user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (user1_id = v_smaller_id AND user2_id = v_larger_id)
     OR (user1_id = v_larger_id AND user2_id = v_smaller_id);

  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id, user1_name, user2_name)
    VALUES (v_smaller_id, v_larger_id, p_user1_name, p_user2_name)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. GET UNREAD MESSAGE COUNT
-- ============================================
-- Returns count of unread messages for a user
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM messages m
  INNER JOIN conversations c ON m.conversation_id = c.id
  WHERE (c.user1_id = p_user_id OR c.user2_id = p_user_id)
    AND m.sender_id != p_user_id
    AND m.is_read = FALSE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. MARK CONVERSATION AS READ
-- ============================================
-- Marks all messages in a conversation as read for the current user
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
