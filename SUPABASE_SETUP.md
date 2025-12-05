# 🗄️ Supabase Setup Guide

Complete guide to setting up Supabase for MentorLaunch, including database schema, authentication, and security policies.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Supabase Project](#create-supabase-project)
3. [Database Schema Setup](#database-schema-setup)
4. [Authentication Setup](#authentication-setup)
5. [Row Level Seity (RLS)](#row-level-security-rls)
6. [Environment Variables](#environment-variables)
7. [Testing the Setup](#testing-the-setup)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Basic understanding of PostgreSQL
- Access to your project's `.env.local` file

---

## Create Supabase Project

### Step 1: Create New Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `mentorlaunch` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

4. Click **"Create new project"**
5. Wait 2-3 minutes for project initialization

### Step 2: Get Project Credentials

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

---

## Database Schema Setup

### Overview

MentorLaunch uses the following tables:
- `profiles` - User profiles (mentors and mentees)
- `conversations` - Chat conversations between users
- `messages` - Individual messages in conversations

### Step 1: Run SQL Scripts

Navigate to **SQL Editor** in your Supabase dashboard and run the following scripts in order:

#### 1. Chat Tables (`database/01-chat-tables.sql`)

```sql
-- =====================================================
-- MENTORLAUNCH CHAT SYSTEM - TABLE DEFINITIONS
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Stores user information for both mentors and mentees
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('mentor', 'mentee')) NOT NULL,

  -- Mentor-specific fields
  profession TEXT,
  experience TEXT,
  expertise TEXT[],
  is_active BOOLEAN DEFAULT false,

  -- Mentee-specific fields
  grade TEXT,
  interests TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =====================================================
-- CONVERSATIONS TABLE
-- Stores chat conversations between two users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user1_name TEXT NOT NULL,
  user2_name TEXT NOT NULL,

  -- Status tracking
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique conversation between two users
  CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

-- =====================================================
-- MESSAGES TABLE
-- Stores individual messages in conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,

  -- Message metadata
  is_read BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure content is not empty
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- =====================================================
-- TRIGGERS
-- Automatically update timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for conversations table
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PROFILE CREATION TRIGGER
-- Automatically create profile when user signs up
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mentee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### 2. Security Policies (`database/02-chat-security.sql`)

```sql
-- =====================================================
-- MENTORLAUNCH CHAT SYSTEM - ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Allow users to read all profiles (for browsing mentors)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- CONVERSATIONS TABLE POLICIES
-- =====================================================

-- Allow users to view conversations they're part of
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

-- Allow users to create conversations
CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

-- Allow users to update conversations they're part of
CREATE POLICY "Users can update their conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  )
  WITH CHECK (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

-- Allow users to delete conversations they're part of
CREATE POLICY "Users can delete their conversations"
  ON public.conversations
  FOR DELETE
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Allow users to view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- Allow users to insert messages in their conversations
CREATE POLICY "Users can insert messages in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- Allow users to update their own messages
CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (auth.uid() = sender_id);
```

#### 3. Helper Functions (`database/03-chat-functions.sql`)

```sql
-- =====================================================
-- MENTORLAUNCH CHAT SYSTEM - HELPER FUNCTIONS
-- =====================================================

-- =====================================================
-- GET OR CREATE CONVERSATION
-- Returns conversation ID between two users
-- Creates new conversation if it doesn't exist
-- =====================================================

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_user1_name TEXT,
  p_user2_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation (in either direction)
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE (user1_id = p_user1_id AND user2_id = p_user2_id)
     OR (user1_id = p_user2_id AND user2_id = p_user1_id)
  LIMIT 1;

  -- If conversation doesn't exist, create it
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (user1_id, user2_id, user1_name, user2_name, status)
    VALUES (p_user1_id, p_user2_id, p_user1_name, p_user2_name, 'pending')
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- =====================================================
-- GET UNREAD MESSAGE COUNT
-- Returns number of unread messages for a user
-- =====================================================

CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.messages m
  INNER JOIN public.conversations c ON m.conversation_id = c.id
  WHERE (c.user1_id = p_user_id OR c.user2_id = p_user_id)
    AND m.sender_id != p_user_id
    AND m.is_read = false;

  RETURN COALESCE(v_count, 0);
END;
$$;

-- =====================================================
-- MARK MESSAGES AS READ
-- Marks all messages in a conversation as read
-- =====================================================

CREATE OR REPLACE FUNCTION mark_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;
END;
$$;

-- =====================================================
-- GET ACTIVE MENTORS
-- Returns list of currently active mentors
-- =====================================================

CREATE OR REPLACE FUNCTION get_active_mentors()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  profession TEXT,
  experience TEXT,
  expertise TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.profession,
    p.experience,
    p.expertise,
    p.created_at
  FROM public.profiles p
  WHERE p.role = 'mentor'
    AND p.is_active = true
  ORDER BY p.created_at DESC;
END;
$$;

-- =====================================================
-- GET CONVERSATION WITH MESSAGES
-- Returns conversation details with recent messages
-- =====================================================

CREATE OR REPLACE FUNCTION get_conversation_with_messages(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  conversation_id UUID,
  user1_id UUID,
  user2_id UUID,
  user1_name TEXT,
  user2_name TEXT,
  status TEXT,
  message_id UUID,
  sender_id UUID,
  content TEXT,
  is_read BOOLEAN,
  message_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user1_id,
    c.user2_id,
    c.user1_name,
    c.user2_name,
    c.status,
    m.id,
    m.sender_id,
    m.content,
    m.is_read,
    m.created_at
  FROM public.conversations c
  LEFT JOIN public.messages m ON c.id = m.conversation_id
  WHERE c.id = p_conversation_id
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$;
```

### Step 3: Verify Tables

1. Go to **Table Editor** in Supabase dashboard
2. You should see:
   - ✅ `profiles`
   - ✅ `conversations`
   - ✅ `messages`

---

## Authentication Setup

### Step 1: Configure Auth Settings

1. Go to **Authentication** → **Settings**
2. Configure the following:

#### Email Auth
- **Enable Email provider**: ✅ Enabled
- **Confirm email**: ✅ Enabled (recommended for production)
- **Secure email change**: ✅ Enabled

#### Site URL
- **Site URL**: `http://localhost:3000` (development)
- For production: `https://yourdomain.com`

#### Redirect URLs
Add the following URLs:
- `http://localhost:3000/**`
- `https://yourdomain.com/**` (for production)

### Step 2: Email Templates (Optional)

Customize email templates in **Authentication** → **Email Templates**:
- Confirmation email
- Magic link email
- Password reset email

---

## Row Level Security (RLS)

### Understanding RLS

Row Level Security ensures users can only access data they're authorized to see:

- **Profiles**: Users can view all profiles but only edit their own
- **Conversations**: Users can only see conversations they're part of
- **Messages**: Users can only see messages in their conversations

### Testing RLS

Run these queries in SQL Editor to test:

```sql
-- Test as authenticated user
SELECT * FROM profiles WHERE id = auth.uid();

-- Test conversation access
SELECT * FROM conversations
WHERE user1_id = auth.uid() OR user2_id = auth.uid();

-- Test message access
SELECT m.* FROM messages m
INNER JOIN conversations c ON m.conversation_id = c.id
WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid();
```

---

## Environment Variables

### Step 1: Create `.env.local`

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Groq API (for AI features)
GROQ_API_KEY=your-groq-api-key-here
```

### Step 2: Get Your Keys

1. Go to **Settings** → **API** in Supabase dashboard
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Important**: Never commit `.env.local` to version control!

---

## Testing the Setup

### Test 1: User Signup

```typescript
// Test in your app or browser console
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpassword123',
  options: {
    data: {
      full_name: 'Test User',
      role: 'mentee'
    }
  }
});

console.log('Signup result:', data, error);
```

### Test 2: Profile Creation

```sql
-- Check if profile was created automatically
SELECT * FROM profiles WHERE email = 'test@example.com';
```

### Test 3: Create Conversation

```typescript
const { data: convId, error } = await supabase.rpc('get_or_create_conversation', {
  p_user1_id: 'user1-uuid',
  p_user2_id: 'user2-uuid',
  p_user1_name: 'User 1',
  p_user2_name: 'User 2'
});

console.log('Conversation ID:', convId);
```

### Test 4: Send Message

```typescript
const { data, error } = await supabase
  .from('messages')
  .insert({
    conversation_id: 'conversation-uuid',
    sender_id: 'sender-uuid',
    content: 'Hello, this is a test message!'
  });

console.log('Message sent:', data, error);
```

---

## Troubleshooting

### Issue: "relation does not exist"

**Solution**: Make sure you ran all SQL scripts in order (01, 02, 03)

### Issue: "permission denied for table"

**Solution**: Check RLS policies are enabled and correctly configured

### Issue: "new row violates row-level security policy"

**Solution**: Verify the user is authenticated and has proper permissions

### Issue: Profile not created on signup

**Solution**:
1. Check if trigger `on_auth_user_created` exists
2. Verify `handle_new_user()` function is created
3. Check auth.users table for the user

### Issue: Can't see other users' profiles

**Solution**: Verify the "Profiles are viewable by everyone" policy exists

### Common SQL Commands

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check triggers
SELECT * FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- View all profiles
SELECT * FROM profiles;

-- View all conversations
SELECT * FROM conversations;

-- View all messages
SELECT * FROM messages ORDER BY created_at DESC;
```

---

## Security Best Practices

1. **Never expose service_role key** - Only use anon key in frontend
2. **Always use RLS** - Never disable RLS in production
3. **Validate input** - Use CHECK constraints and triggers
4. **Use HTTPS** - Always use HTTPS in production
5. **Regular backups** - Enable automatic backups in Supabase
6. **Monitor usage** - Check Supabase dashboard for unusual activity
7. **Rate limiting** - Implement rate limiting for API endpoints

---

## Next Steps

- ✅ Database setup complete
- ✅ Authentication configured
- ✅ RLS policies enabled
- 📖 Continue to [Chat System Guide](./CHAT_SETUP.md)
- 🚀 Start building your app!

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

---

**Need Help?** Check the [Supabase Discord](https://discord.supabase.com) or [GitHub Discussions](https://github.com/supabase/supabase/discussions)

