# "Failed to fetch" Error - Root Cause & Fix

## Real Issue Identified

**The Error:** `net::ERR_NAME_NOT_RESOLVED` for `ccvzebomzpfoddmuflrq.supabase.co`

This means:
- Your app is trying to connect to Supabase's authentication servers
- But the DNS lookup is failing (cannot resolve the domain)
- This typically indicates a **network connectivity problem**

## Root Causes

1. **No Internet Connection** (most likely)
   - The device running the browser is offline
   - Or network is blocking Supabase URLs

2. **DNS Issues**
   - DNS server not responding
   - ISP blocking external domains

3. **Supabase Server Down** (unlikely)
   - Check https://status.supabase.com

## What I Fixed

### 1. **Improved Supabase Configuration** ([lib/supabase.ts](lib/supabase.ts))
- Added logging to detect missing env variables
- Disabled persistent session to prevent auth loops when offline
- Better error messages

### 2. **Better Error Handling**
- Chat component: Catches auth errors gracefully
- User page: Logs network issues clearly
- Added session error handling

### 3. **Network Error Boundary** ([components/NetworkErrorBoundary.tsx](components/NetworkErrorBoundary.tsx))
- Detects when browser is offline (`navigator.onLine`)
- Shows user-friendly error message with troubleshooting steps
- Allows retry attempts

### 4. **Health Check Endpoint** ([app/api/health/route.ts](app/api/health/route.ts))
- Allows monitoring if the API server is running
- Reports environment configuration status

### 5. **Fixed Next.js Config** ([next.config.ts](next.config.ts))
- Updated deprecated `experimental.serverComponentsExternalPackages` to `serverExternalPackages`

## Troubleshooting Steps

### Step 1: Check Internet Connection
```bash
# From your terminal
ping google.com
ping ccvzebomzpfoddmuflrq.supabase.co
```

### Step 2: Verify Dev Server is Running
```bash
# In your terminal
npm run dev
# Should show: "ready - started server on 0.0.0.0:3000"
```

### Step 3: Test the Health Endpoint
```bash
curl http://localhost:3000/api/health
# Should return: {"ok":true,...}
```

### Step 4: Check Environment Variables
```bash
# Verify .env.local exists and has:
# NEXT_PUBLIC_SUPABASE_URL=https://ccvzebomzpfoddmuflrq.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# GROQ_API_KEY=...
```

### Step 5: Check Browser Console
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for errors like:
   - `net::ERR_NAME_NOT_RESOLVED` = DNS/network issue
   - `HTTP 401` = Auth key invalid
   - `HTTP 503` = Service unavailable

## Common Solutions

### Issue: `ERR_NAME_NOT_RESOLVED` on Supabase domain
**Solution:**
1. Check your internet connection
2. Check if your network blocks external HTTPS connections
3. Try with a different network (mobile hotspot)
4. Restart router/modem

### Issue: `Session error (possibly offline)`
**Solution:**
- This is expected when offline
- The app uses localStorage fallback
- Works again when online

### Issue: Fetch succeeds but returns no data
**Solution:**
1. Check `.env.local` has correct API keys
2. Verify Supabase project still exists
3. Check database tables exist (`conversations`, `messages`, `profiles`)

## How to Monitor

### Browser Console Logging
```javascript
// Open DevTools Console (F12)
// You'll see messages like:
"Session error (possibly offline): network error"
"Chat init error (network issue): TypeError: Failed to fetch"
"Error loading quiz from database: TypeError: Failed to fetch"
```

### Next.js Terminal Logging
```
api/health GET 200  // Server is running
Error: ENOENT: no such file or directory // Missing env file
```

## Architecture Now Supports

✅ **Offline-first fallback**: Uses localStorage when API unavailable
✅ **Network detection**: Shows error UI when offline
✅ **Graceful degradation**: App works in limited capacity offline
✅ **Clear error messages**: Users know what's wrong
✅ **Automatic retry**: Network error boundary allows retry

## Testing the Fix

1. **Online Test:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Should load normally
   ```

2. **Offline Simulation:**
   - DevTools → Network tab → Set to "Offline"
   - Should see error boundary with troubleshooting steps

3. **Network Error Test:**
   - DevTools → Network tab → Set to "Slow 3G"
   - Might take longer but should still work

## Still Having Issues?

Check this in order:
1. ✅ Internet connection working? (`ping google.com`)
2. ✅ Dev server running? (`npm run dev`)
3. ✅ .env.local exists? (See `cat .env.local`)
4. ✅ Browser console clear? (F12 → Console)
5. ✅ Network tab shows requests? (F12 → Network)

If stuck, the error boundary will give you the specific message to troubleshoot.
