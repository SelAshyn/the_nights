# AI Schedule Generation - Implementation Details

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Interface                              │
│              /app/user/plans/page.tsx                            │
│         - UI Component with "✨ AI Schedule" button              │
│         - Local state management (quiz data from localStorage)   │
│         - Schedule display and customization                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ POST request with quiz data
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway                                   │
│           /api/schedule/generate/route.ts                       │
│    - Authentication validation (Bearer token)                    │
│    - Request validation                                          │
│    - Response formatting                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
   ┌─────────────┐         ┌──────────────┐
   │  Groq API   │◄────────┤AI Prompt     │
   │             │         │Generation    │
   │ llama-3.3   │         │              │
   └──────┬──────┘         └──────────────┘
          │
          ├─ Try parsing response
          │
          ├─ Success? ✓
          │  └─→ Return AI Schedule
          │
          └─ Fallback
             └─→ Generate Default Schedule
```

## Request Flow Diagram

```
User clicks "✨ AI Schedule"
    ↓
Check authentication (session?)
    ├─ NO → Error: Not authenticated
    └─ YES
        ↓
Get quiz data from localStorage
    ├─ MISSING → Error: Please complete quiz first
    └─ EXISTS
        ↓
Call /api/schedule/generate
    ↓
Validate request (Bearer token)
    ├─ INVALID → Error 401: Unauthorized
    └─ VALID
        ↓
Generate AI Prompt
    ↓
Call Groq API
    ├─ TIMEOUT/ERROR → Use Fallback
    └─ SUCCESS
        ↓
Parse JSON response
    ├─ INVALID JSON → Use Fallback
    ├─ INVALID STRUCTURE → Use Fallback
    └─ VALID
        ↓
Format schedule slots
    ├─ Missing fields? → Skip slot
    └─ Valid slot
        ↓
Save to database (via saveSchedule)
    ├─ ERROR → Show error message
    └─ SUCCESS
        ↓
Display success message (auto-clear after 5s)
```

## Data Flow

### Input: Quiz Data Structure
```typescript
{
  grade: string;                    // e.g., "Grade 12", "Bachelor's Year 2"
  careerInterest: string;           // e.g., "Software Engineer", "Doctor"
  academicInterests: string[];      // e.g., ["Math", "Physics", "CS"]
  academicStrengths: string[];      // e.g., ["Problem solving", "Logic"]
  preferredEnvironment: string;     // e.g., "Independent", "Group"
  taskPreference: string;           // e.g., "Problem-solving", "Creative"
  skills: string[];                 // e.g., ["Python", "Java", "C++"]
  techConfidence: string;           // e.g., "Beginner", "Advanced"
  workLife: string;                 // e.g., "Balanced", "Career-focused"
  careerMotivation: string;         // e.g., "High", "Medium"
  studyGoal: string;                // e.g., "University", "Career prep"
}
```

### Output: Schedule Slots
```typescript
interface ScheduleSlot {
  id: string;        // "Monday-6:00 AM"
  day: string;       // "Monday" through "Sunday"
  time: string;      // "6:00 AM", "8:00 AM", etc.
  activity: string;  // One of the predefined activities
  color: string;     // Tailwind color class for UI
}
```

## AI Prompt Engineering

### Prompt Structure
```
1. System Context
   - What we're trying to do (generate schedules)
   - What the AI is (schedule optimizer)

2. Student Profile
   - 12 detailed fields about the student
   - Current/existing schedule if any

3. Available Options
   - Time slots (6 AM - 8 PM, fixed intervals)
   - Days (Monday - Sunday)
   - Activities (16 predefined options)

4. Requirements
   - Specific constraints (3-4 hours study)
   - Balance requirements (breaks, variety)
   - Personalization goals (match interests)

5. Output Format
   - Explicit JSON structure
   - No markdown or explanations
   - Strict field requirements

6. Rules
   - Each slot exactly one activity
   - No duplicates
   - Times must match list exactly
   - Return only valid JSON
```

## Fallback Generation Algorithm

### Decision Tree
```
Generate Fallback Schedule
    ├─ Analyze Profile
    │   ├─ Is Tech? (career interest contains "tech"/"engineer"/"code")
    │   ├─ Is Math? (interests/strengths contain "math")
    │   └─ Is Science? (interests/strengths contain "science")
    │
    ├─ Define Template Schedule (for each day)
    │   ├─ Monday: Study Session, Break, [Coding/Reading], Problems, Review
    │   ├─ Tuesday: Assignment, Break, Study, Group Study, Break
    │   ├─ ...
    │   └─ Sunday: Review, Break, Reading, Presentation, Study
    │
    ├─ Map to Time Slots
    │   └─ 6AM → Activity 1, 8AM → Activity 2, etc.
    │
    └─ Format Output
        └─ Create ScheduleSlot objects with colors
```

## Error Handling Strategy

### Error Hierarchy (1 = Highest Priority)

1. **Authentication Errors**
   - No session token
   - Invalid/expired token
   - Unauthorized user
   - → Response: 401 Unauthorized

2. **Input Validation Errors**
   - Missing quiz data
   - Malformed request
   - Invalid fields
   - → Response: 400 Bad Request

3. **API Errors**
   - Groq API timeout
   - Rate limit exceeded
   - Network error
   - → Response: Use Fallback Schedule

4. **Parsing Errors**
   - Invalid JSON in response
   - Missing required fields
   - Wrong data types
   - → Response: Use Fallback Schedule

5. **Database Errors**
   - Cannot save to database
   - RLS policy violation
   - Connection error
   - → Response: Show error, don't save

### Recovery Strategy

```
AI Generation Fails
    ↓
