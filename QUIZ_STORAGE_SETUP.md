# Quiz Results Database Storage Setup

## 🎯 Overview

Quiz results are now saved to the Supabase database per user, allowing:
- Persistent storage across devices
- Data recovery if localStorage is cleared
- User-specific quiz history
- Secure data storage with Row Level Security

## 📁 Files Created/Modified

### New Files
1. **database/04-quiz-tables.sql** - Database schema for quiz results
2. **app/api/quiz/save/route.ts** - API endpoint to save quiz results
3. **app/api/quiz/get/route.ts** - API endpoint to retrieve quiz results

### Modified Files
1. **app/welcome/page.tsx** - Now saves quiz to database after completion
2. **app/user/page.tsx** - Loads quiz data from database on page load
3. **database/README.md** - Updated with quiz table setup instructions

## 🚀 Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `database/04-quiz-tables.sql`
4. Click **Run** to create the table

### Step 2: Verify Table Creation

Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'user_quiz_results';
```

You should see `user_quiz_results` in the results.

### Step 3: Test the Feature

1. Sign in as a user
2. Complete the quiz
3. Check the database:

```sql
SELECT * FROM user_quiz_resulRE user_id = auth.uid();
```

## 📊 Database Schema

### user_quiz_results Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User ID (unique) |
| grade | TEXT | Academic level |
| career_interest | TEXT | Primary career interest |
| academic_interests | JSONB | Array of favorite subjects |
| academic_strengths | JSONB | Array of best subjects |
| preferred_environment | TEXT | Work environment preference |
| task_preference | TEXT | Task type preference |
| skills | JSONB | Array of skills |
| tech_confidence | TEXT | Technology confidence level |
| work_life | TEXT | Work-life balance preference |
| career_motivation | TEXT | Career motivation |
| study_goal | TEXT | Education goal |
| created_at | TIMESTAMP | When quiz was first taken |
| updated_at | TIMESTAMP | When quiz was last updated |

## 🔒 Security Features

- **Row Level Security (RLS)** enabled
- Users can only view/edit their own quiz results
- One quiz result per user (enforced by unique constraint)
- Automatic timestamp updates

## 🔄 How It Works

### When User Completes Quiz:
1. Quiz data is saved to localStorage (for offline access)
2. Quiz data is sent to `/api/quiz/save`
3. API validates user authentication
4. Data is upserted to `user_quiz_results` table
5. User is redirected to dashboard

### When User Loads Dashboard:
1. System checks for authenticated session
2. Fetches quiz data from `/api/quiz/get`
3. If found, updates localStorage with database data
4. Falls back to localStorage if database fetch fails
5. Displays quiz results and career suggestions

### When User Retakes Quiz:
1. All quiz data is cleared from localStorage
2. User is redirected to welcome page
3. After completion, new data overwrites old data in database

## 🧪 Testing

### Test Quiz Save
```javascript
// In browser console after completing quiz
const session = await supabase.auth.getSession();
const response = await fetch('/api/quiz/save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.data.session.access_token}`,
  },
  body: JSON.stringify({
    grade: 'Grade 10',
    careerInterest: 'Engineering',
    academicInterests: ['Mathematics', 'Science'],
    // ... other fields
  }),
});
console.log(await response.json());
```

### Test Quiz Retrieval
```javascript
// In browser console
const session = await supabase.auth.getSession();
const response = await fetch('/api/quiz/get', {
  headers: {
    'Authorization': `Bearer ${session.data.session.access_token}`,
  },
});
console.log(await response.json());
```

## 📝 API Endpoints

### POST /api/quiz/save
Saves or updates quiz results for authenticated user.

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "grade": "Grade 10",
  "careerInterest": "Engineering",
  "academicInterests": ["Mathematics", "Science"],
  "academicStrengths": ["Mathematics"],
  "preferredEnvironment": "Building or designing things",
  "taskPreference": "Technical tasks",
  "skills": ["Problem solving", "Analytical thinking"],
  "techConfidence": "Good",
  "workLife": "Balanced lifestyle",
  "careerMotivation": "Achievement",
  "studyGoal": "Bachelor's Degree"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* saved quiz data */ }
}
```

### GET /api/quiz/get
Retrieves quiz results for authenticated user.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "data": {
    "grade": "Grade 10",
    "careerInterest": "Engineering",
    // ... other fields
  }
}
```

Or if no quiz found:
```json
{
  "data": null
}
```

## 🔧 Troubleshooting

### Quiz not saving to database
- Check browser console for errors
- Verify user is authenticated
- Check Supabase logs in dashboard

### Quiz not loading from database
- Verify table exists in Supabase
- Check RLS policies are enabled
- Ensure API routes are accessible

### "Unauthorized" errors
- User session may have expired
- Check authentication token is valid
- Try signing out and back in

## 🎉 Benefits

✅ **Persistent Storage** - Quiz data survives browser cache clears
✅ **Cross-Device Sync** - Access quiz results from any device
✅ **Secure** - Row Level Security protects user data
✅ **Reliable** - Database backup ensures data safety
✅ **Scalable** - Ready for future features like quiz history

---

**Last Updated:** 2024
**Version:** 1.0

