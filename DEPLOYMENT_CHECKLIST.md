# Deployment Checklist for 100bits

## ✅ Fixed Issues

1. **Environment Variable Fix**: Changed `SUPABASE_URL` to `NEXT_PUBLIC_SUPABASE_URL` in `app/api/mentor/verify/route.ts`
2. **Turbopack Compatibility**: Switched to webpack mode for groq-sdk compatibility
3. **Build Success**: Production build completes successfully

## 🔧 Required Environment Variables

Make sure these are set in your deployment platform (Vercel/Netlify/etc.):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Groq API
GROQ_API_KEY=your_groq_api_key
```

## 📋 Pre-Deployment Steps

### 1. Database Setup
- [ ] Run all SQL migrations in `/database` folder in order:
  - `01-chat-tables.sql`
  - `02-chat-security.sql`
  - `03-chat-functions.sql`
  - `04-quiz-tables.sql`
  - `05-mentor-verification.sql`

### 2. Supabase Configuration
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Configure authentication providers in Supabase dashboard
- [ ] Set up email templates for auth
- [ ] Configure storage buckets if needed

### 3. API Keys
- [ ] Get Groq API key from https://console.groq.com
- [ ] Verify Supabase keys from project settings
- [ ] Test API endpoints locally before deploying

### 4. Build Configuration
- [ ] Ensure `package.json` has `"dev": "next dev --webpack"`
- [ ] Verify `next.config.ts` is clean (no experimental configs)
- [ ] Run `npm run build` locally to test

## 🚀 Deployment Platforms

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables in Project Settings
3. Deploy automatically on push to main branch
4. Framework Preset: Next.js
5. Build Command: `npm run build`
6. Output Directory: `.next`

### Other Platforms
- Ensure Node.js 18+ is available
- Set build command: `npm run build`
- Set start command: `npm start`
- Configure environment variables

## ⚠️ Known Issues & Solutions

### Issue: groq-sdk with Turbopack
**Solution**: Using webpack mode (`--webpack` flag in dev script)

### Issue: Rate Limiting on Groq API
**Solution**: Fallback data is implemented in `app/api/career-suggestions/route.ts`

### Issue: CORS errors
**Solution**: Supabase RLS policies are configured in database scripts

## 🧪 Post-Deployment Testing

- [ ] Test user registration and login
- [ ] Test mentor verification flow
- [ ] Test career suggestions API
- [ ] Test AI chat functionality
- [ ] Test quiz save/load functionality
- [ ] Test mentor-mentee messaging
- [ ] Verify all environment variables are working

## 📊 Monitoring

- Monitor Groq API usage and rate limits
- Monitor Supabase database connections
- Check Next.js logs for errors
- Set up error tracking (Sentry recommended)

## 🔒 Security Checklist

- [x] `.env.local` is in `.gitignore`
- [x] Service role key is never exposed to client
- [x] RLS policies are enabled on all tables
- [ ] Set up CORS policies in Supabase
- [ ] Enable rate limiting on API routes if needed
- [ ] Review and remove console.log statements in production

## 📝 Optional Improvements

- Remove console.log statements from production code
- Add error tracking (Sentry, LogRocket)
- Set up analytics (Google Analytics, Plausible)
- Configure CDN for static assets
- Enable Next.js Image Optimization
- Set up monitoring and alerts

## 🎯 Quick Deploy Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start

# Deploy to Vercel
vercel --prod
```

## 📞 Support Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Groq API Docs: https://console.groq.com/docs
- Vercel Deployment: https://vercel.com/docs