Try Fallback Generation
    ├─ Success → Return with source: "fallback"
    └─ Failure → Return error to user
```

## Performance Characteristics

### Time Breakdown (Typical Request)
```
Authentication:        ~50ms
Prompt generation:     ~10ms
Groq API call:         ~3-5 seconds
Response parsing:      ~5-50ms (depending on response size)
Database save:         ~1-2 seconds
Total:                 ~5-7 seconds
```

### Async Operations
- Groq API call is network-bound
- UI remains responsive
- Button shows loading state
- User can still interact with page

### Memory Usage
- Quiz data: ~1-2KB
- Generated schedule: ~5-10KB
- API response: ~10-50KB
- Total per request: <100KB

## Security Considerations

### Authentication
```typescript
// Only authenticated users can call the endpoint
const token = authHeader.substring(7);
const { data: { user }, error } = await supabase.auth.getUser(token);
// Verify user exists and token is valid
```

### Data Privacy
- Quiz data not stored in API logs
- Schedule saved under user's ID only
- RLS policies enforce row-level security
- Token verified against Supabase auth

### API Rate Limiting
- Subject to Groq API rate limits
- Fallback prevents infinite loops
- Individual user controls button clicks

### Input Sanitization
- All inputs passed to AI prompt (no direct concatenation risks)
- Schedule values validated against allowlist
- Database save uses parameterized queries (Supabase handles)

## Monitoring & Logging

### Console Logs
```typescript
console.log('Generating schedule for user:', user.id);
console.log('AI Response received, parsing schedule...');
console.log('Schedule generated successfully:', schedule.length, 'slots');
console.error('Error generating schedule:', error);
```

### Success Metrics to Track (Future)
- Generation success rate (%)
- Average response time (seconds)
- Fallback frequency (%)
- User satisfaction (survey)
- Schedule modification rate (%)

## Testing Strategy

### Unit Tests (To Be Implemented)
```typescript
// Test prompt generation
test('generateSchedulePrompt generates valid prompt');

// Test response parsing
test('parseScheduleResponse handles valid JSON');
test('parseScheduleResponse handles invalid JSON');

// Test fallback generation
test('generateFallbackSchedule creates valid schedule');

// Test color mapping
test('getActivityColor maps all activities');
```

### Integration Tests (To Be Implemented)
```typescript
// Test with real Groq API
test('e2e: Full schedule generation flow');

// Test with different quiz data
test('e2e: Schedule respects tech profile');
test('e2e: Schedule respects math profile');

// Test error cases
test('e2e: Handles missing quiz data');
test('e2e: Handles auth errors');
test('e2e: Handles API errors');
```

### Manual Testing Checklist
- [ ] Generate with minimal quiz data
- [ ] Generate with comprehensive quiz data
- [ ] Test with empty current schedule
- [ ] Test with filled current schedule
- [ ] Verify schedule saves to database
- [ ] Verify can customize after generation
- [ ] Test on slow network (DevTools throttle)
- [ ] Test API failure (DevTools Network offline)
- [ ] Test with different student profiles

## Future Optimization Opportunities

### Short Term (Week 1-2)
1. Add user feedback collection (rate this schedule)
2. Store multiple generated schedules
3. Show AI reasoning/explanation for activities

### Medium Term (Month 1-2)
1. Cache frequently used prompts
2. Add semester/exam prep mode
3. Integrate with milestone tracking
4. Real-time schedule adjustment

### Long Term (Q1 2025)
1. ML model for pattern recognition
2. Collaborative filtering (learn from peers)
3. Mobile app integration
4. Calendar sync (Google Cal, Outlook)

## Configuration Matrix

| Component | Setting | Default | Customizable |
|-----------|---------|---------|--------------|
| AI Model | llama-3.3-70b-versatile | Yes | Backend only |
| Temperature | Creativity level | 0.7 | Prompt tuning |
| Max Tokens | Response length | 2000 | Groq config |
| Time Slots | Available times | 6AM-8PM | Both files |
| Activities | Available options | 16 options | Both files |
| Break Duration | Suggested break | 15-30 min | Prompt text |
| Study Hours | Daily minimum | 3-4 hours | Prompt text |

## Deployment Checklist

- [x] Feature developed
- [x] Error handling implemented
- [x] Fallback system added
- [x] Documentation complete
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Performance tested on slow network
- [ ] Manual QA completed
- [ ] Code review
- [ ] User testing
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Support documentation

## Support Information

### For Users
- See `AI_SCHEDULE_QUICK_START.md`

### For Developers
- See `AI_SCHEDULE_GENERATION_FEATURE.md`

### For DevOps
- No infrastructure changes needed
- Uses existing Groq API key
- Uses existing Supabase database
- No new environment variables

---

**Document Version**: 1.0
**Last Updated**: December 6, 2025
**Technical Owner**: Backend API
**Product Owner**: Learning Plans Feature
