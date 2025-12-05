# 💬 Chat System Guide

Complete guide to understanding and implementing the MentorLaunch chat system for mentor-mentee communication.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Chat Flow](#chat-flow)
5. [Implementation Guide](#implementation-guide)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Real-time Updates](#real-time-updates)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The MentorLaunch chat system enables real-time communication between mentors and mentees with the following features:

### Key Features
- ✅ **Request-based system**: Mentees send requests, mentors accept/decline
- ✅ **Real-time messaging**: Instant message delivery
- ✅ **Unread indicators**: Badge showing unread message count
- ✅ **Active mentor status**: Mentors can toggle availability
- ✅ **Conversation history**: Persistent message storage
- ✅ **Secure**: Row-level security ensures privacy

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Mentee     │  │   Mentor     │  │    Chat      │  │
│  │  Dashboard   │  │  Dashboard   │  │  Component   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   API Routes (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│  /api/chat/conversations  │  /api/chat/messages         │
│  /api/chat/send           │  /api/mentors/active        │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                  Supabase (Backend)                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐          │
│  │ Profiles │  │Conversations │  │ Messages │          │
│  └──────────┘  └──────────────┘  └──────────┘          │
│                                                          │
│  RLS Policies  │  Functions  │  Triggers                │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables Overview

#### 1. Profiles Table
Stores user information for both mentors and mentees.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,              -- References auth.users(id)
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('mentor', 'mentee')),

  -- Mentor fields
  profession TEXT,
  experience TEXT,
  expertise TEXT[],
  is_active BOOLEAN DEFAULT false,  -- Online/offline status

  -- Mentee fields
  grade TEXT,
  interests TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields:**
- `is_active`: Controls mentor visibility in mentee dashboard
- `role`: Determines user type (mentor/mentee)
- `expertise`: Array of mentor's areas of expertise

#### 2. Conversations Table
Stores chat conversations between two users.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL,           -- First user (usually mentee)
  user2_id UUID NOT NULL,           -- Second user (usually mentor)
  user1_name TEXT NOT NULL,
  user2_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',    -- pending, accepted, declined

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id)
);
```

**Status Values:**
- `pending`: Request sent, awaiting mentor response
- `accepted`: Mentor accepted, chat is active
- `declined`: Mentor declined the request

#### 3. Messages Table
Stores individual messages in conversations.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields:**
- `is_read`: Tracks if recipient has seen the message
- `sender_id`: Who sent the message
- `conversation_id`: Links to parent conversation

---

## Chat Flow

### 1. Mentee Initiates Chat

```
┌─────────┐                                    ┌─────────┐
│ Mentee  │                                    │ Mentor  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │ 1. Browse active mentors                    │
     │ ────────────────────────────────────>       │
     │                                              │
     │ 2. Click "Start Chat"                       │
     │ ────────────────────────────────────>       │
     │                                              │
     │ 3. Create conversation (status: pending)    │
     │ ────────────────────────────────────>       │
     │                                              │
     │ 4. Send initial message                     │
     │ ────────────────────────────────────>       │
     │                                              │
     │                                              │ 5. Receive notification
     │                                              │    (unread badge)
     │                                              │ <────────────────────
```

### 2. Mentor Responds

```
┌─────────┐                                    ┌─────────┐
│ Mentee  │                                    │ Mentor  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │                                              │ 1. View chat requests
     │                                              │ <────────────────────
     │                                              │
     │                                              │ 2. Accept request
     │                                              │    (status: accepted)
     │                                              │ ────────────────────>
     │                                              │
     │ 3. Conversation now active                  │
     │ <────────────────────────────────────────── │
     │                                              │
     │ 4. Exchange messages                        │
     │ <──────────────────────────────────────────>│
```

### 3. Ongoing Communication

```
┌─────────┐                                    ┌─────────┐
│ Mentee  │                                    │ Mentor  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │ Send message                                 │
     │ ────────────────────────────────────>       │
     │                                              │
     │                                              │ Receive (is_read: false)
     │                                              │ <────────────────────
     │                                              │
     │                                              │ Open chat
     │                                              │ Mark as read
     │                                              │ ────────────────────>
     │                                              │
     │                                              │ Send reply
     │ Receive reply                                │ <────────────────────
     │ <────────────────────────────────────────── │
