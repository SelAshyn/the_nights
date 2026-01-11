#!/usr/bin/env node

/**
 * Test script to verify authentication system
 * Run with: node test-auth.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking authentication system setup...\n');

// Check 1: Auth pages exist
const authPagesPath = path.join(__dirname, 'app', 'auth');
const authPages = ['mentee/page.tsx', 'mentor/page.tsx', 'callback/route.ts'];

console.log('✓ Checking auth pages...');
authPages.forEach(page => {
  const filePath = path.join(authPagesPath, page);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${page} exists`);
  } else {
    console.log(`  ❌ ${page} MISSING`);
  }
});

// Check 2: Auth utilities
console.log('\n✓ Checking auth utilities...');
const authUtilsPath = path.join(__dirname, 'lib', 'auth-utils.ts');
if (fs.existsSync(authUtilsPath)) {
  const content = fs.readFileSync(authUtilsPath, 'utf8');
  const requiredFunctions = ['getCurrentSession', 'getCurrentUserRole', 'hasRole', 'signOut'];
  requiredFunctions.forEach(fn => {
    if (content.includes(`function ${fn}`)) {
      console.log(`  ✅ ${fn} implemented`);
    } else {
      console.log(`  ❌ ${fn} MISSING`);
    }
  });
} else {
  console.log('  ❌ auth-utils.ts MISSING');
}

// Check 3: Protected pages
console.log('\n✓ Checking protected pages...');
const userPagePath = path.join(__dirname, 'app', 'user', 'page.tsx');
if (fs.existsSync(userPagePath)) {
  const content = fs.readFileSync(userPagePath, 'utf8');
  if (content.includes('getCurrentSession') && content.includes('user?.email')) {
    console.log('  ✅ User page has auth check');
  } else {
    console.log('  ⚠️  User page may not have proper auth check');
  }
} else {
  console.log('  ❌ User page MISSING');
}

// Check 4: Supabase configuration
console.log('\n✓ Checking Supabase configuration...');
const supabasePath = path.join(__dirname, 'lib', 'supabase.ts');
if (fs.existsSync(supabasePath)) {
  console.log('  ✅ Supabase client configured');
} else {
  console.log('  ❌ Supabase client MISSING');
}

// Check 5: Middleware
console.log('\n✓ Checking middleware...');
const middlewarePath = path.join(__dirname, 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const content = fs.readFileSync(middlewarePath, 'utf8');
  if (content.includes('protected routes') || content.includes('/user') || content.includes('/mentor')) {
    console.log('  ✅ Middleware configured for route protection');
  } else {
    console.log('  ⚠️  Middleware may not have route protection');
  }
} else {
  console.log('  ❌ Middleware MISSING');
}

console.log('\n📋 Setup Summary:');
console.log('  • Mentee auth: /auth/mentee');
console.log('  • Mentor auth: /auth/mentor');
console.log('  • Mentee dashboard: /user');
console.log('  • Mentor dashboard: /mentor/dashboard');
console.log('  • Auth callback: /auth/callback');

console.log('\n🚀 To test:');
console.log('  1. Run: npm run dev');
console.log('  2. Open: http://localhost:3000');
console.log('  3. Try sign-up at /auth/mentee or /auth/mentor');
console.log('  4. Check browser console for logs');

console.log('\n✨ Authentication system setup check complete!\n');
