# Role Separation System

MentorLaunch implements a strict role separation system to ensure that mentor and mentee accounts remain completely separate and secure.

## Overview

The system prevents:
- Using the same email for both mentor and mentee accounts
- Role switching after account creation
- Cross-role data access
- Unauthorized access to role-specific features

## Implementation

### 1. Email Separation

**API Endpoint**: `/api/auth/check-email`
- Checks if an email is already registered for a different role
- Prevents registration if email exists with opposite role
- Returns clear error messages for role conflicts

**Example Response**:
```json
{
  "available": false,
  "message": "This email is already registered as a mentor. Please use a different email for mentee registration or sign in as a mentor."
}
```

### 2. Authentication Flow

#### Mentee Registration (`/auth/mentee`)
1. Email availability check against mentor accounts
2. Role validation during signup
3. Automatic role assignment in user metadata
4. Redirect to appropriate dashboard

#### Mentor Registration (`/auth/mentor`)
1. Email availability check against mentee accounts
2. Professional information collection
3. Role validation and verification status setup
4. Redirect to mentor dashboard

### 3. Role-Based Access Control

#### Middleware Protection
- Routes are protected based on required roles
- Automatic redirects for wrong role access
- Token-based authentication checks

#### Database Security
- Row Level Security (RLS) policies
- Role-based data access restrictions
- Database triggers prevent role switching

### 4. Protected Routes

#### Mentee Routes
- `/user` - Main dashboard
- `/user/plans` - Study plans and schedules
- `/user/saved` - Saved careers
- `/welcome` - Onboarding quiz

#### Mentor Routes
- `/mentor/dashboard` - Mentor dashboard
- `/mentor/profile` - Profile management
- `/mentor/messages` - Chat management
- `/mentor/mentees` - Mentee connections

### 5. Database Triggers

#### Role Validation
```sql
CREATE OR REPLACE FUNCTION validate_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' NOT IN ('mentor', 'mentee') THEN
    RAISE EXCEPTION 'Invalid role. Must be either mentor or mentee.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Role Switching Prevention
```sql
CREATE OR REPLACE FUNCTION prevent_role_switching()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND
     OLD.raw_user_meta_data->>'role' != NEW.raw_user_meta_data->>'role' THEN
    RAISE EXCEPTION 'Role switching is not allowed.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security Features

### 1. Client-Side Validation
- Real-time email availability checking
- Role-specific form validation
- Clear error messaging for conflicts

### 2. Server-Side Protection
- API endpoint validation
- Database constraint enforcement
- Session role verification

### 3. Database Security
- RLS policies for all tables
- Role-based data isolation
- Audit triggers for role changes

## User Experience

### Clear Role Identification
- Distinct branding for each portal
- Role-specific navigation
- Appropriate redirects based on role

### Error Handling
- Informative error messages
- Suggestions for resolution
- Graceful fallbacks

### Cross-Role Prevention
- Email conflict detection
- Automatic role-based redirects
- Session validation on each request

## Testing the System

### Test Cases

1. **Email Separation**
   - Register as mentee with email A
   - Attempt to register as mentor with same email A
   - Should receive error message

2. **Role-Based Access**
   - Login as mentee
   - Attempt to access `/mentor/dashboard`
   - Should redirect to `/user`

3. **Session Validation**
   - Login as mentor
   - Manually navigate to `/user`
   - Should redirect to `/mentor/dashboard`

### Manual Testing Steps

1. Create mentee account with `test@example.com`
2. Try to create mentor account with same email
3. Verify error message appears
4. Login as mentee and try accessing mentor routes
5. Verify automatic redirects work

## Deployment Considerations

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

### Database Setup
1. Run all migration files in order
2. Ensure RLS is enabled on all tables
3. Verify triggers are created successfully

### Monitoring
- Monitor failed authentication attempts
- Track role conflict errors
- Audit role-based access patterns

## Troubleshooting

### Common Issues

1. **Email Already Exists Error**
   - Check which role the email is registered for
   - Guide user to correct login portal
   - Suggest using different email if needed

2. **Redirect Loops**
   - Verify user has valid role in metadata
   - Check middleware configuration
   - Ensure session persistence is enabled

3. **Access Denied Errors**
   - Verify RLS policies are correctly applied
   - Check user role in database
   - Ensure proper session handling

### Debug Commands

```sql
-- Check user roles
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'user@example.com';

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

## Future Enhancements

1. **Admin Panel**
   - Role management interface
   - User migration tools
   - Audit log viewing

2. **Enhanced Security**
   - Two-factor authentication
   - Role-based permissions matrix
   - Advanced audit logging

3. **User Management**
   - Role transfer requests
   - Account merging (with approval)
   - Bulk user operations
