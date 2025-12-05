# Complete Database Setup

## 📋 Overview

This folder contains all SQL files needed to set up the complete application database in Supabase, including chat, learning plans, and mentor verification.

## 🗂️ File Structure

```
database/
├── 01-chat-tables.sql           # Core chat tables (conversations, messages)
├── 02-chat-security.sql         # Chat RLS policies
├── 03-chat-functions.sql        # Chat helper functions
├── 04-quiz-tables.sql           # Quiz results table
├── 05-mentor-verification.sql   # Mentor verification system
├── 06-learning-plans.sql        # Study schedules, milestones, profiles
└── README.md                    # This file
```

## 🚀 Installation Steps

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run SQL Files in Order

**Important:** Run the files in numerical order!

#### 1️⃣ Create Tables
```sql
-- Copy and paste contents of: 01-chat-tables.sql
-- Then click "Run" or press Ctrl+Enter
```

#### 2️⃣ Set Up Security
```sql
-- Copy and paste contents of: 02-chat-security.sql
-- Then click "Run" or press Ctrl+Enter
```

#### 3️⃣ Add Helper Functions
```sql
-- Copy and paste contents of: 03-chat-functions.sql
-- Then click "Run" or press Ctrl+Enter
```

#### 4️⃣ Create Quiz Tables
```sql
-- Copy and paste contents of: 04-quiz-tables.sql
-- Then click "Run" or press Ctrl+Enter
```

#### 5️⃣ Set Up Mentor Verification
```sql
-- Copy and paste contents of: 05-mentor-verification.sql
-- Then click "Run" or press Ctrl+Enter
```

#### 6️⃣ Create Learning Plans Tables
```sql
-- Copy and paste contents of: 06-learning-plans.sql
-- Then click "Run" or press Ctrl+Enter
```

### Step 3: Verify Installation

Run this query to verify everything is set up:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'conversations',
  'messages',
  'user_quiz_results',
  'study_schedules',
  'milestones',
  'profiles'
);

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_or_create_conversation', 'get_unread_count', 'mark_conversation_read');
```

You should see:
- 6 tables: `conversations`, `messages`, `user_quiz_results`, `study_schedules`, `milestones`, `profiles`
- 5+ functions: `get_or_create_conversation`, `get_unread_count`, `mark_conversation_read`, `get_user_schedule`, `get_user_milestones`

## 📊 Database Schema

### Conversations Table
```
id              UUID (Primary Key)
user1_id        UUID (User ID)
user2_id        UUID (User ID)
user1_name      TEXT (User Name)
user2_name      TEXT (User Name)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Messages Table
```
id              UUID (Primary Key)
conversation_id UUID (Foreign Key → conversations)
sender_id       UUID (User ID)
content         TEXT (Message content)
is_read         BOOLEAN (Read status)
created_at      TIMESTAMP
```

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only see their own conversations
- Users can only send messages in their conversations
- Automatic timestamp updates on new messages

## 🛠️ Helper Functions

### 1. get_or_create_conversation
Creates a new conversation or returns existing one between two users.

```sql
SELECT get_or_create_conversation(
  'user1-uuid',
  'user2-uuid',
  'User 1 Name',
  'User 2 Name'
);
```

### 2. get_unread_count
Returns total unread messages for a user.

```sql
SELECT get_unread_count('user-uuid');
```

### 3. mark_conversation_read
Marks all messages in a conversation as read.

```sql
SELECT mark_conversation_read('conversation-uuid');
```

## 🧪 Testing

After setup, test with these queries:

```sql
-- 1. Create a test conversation
SELECT get_or_create_conversation(
  auth.uid(),
  'another-user-uuid',
  'Your Name',
  'Other User Name'
);

-- 2. Send a test message
INSERT INTO messages (conversation_id, sender_id, content)
VALUES ('conversation-uuid', auth.uid(), 'Hello!');

-- 3. Check unread count
SELECT get_unread_count(auth.uid());

-- 4. Mark as read
SELECT mark_conversation_read('conversation-uuid');
```

## 🔄 Updates & Migrations

If you need to update the schema:

1. Create a new file: `04-migration-description.sql`
2. Add your changes
3. Update this README with the new file
4. Run the migration in Supabase

## ❌ Uninstall

To remove the chat system:

```sql
-- Drop tables (this will also drop messages due to CASCADE)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_or_create_conversation;
DROP FUNCTION IF EXISTS get_unread_count;
DROP FUNCTION IF EXISTS mark_conversation_read;
DROP FUNCTION IF EXISTS update_conversation_timestamp;
```

## 📞 Troubleshooting

### Error: "relation does not exist"
- Make sure you ran `01-chat-tables.sql` first

### Error: "function does not exist"
- Make sure you ran `03-chat-functions.sql`

### RLS blocking queries
- Check that you're authenticated
- Verify RLS policies in `02-chat-security.sql`

### Messages not updating timestamp
- Check that the trigger was created in `01-chat-tables.sql`

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated:** 2024
**Version:** 1.0
