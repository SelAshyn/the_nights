# ⚡ Quick Start Checklist

Get your app running in 5 minutes!

## ✅ Step-by-Step Setup

### 1. Database Setup (5 minutes)

Go to [Supabase SQL Editor](https://app.supabase.com) and run these files **in order**:

- [ ] `database/01-chat-tables.sql` - Chat tables
- [ ] `database/02-chat-security.sql` - Chat security
- [ ] `database/03-chat-functions.sql` - Chat functions
- [ ] `database/04-quiz-tables.sql` - Quiz system
- [ ] `database/05-mentor-verification.sql` - Mentor verification
- [ ] `database/06-learning-plans.sql` - Schedules & milestones

### 2. Environment Variables (1 minute)

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Get these from: Supabase Dashboard → Settings → API

### 3. Install & Run (2 minutes)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## 🎯 Test the Features

### Test Mentee Features
1. Go to `/auth` and sign up
2. Visit `/user/plans`
3. Drag activities to create schedule
4. Add milestones

### Test Mentor Features
1. Go to `/auth/mentor` and sign up
2. Manually approve mentor (see below)
3. Visit `/mentor/dashboard`
4. View mentee progress

### Manually Approve Mentor (Development)

```sql
-- In Supabase SQL Editor
UPDATE profiles
SET verification_status = 'approved'
WHERE email = 'your-mentor-email@example.com';
```

## 🚀 You're Ready!

All features should now work:
- ✅ Authentication
- ✅ Chat system
- ✅ Weekly schedules with drag-and-drop
- ✅ Milestone tracking
- ✅ Mentor can view mentee progress

## 📚 Next Steps

- Read `SETUP_GUIDE.md` for detailed documentation
- Check `database/README.md` for database schema
- Explore the codebase!

---

**Need help?** Check the troubleshooting section in `SETUP_GUIDE.md`