```

---

## Implementation Guide

### Step 1: Setup Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 2: Create Conversation

```typescript
// When mentee clicks "Start Chat" with a mentor
async function startChatWithMentor(mentorId: string, mentorName: string) {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const userName = session.user.user_metadata?.full_name || 'User';

    // Create or get conversation
    const { data: convId, error: convError } = await supabase.rpc(
      'get_or_create_conversation',
      {
        p_user1_id: userId,
        p_user2_id: mentorId,
        p_user1_name: userName,
        p_user2_name: mentorName
      }
    );

    if (convError) {
      console.error('Error creating conversation:', convError);
      return;
    }

    // Send initial message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        sender_id: userId,
        content: `Hi ${mentorName}! I'd like to connect with you for career guidance.`
      });

    if (msgError) {
      console.error('Error sending message:', msgError);
      return;
    }

    alert(`Chat started with ${mentorName}!`);
  } catch (error) {
    console.error('Error starting chat:', error);
  }
}
```

### Step 3: Fetch Conversations

```typescript
// Fetch all conversations for current user
async function fetchConversations() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
```

### Step 4: Fetch Messages

```typescript
// Fetch messages for a specific conversation
async function fetchMessages(conversationId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
```

### Step 5: Send Message

```typescript
// Send a new message
async function sendMessage(conversationId: string, content: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: content.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Step 6: Mark Messages as Read

```typescript
// Mark all messages in a conversation as read
async function markMessagesAsRead(conversationId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.rpc('mark_messages_read', {
      p_conversation_id: conversationId,
      p_user_id: session.user.id
    });

    if (error) {
      console.error('Error marking messages as read:', error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Step 7: Get Unread Count

```typescript
// Get total unread message count for current user
async function getUnreadCount() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 0;

    const { data, error } = await supabase.rpc('get_unread_count', {
      p_user_id: session.user.id
    });

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
}
```

---

## API Endpoints

### 1. Get Active Mentors

**Endpoint**: `/api/mentors/active`

```typescript
// app/api/mentors/active/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'mentor')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      mentors: data || [],
      active: data?.length || 0
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Response**:
```json
{
  "mentors": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "profession": "Software Engineer",
      "experience": "5 years",
      "expertise": ["JavaScript", "React"],
      "is_active": true
    }
  ],
  "active": 1
}
```

### 2. Get Conversations

**Endpoint**: `/api/chat/conversations`

```typescript
// app/api/chat/conversations/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ conversations: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 3. Get Messages

**Endpoint**: `/api/chat/messages?conversationId=xxx`

```typescript
// app/api/chat/messages/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 4. Send Message

**Endpoint**: `/api/chat/send` (POST)

```typescript
// app/api/chat/send/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content } = await req.json();

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'conversationId and content required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: content.trim()
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json({ message: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Frontend Components

### Chat Component Structure

```typescript
// components/Chat.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
      if (selectedConv) {
        fetchMessages(selectedConv.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConv]);

  const fetchConversations = async () => {
    // Implementation from Step 3
  };

  const fetchMessages = async (convId) => {
    // Implementation from Step 4
  };

  const sendMessage = async () => {
    // Implementation from Step 5
  };

  const fetchUnreadCount = async () => {
    // Implementation from Step 7
  };

  return (
    <div className="chat-container">
      {/* Chat UI */}
    </div>
  );
}
```

### Active Mentors Sidebar

```typescript
// In user dashboard
const [mentorsData, setMentorsData] = useState(null);

useEffect(() => {
  const fetchMentors = async () => {
    const response = await fetch('/api/mentors/active');
    const data = await response.json();
    setMentorsData(data);
  };

  fetchMentors();
  const interval = setInterval(fetchMentors, 30000); // Refresh every 30s
  return () => clearInterval(interval);
}, []);

