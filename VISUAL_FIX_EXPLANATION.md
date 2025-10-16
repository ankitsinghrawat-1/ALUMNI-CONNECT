# Mentor Profile Link Bug - Visual Explanation

## The Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                    BEFORE THE FIX                                │
└─────────────────────────────────────────────────────────────────┘

Page Loads
    │
    ├─► Script Loading:
    │   ├─ 1. auth.js loads first ❌
    │   │     └─ Tries to use window.api
    │   │         └─ ERROR: window.api is undefined!
    │   │
    │   └─ 2. api.js loads second
    │         └─ Creates window.api (too late!)
    │
    └─► API Call:
        ├─ auth.js calls /api/mentors/status
        │     └─ ERROR: window.api is undefined
        │
        └─ Even if window.api worked:
              └─ Server endpoint uses optionalAuth
                    └─ req.user is null for some cases
                          └─ Accessing req.user.userId causes TypeError
                                └─ API returns error
                                      └─ Mentor profile link not created ❌
```

## The Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                     AFTER THE FIX                                │
└─────────────────────────────────────────────────────────────────┘

Page Loads
    │
    ├─► Script Loading:
    │   ├─ 1. api.js loads first ✅
    │   │     └─ Creates window.api object
    │   │
    │   └─ 2. auth.js loads second ✅
    │         └─ window.api is available!
    │
    └─► API Call Flow:
        │
        ├─ Step 1: auth.js calls window.api.get('/mentors/status')
        │          └─ Includes JWT token in Authorization header ✅
        │
        ├─ Step 2: Server receives request
        │          └─ verifyToken middleware validates token ✅
        │                └─ req.user is populated with user data
        │                      └─ userId: 123
        │
        ├─ Step 3: Endpoint handler runs
        │          ├─ Queries database: SELECT is_mentor FROM users WHERE user_id = 123
        │          └─ If is_mentor = TRUE:
        │                ├─ Queries: SELECT mentor_id FROM mentors WHERE user_id = 123
        │                └─ Returns: { isMentor: true, mentorId: 456 } ✅
        │
        └─ Step 4: Client receives response
                   └─ isMentor === true && mentorId exists
                         └─ Creates mentor profile link ✅
                               └─ Link added to dropdown: ✅
                                   <a href="mentor-profile.html?id=456">
                                       Mentor Profile
                                   </a>
```

## Visual Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                             │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  User (who is mentor) │
                    │  clicks profile pic   │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Profile dropdown     │
                    │  opens                │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  User clicks          │
                    │  "My Profiles"        │
                    └───────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│              NESTED DROPDOWN APPEARS                               │
│                                                                    │
│   ┌──────────────────────────────────────────────────┐           │
│   │  ✏️  Main Profile                                │           │
│   ├──────────────────────────────────────────────────┤           │
│   │  🆔 Social Profile                               │           │
│   ├──────────────────────────────────────────────────┤           │
│   │  👨‍🏫 Mentor Profile  ← NOW VISIBLE! ✅           │           │
│   └──────────────────────────────────────────────────┘           │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

## Database Query Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE QUERIES                              │
└─────────────────────────────────────────────────────────────────┘

API Request: GET /api/mentors/status
    │
    ├─ Authorization: Bearer eyJhbGc...
    │
    └─► verifyToken middleware
            │
            ├─ Decodes JWT token
            ├─ Extracts: { userId: 123, email: "mentor@example.com" }
            └─ Sets: req.user = { userId: 123, ... }
                    │
                    ▼
                Query 1:
                ┌──────────────────────────────────────────────┐
                │ SELECT user_id, email, is_mentor             │
                │ FROM users                                    │
                │ WHERE user_id = 123                           │
                └──────────────────────────────────────────────┘
                    │
                    ├─ Result: { user_id: 123, email: "...", is_mentor: 1 }
                    │
                    └─► If is_mentor === 1:
                            │
                            ▼
                        Query 2:
                        ┌──────────────────────────────────────┐
                        │ SELECT mentor_id                     │
                        │ FROM mentors                         │
                        │ WHERE user_id = 123                  │
                        └──────────────────────────────────────┘
                            │
                            ├─ Result: { mentor_id: 456 }
                            │
                            └─► Response:
                                ┌─────────────────────────────┐
                                │ {                           │
                                │   "isMentor": true,         │
                                │   "mentorId": 456           │
                                │ }                           │
                                └─────────────────────────────┘
```

## Code Changes Summary

### 1. Server-side Fix (1 line change)

```javascript
// File: server/api/mentors.js
// Line 382

// BEFORE:
router.get('/status', optionalAuth, asyncHandler(async (req, res) => {
    // ❌ req.user could be null, causing TypeError

// AFTER:
router.get('/status', verifyToken, asyncHandler(async (req, res) => {
    // ✅ req.user is guaranteed to exist and have userId
```

### 2. Client-side Fix (58 files)

```html
<!-- BEFORE (WRONG): -->
<script src="js/auth.js"></script>  <!-- Loads first, needs window.api ❌ -->
<script src="js/api.js"></script>   <!-- Loads second, creates window.api -->

<!-- AFTER (CORRECT): -->
<script src="js/api.js"></script>   <!-- Loads first, creates window.api ✅ -->
<script src="js/auth.js"></script>  <!-- Loads second, uses window.api ✅ -->
```

## Impact

### Before Fix:
- ❌ Mentor users don't see their mentor profile link
- ❌ Console errors: "window.api is not defined"
- ❌ API errors: "Cannot read property 'userId' of null"
- ❌ Poor user experience for mentors

### After Fix:
- ✅ Mentor users see their mentor profile link
- ✅ No console errors
- ✅ API works correctly with proper authentication
- ✅ Seamless user experience for all users

## Testing Scenarios

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEST SCENARIO 1                               │
│                Regular User (Not a Mentor)                       │
└─────────────────────────────────────────────────────────────────┘

Login → Click Profile Pic → Click "My Profiles"
    │
    └─► Expected Result:
            ┌─────────────────────────┐
            │ ✏️  Main Profile        │
            │ 🆔 Social Profile       │
            └─────────────────────────┘
            (2 options only)

┌─────────────────────────────────────────────────────────────────┐
│                    TEST SCENARIO 2                               │
│                Mentor User (Registered as Mentor)                │
└─────────────────────────────────────────────────────────────────┘

Login → Click Profile Pic → Click "My Profiles"
    │
    └─► Expected Result:
            ┌─────────────────────────┐
            │ ✏️  Main Profile        │
            │ 🆔 Social Profile       │
            │ 👨‍🏫 Mentor Profile ✨   │
            └─────────────────────────┘
            (3 options - mentor link visible!)

┌─────────────────────────────────────────────────────────────────┐
│                    TEST SCENARIO 3                               │
│                Click Mentor Profile Link                         │
└─────────────────────────────────────────────────────────────────┘

Click "Mentor Profile" Link
    │
    └─► Expected Result:
            Navigate to: mentor-profile.html?id=456
            Page displays mentor's public profile ✅
```

## Key Takeaways

1. **Script Loading Order Matters**: Dependencies must load before they're used
2. **Authentication Consistency**: Use appropriate middleware for endpoint requirements
3. **Null Checks**: Always verify objects exist before accessing properties
4. **Error Handling**: Comprehensive error handling helps diagnose issues
5. **Testing**: Test with different user types (mentor vs non-mentor)
