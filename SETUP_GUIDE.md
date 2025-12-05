# 🚀 Complete Setup Guide

This guide will help you set up the entire application with all features working.

## 📋 Prerequisites

- Supabase account ([sign up here](https://supabase.com))
- Node.js 18+ installed
- Git installed

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details and create

### Step 2: Run SQL Migrations

Open the SQL Editor in Supabase and run these files **in order**:

#### 1. Chat System (Required)
```sql
-- Run: database/01-chat-tables.sql
-- Creates: conversations, messages tables
```

#### 2. Chat Security (Required)
```sql
-- Run: database/02-chat-s.sql
-- Sets up: Row Level Security policies for chat
```

#### 3. Chat Functions (Required)
```sql
-- Run: database/03-chat-functions.sql
-- Creates: Helper functions for chat operations
```

#### 4. Quiz System (Optional)
```sql
-- Run: database/04-quiz-tables.sql
-- Creates: user_quiz_results table
```

#### 5. Mentor Verification (Required for Mentors)
```sql
-- Run: database/05-mentor-verification.sql
-- Creates: Mentor verification system
```

#### 6. Learning Plans (Required for Schedules & Milestones)
```sql
-- Run: database/06-learning-plans.sql
-- Creates: study_schedules, milestones, profiles tables
-- Sets up: RLS policies for mentors to view mentee progress
```

### Step 3: Verify Database Setup

Run this query to verify all tables exist:

```sql
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
```

You should see all 6 tables listed.

## 🔑 Environment Variables

### Step 1: Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - Project URL
   - `anon` public key

### Step 2: Create `.env.local`

Create a file named `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the values with your actual Supabase credentials.

## 📦 Install Dependencies

```bash
npm install
```

## 🏃 Run the Application

### Development Mode
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## 👥 User Roles & Features

### For Mentees (Students)

1. **Sign Up**: Go to `/auth` and create an account
2. **Dashboard**: View personalized dashboard at `/user`
3. **Learning Plans**: Create schedules and milestones at `/user/plans`
   - Drag-and-drop weekly schedule
   - Add custom time slots (with AM/PM picker)
   - Track milestones with progress bars
4. **Chat**: Message mentors using the chat widget

### For Mentors

1. **Sign Up**: Go to `/auth/mentor` and create a mentor account
2. **Verification**: Wait for admin approval (or manually update in database)
3. **Dashboard**: View active mentees at `/mentor/dashboard`
4. **View Progress**: Click "View Progress" on any mentee to see:
   - Their weekly schedule (read-only)
   - Their milestone progress
5. **My Mentees**: Browse all mentees at `/mentor/mentees`
6. **Chat**: Message mentees using the chat widget

## 🔧 Manual Mentor Approval (Development)

To manually approve a mentor during development:

```sql
-- Find the mentor's user ID
SELECT id, email FROM auth.users WHERE email = 'mentor@example.com';

-- Update their verification status
UPDATE profiles
SET verification_status = 'approved'
WHERE id = 'user-id-here';
```

## 🎨 Features Overview

### ✅ Implemented Features

- **Authentication**: Sign up, sign in, sign out
- **User Roles**: Mentee and Mentor roles
- **Real-time Chat**:
  - One-on-one conversations
  - Unread message counts
  - Message history
  - Auto-refresh
- **Learning Plans**:
  - Weekly schedule with drag-and-drop
  - Custom time slots with AM/PM picker
  - Editable time slots
  - Activity management
  - Milestone tracking with progress bars
- **Mentor Dashboard**:
  - View active mentees
  - See conversation history
  - Track mentee progress
- **Mentee Progress View**:
  - Mentors can view mentee schedules
  - Mentors can see milestone progress
  - Read-only view for mentors

### 🎯 Key Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page |
| Welcome | `/welcome` | Post-signup welcome |
| User Dashboard | `/user` | Mentee dashboard |
| Learning Plans | `/user/plans` | Schedule & milestones |
| Mentor Dashboard | `/mentor/dashboard` | Mentor overview |
| My Mentees | `/mentor/mentees` | List of mentees |
| Mentee Progress | `/mentor/mentees/[id]` | View mentee details |

## 🐛 Troubleshooting

### Chat not working
- Verify `01-chat-tables.sql`, `02-chat-security.sql`, and `03-chat-functions.sql` are run
- Check RLS policies are enabled
- Ensure users are authenticated

### Schedules not saving
- Verify `06-learning-plans.sql` is run
- Check `study_schedules` table exists
- Verify RLS policies allow user access

### Mentor can't view mentee progress
- Ensure mentor and mentee have a conversation first
- Check RLS policies in `06-learning-plans.sql`
- Verify `conversations` table has the relationship

### "Relation does not exist" errors
- Run all SQL files in order
- Check table names match exactly
- Verify you're in the correct Supabase project

## 📱 Testing the Application

### Test as Mentee
1. Sign up at `/auth`
2. Go to `/user/plans`
3. Create a schedule by dragging activities
4. Add milestones and track progress

### Test as Mentor
1. Sign up at `/auth/mentor`
2. Manually approve in database (see above)
3. Have a mentee message you (or create conversation manually)
4. Go to `/mentor/dashboard`
5. Click "View Progress" on a mentee

### Test Chat
1. Create two accounts (one mentee, one mentor)
2. Start a conversation from either side
3. Send messages back and forth
4. Check unread counts update

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Other Platforms

The app works on any platform that supports Next.js 14+:
- Netlify
- Railway
- AWS Amplify
- Self-hosted

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all SQL files are run in order
3. Check browser console for errors
4. Verify environment variables are set correctly

---

**Happy Coding! 🎉**

