# Authentication System - Complete Rewrite

This is a clean, simplified authentication system for The Nights application. It has been completely rewritten to fix sign-in issues and redirect loops.

## 🎯 What Changed

The entire auth system was rebuilt from scratch with a focus on **simplicity and reliability**:

- **Mentee Sign-In** (`/auth/mentee`) - Clean form with error handling
- **Mentor Sign-In** (`/auth/mentor`) - Professional signup with LinkedIn validation
- **User Dashboard** (`/user`) - Simple dashboard after sign-in
- **Auth Utilities** (`lib/auth-utils.ts`) - Core authentication functions
- **Middleware** (`middleware.ts`) - Route protection

## 🔄 How It Works

### Sign-Up Flow

```
User fills form → Supabase creates account → User signs in manually
```

### Sign-In Flow

```
1. User enters email + password
2. Supabase authenticates user
3. Session is created
4. Wait 1 second for session to persist
5. Redirect to appropriate dashboard
   - mentee role → /user
   - mentor role → /mentor/dashboard
```

### Protected Route Flow

```
1. User accesses protected page (e.g., /user)
2. Check session with Supabase
3. If no session → redirect to /auth/mentee
4. If wrong role → sign out and redirect
5. If valid → show dashboard
```

## 📁 File Structure

```
app/
├── page.tsx                 # Homepage (auth check + redirect)
├── auth/
│   ├── mentee/page.tsx      # Student sign-in/sign-up
│   ├── mentor/page.tsx      # Mentor sign-in/sign-up
│   └── callback/route.ts    # OAuth callback
└── user/
    └── page.tsx             # Mentee dashboard (protected)

lib/
├── auth-utils.ts            # Auth helper functions
└── supabase.ts              # Supabase client

middleware.ts                # Route protection
```

## 🔑 Key Functions

### `getCurrentSession()`
Gets the current Supabase session

```typescript
const session = await getCurrentSession();
if (!session) {
  // Not logged in
}
```

### `getCurrentUserRole()`
Returns 'mentee' or 'mentor'

```typescript
const role = await getCurrentUserRole();
```

### `isAuthenticated()`
Checks if user has a valid session

```typescript
if (await isAuthenticated()) {
  // User is logged in
}
```

### `hasRole(role)`
Checks if user has a specific role

```typescript
if (await hasRole('mentee')) {
  // User is a mentee
}
```

### `signOut()`
Logs out the user and clears local storage

```typescript
await signOut();
```

## 🚀 How to Test

### 1. Start the dev server
```bash
npm run dev
```

### 2. Test Mentee Sign-In
- Go to `http://localhost:3000/auth/mentee`
- Click "Don't have an account? Sign up"
- Fill in the form:
  - Full Name: John Student
  - Email: student@example.com
  - Password: TestPassword123
- Click "Create Account"
- You'll see a success message
- Sign in with the same email
- Should redirect to `/user`

### 3. Test Mentor Sign-In
- Go to `http://localhost:3000/auth/mentor`
- Click "Don't have an account? Sign up"
- Fill in the form with LinkedIn URL
- Should redirect to `/mentor/dashboard` after sign-in

### 4. Test Protected Routes
- Without signing in, try to access `/user`
- Should redirect to `/auth/mentee`
- After signing in, should allow access

### 5. Check Browser Console
- Look for logs like:
  - `✅ Sign in successful, session created`
  - `✅ User authenticated as mentee: email@example.com`
  - `Redirecting to /user`

## 🐛 Debugging

### If sign-in doesn't work:

1. **Check browser console** for error messages
2. **Check Supabase dashboard** to see if user was created
3. **Verify Supabase credentials** in `.env.local`
4. **Check session**: Open DevTools → Application → Cookies → Look for `sb-` prefixed cookies

### If redirects fail:

1. **Clear browser cache and cookies**
2. **Check middleware.ts** to ensure routes aren't over-protected
3. **Look for redirect loops** in browser Network tab

### If role is missing:

1. **Check user_metadata** in Supabase: Authentication → Users
2. **Verify signup code** is setting `role` in metadata
3. **Clear session** and try signing up again

## 📝 Common Issues & Fixes

### Issue: "No session created"
**Fix**: Check Supabase credentials and ensure auth is enabled

### Issue: "Invalid email or password"
**Fix**: Make sure you're using the exact email and password you signed up with

### Issue: "Infinite redirect loop"
**Fix**: Clear cookies, check that redirect URLs are correct

### Issue: "User redirects to wrong dashboard"
**Fix**: Check that role in metadata matches expected role (mentee/mentor)

## 🔒 Security Notes

- Sessions are managed by Supabase (JWT tokens in cookies)
- Passwords are hashed by Supabase
- Protected routes check session before loading
- Role validation prevents cross-portal access
- Sign-out clears session and local storage

## 🎯 Next Steps

After verifying sign-in works:

1. **Populate mentee dashboard** at `/user/page.tsx`
2. **Populate mentor dashboard** at `/mentor/dashboard/page.tsx`
3. **Add more protected routes** as needed
4. **Set up database** for user profiles and data

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Check middleware.ts and auth page logic
3. Verify Supabase credentials in .env.local
4. Look at recent changes in auth files

---

**Auth System Last Updated**: Jan 2025
**Status**: ✅ Clean rewrite complete
