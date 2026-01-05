# Debugging "Failed to fetch" Error

## Common Causes & Solutions

### 1. **Missing Environment Variables** (Most Common)
The app depends on several environment variables that must be configured:

```bash
# Create .env.local in the root directory with:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
```

**How to get these:**
- **Supabase**: Go to https://app.supabase.com → Your Project → Settings → API
- **Groq**: Go to https://console.groq.com → API Keys

### 2. **Check the Browser Console**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for specific error messages:
   - **"Failed to fetch"** = Network/CORS issue
   - **"HTTP 401"** = Unauthorized (missing auth header)
   - **"HTTP 503"** = Service unavailable (API not configured)
   - **"HTTP 500"** = Server error

### 3. **Network Tab Analysis**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Trigger the action that causes the error
4. Look for red failed requests
5. Click the request and check:
   - **Status**: The HTTP status code
   - **Response**: The error message
   - **Headers**: Check if authorization header is present

### 4. **Check API Endpoints**
Test each API endpoint directly:

```bash
# Test mentors endpoint (should return 200)
curl http://localhost:3000/api/mentors/active

# Test career suggestions (requires POST)
curl -X POST http://localhost:3000/api/career-suggestions \
  -H "Content-Type: application/json" \
  -d '{"grade": "12"}'

# Test AI chat (requires POST)
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### 5. **Common API Issues**

| Endpoint | Issue | Solution |
|----------|-------|----------|
| `/api/mentors/active` | Returns empty mentors | Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` |
| `/api/career-suggestions` | API error | Add `GROQ_API_KEY` to `.env.local` |
| `/api/ai-chat` | Connection failed | Check internet connection, API key, and Groq status |

### 6. **Development Server Issues**

```bash
# Restart the dev server
npm run dev

# Clear Next.js cache
rm -r .next

# Reinstall dependencies
rm -r node_modules package-lock.json
npm install

# Run with verbose logging
npm run dev -- --debug
```

### 7. **Network Issues**

```bash
# Check if API server is running
curl http://localhost:3000/

# Test external API connectivity
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY"
```

## Improved Error Logging

The app now logs errors with more detail:

```
Failed to fetch mentors: HTTP 401 Unauthorized
Career suggestions API error: HTTP 503 Service Unavailable
AI Chat API error: HTTP 429 Rate Limited
```

Check the browser console for these messages to identify the specific issue.

## Next Steps

1. **First**: Create `.env.local` with your credentials
2. **Second**: Restart the dev server with `npm run dev`
3. **Third**: Open DevTools (F12) and check the Console
4. **Fourth**: Try the action that triggers the error and note the exact message
5. **Fifth**: Reference the table above to fix the specific endpoint

## Still Not Working?

Check:
- ✅ `.env.local` exists and has correct values
- ✅ Dev server is running (terminal shows "ready")
- ✅ You can access http://localhost:3000 in browser
- ✅ Network tab shows HTTP responses (not "Failed")
- ✅ Console doesn't show CORS errors