// Display active mentors
{mentorsData?.mentors.map((mentor) => (
  <div key={mentor.id}>
    <h3>{mentor.full_name}</h3>
    <p>{mentor.profession}</p>
    <button onClick={() => startChatWithMentor(mentor.id, mentor.full_name)}>
      Start Chat
    </button>
  </div>
))}
```

---

## Real-time Updates

### Polling Strategy

MentorLaunch uses polling for real-time updates:

```typescript
// Poll every 5 seconds for new messages
useEffect(() => {
  const interval = setInterval(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
    fetchUnreadCount();
  }, 5000);

  return () => clearInterval(interval);
}, [selectedConversation]);
```

### Alternative: Supabase Realtime (Optional)

For true real-time updates, you can use Supabase Realtime:

```typescript
// Subscribe to new messages
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [conversationId]);
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled to ensure data privacy:

#### Profiles
- ✅ Anyone can view profiles (for browsing mentors)
- ✅ Users can only edit their own profile

#### Conversations
- ✅ Users can only see conversations they're part of
- ✅ Users can only create conversations involving themselves

#### Messages
- ✅ Users can only see messages in their conversations
- ✅ Users can only send messages as themselves
- ✅ Users can only edit/delete their own messages

### Best Practices

1. **Never expose service_role key** in frontend
2. **Always validate user authentication** before operations
3. **Use RLS policies** instead of application-level checks
4. **Sanitize user input** to prevent XSS attacks
5. **Rate limit** message sending to prevent spam
6. **Implement content moderation** for inappropriate messages

---

## Troubleshooting

### Issue: Messages not appearing

**Possible causes:**
1. RLS policy blocking access
2. Conversation not properly created
3. Polling interval too long

**Solution:**
```sql
-- Check if conversation exists
SELECT * FROM conversations WHERE id = 'your-conversation-id';

-- Check if messages exist
SELECT * FROM messages WHERE conversation_id = 'your-conversation-id';

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

### Issue: Unread count not updating

**Solution:**
```typescript
// Ensure mark_messages_read is called when opening chat
useEffect(() => {
  if (selectedConversation) {
    markMessagesAsRead(selectedConversation.id);
  }
}, [selectedConversation]);
```

### Issue: Duplicate conversations

**Solution:**
The `unique_conversation` constraint should prevent this, but if it occurs:

```sql
-- Find duplicates
SELECT user1_id, user2_id, COUNT(*)
FROM conversations
GROUP BY user1_id, user2_id
HAVING COUNT(*) > 1;

-- Delete duplicates (keep oldest)
DELETE FROM conversations
WHERE id NOT IN (
  SELECT MIN(id)
  FROM conversations
  GROUP BY user1_id, user2_id
);
```

### Issue: Can't send messages

**Checklist:**
- [ ] User is authenticated
- [ ] Conversation exists
- [ ] User is part of the conversation
- [ ] Content is not empty
- [ ] RLS policies are correct

---

## Performance Optimization

### 1. Pagination

For conversations with many messages:

```typescript
const MESSAGES_PER_PAGE = 50;

async function fetchMessages(conversationId, page = 0) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE - 1);

  return data || [];
}
```

### 2. Caching

Cache conversations and messages:

```typescript
const conversationCache = new Map();

async function getCachedConversation(id) {
  if (conversationCache.has(id)) {
    return conversationCache.get(id);
  }

  const data = await fetchConversation(id);
  conversationCache.set(id, data);
  return data;
}
```

### 3. Debouncing

Debounce typing indicators:

```typescript
import { debounce } from 'lodash';

const sendTypingIndicator = debounce(async (conversationId) => {
  // Send typing indicator
}, 1000);
```

---

## Next Steps

- ✅ Chat system setup complete
- 📖 Review [Supabase Setup Guide](./SUPABASE_SETUP.md)
- 🎨 Customize chat UI components
- 🚀 Deploy to production
- 📱 Add mobile responsiveness
- 🔔 Implement push notifications

---

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hooks Guide](https://react.dev/reference/react)

---

**Need Help?** Check the main [README.md](./README.md) or open an issue on GitHub.
