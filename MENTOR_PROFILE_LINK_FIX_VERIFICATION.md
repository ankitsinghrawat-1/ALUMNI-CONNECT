# Mentor Profile Link Fix - Verification Guide

## Problem Summary

**Issue**: The mentor profile link was not appearing in the navbar's "My Profiles" dropdown menu for users who are registered as mentors.

**Symptoms**:
- Constant API call failures to `/api/mentors/status`
- Mentor status always returning false
- Mentor profile link never showing in the navbar

## Root Cause Analysis

### What Was Broken

The `/api/mentors/status` endpoint had a critical bug:

```javascript
// BEFORE (BROKEN)
router.get('/status', optionalAuth, asyncHandler(async (req, res) => {
    try {
        const user_id = req.user.userId;  // ❌ ERROR: req.user could be null!
        // ... rest of code
    }
}));
```

**Why it failed:**
1. The endpoint used `optionalAuth` middleware
2. `optionalAuth` sets `req.user = null` when there's no valid token or token is missing
3. The code immediately accessed `req.user.userId` without checking if `req.user` exists
4. This caused a `TypeError: Cannot read property 'userId' of null` error
5. The API call failed, causing the frontend to never receive mentor status
6. Without mentor status, the mentor profile link was never added to the navbar

## The Fix

### Change Made

**File**: `server/api/mentors.js`

```javascript
// AFTER (FIXED)
router.get('/status', verifyToken, asyncHandler(async (req, res) => {
    try {
        const user_id = req.user.userId;  // ✅ SAFE: verifyToken ensures req.user exists
        // ... rest of code
    }
}));
```

**What changed:**
- Replaced `optionalAuth` with `verifyToken` middleware
- Now the endpoint requires authentication
- `verifyToken` ensures `req.user` is always defined before the handler runs
- If token is missing or invalid, it returns 401/403 before reaching the handler

### Why This Fix Works

1. **verifyToken middleware** (from `server/middleware/authMiddleware.js`):
   - Checks for authorization header
   - Validates JWT token
   - Returns error if token is missing or invalid
   - Only proceeds if token is valid
   - Sets `req.user` with decoded token data

2. **Proper authentication flow**:
   ```
   Frontend → API request with token → verifyToken middleware
                                              ↓
                                         Valid token?
                                         ↙        ↘
                                      Yes         No
                                       ↓           ↓
                                  Set req.user   Return 401/403
                                       ↓
                                  Handler runs
                                       ↓
                                  Check is_mentor
                                       ↓
                                  Return status
   ```

3. **Database check works correctly**:
   ```javascript
   // Query the users table for is_mentor field
   const [users] = await pool.query(
       'SELECT user_id, email, is_mentor FROM users WHERE user_id = ?', 
       [user_id]
   );
   
   // Convert to boolean (handles both BOOLEAN and TINYINT)
   const isMentor = user.is_mentor === 1 || user.is_mentor === true;
   
   // If mentor, get mentor_id from mentors table
   if (isMentor) {
       const [mentor] = await pool.query(
           'SELECT mentor_id FROM mentors WHERE user_id = ?', 
           [user_id]
       );
       mentorId = mentor.length > 0 ? mentor[0].mentor_id : null;
   }
   
   // Return the status
   res.json({ 
       isMentor: isMentor,
       mentorId: mentorId
   });
   ```

## Database Structure Verification

The database structure is correct and supports this functionality:

### users table
```sql
CREATE TABLE `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `is_mentor` BOOLEAN DEFAULT FALSE NOT NULL,
  -- ... other fields
);

-- Index for performance
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_is_mentor (is_mentor);
```

**Key points:**
- `is_mentor` field exists in the users table
- Default value is FALSE (not a mentor)
- Has an index for efficient queries
- Comment in structure: "is_mentor column added for performance optimization - eliminates need for joins when checking mentor status"

### mentors table
```sql
CREATE TABLE `mentors` (
  `mentor_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  -- ... mentor-specific fields
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
);
```

**Key points:**
- Has unique constraint on `user_id` (one mentor profile per user)
- When a user becomes a mentor:
  1. Record created in `mentors` table
  2. `users.is_mentor` flag set to TRUE
- When mentor profile deleted:
  1. Record removed from `mentors` table (cascade)
  2. `users.is_mentor` flag set to FALSE

## Testing Instructions

### Prerequisites
1. MySQL database running with the correct schema
2. `.env` file configured with database credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=alumni_db
   JWT_SECRET=your_secret_key
   PORT=3000
   ```
3. Node.js installed

### Test Scenario 1: User Who IS a Mentor

**Setup:**
1. Create a test user in the database
2. Register that user as a mentor using the `/api/mentors` POST endpoint
3. Verify in database:
   ```sql
   SELECT user_id, email, is_mentor FROM users WHERE user_id = ?;
   -- Should show is_mentor = 1 or TRUE
   
   SELECT mentor_id, user_id FROM mentors WHERE user_id = ?;
   -- Should return a mentor record
   ```

**Test Steps:**
1. Start the server: `npm start`
2. Log in as the mentor user
3. Check browser console logs - should see:
   ```
   ✓ window.api is available
   Auth token present: true
   🔄 Fetching mentor status from /api/mentors/status...
   ✓ Mentor status API response received:
     └─ mentorStatus.isMentor: true
     └─ mentorStatus.mentorId: [some number]
   ✓ SUCCESS: Mentor profile link created!
   ```

4. Check the navbar:
   - Click on profile picture
   - Click on "My Profiles"
   - Should see THREE options:
     - ✓ Main Profile
     - ✓ Social Profile
     - ✓ Mentor Profile

**Expected API Response:**
```json
{
  "isMentor": true,
  "mentorId": 123
}
```

### Test Scenario 2: User Who is NOT a Mentor

**Setup:**
1. Create or use a test user who is not registered as a mentor
2. Verify in database:
   ```sql
   SELECT user_id, email, is_mentor FROM users WHERE user_id = ?;
   -- Should show is_mentor = 0 or FALSE
   
   SELECT mentor_id FROM mentors WHERE user_id = ?;
   -- Should return empty result
   ```

**Test Steps:**
1. Log in as the non-mentor user
2. Check browser console logs - should see:
   ```
   ✓ window.api is available
   Auth token present: true
   🔄 Fetching mentor status from /api/mentors/status...
   ✓ Mentor status API response received:
     └─ mentorStatus.isMentor: false
     └─ mentorStatus.mentorId: null
   ✗ NOT creating mentor link:
     └─ Reason: isMentor is false (expected true)
   ```

3. Check the navbar:
   - Click on profile picture
   - Click on "My Profiles"
   - Should see TWO options:
     - ✓ Main Profile
     - ✓ Social Profile
     - ✗ Mentor Profile (should NOT appear)

**Expected API Response:**
```json
{
  "isMentor": false,
  "mentorId": null
}
```

### Test Scenario 3: Unauthenticated Request

**Test Steps:**
1. Clear localStorage (remove token)
2. Try to access a page that calls the mentor status API
3. Should see error in network tab:
   - Status: 403 Forbidden
   - Response: `{"message": "No token provided."}`
4. The navbar should show logged-out view (no profile dropdown)

### Test Scenario 4: Becoming a Mentor

**Test Steps:**
1. Log in as a regular user (not a mentor)
2. Verify "Mentor Profile" link does NOT appear in navbar
3. Go to "Become a Mentor" page
4. Fill out the mentor registration form
5. Submit the form
6. Verify in database:
   ```sql
   SELECT user_id, is_mentor FROM users WHERE user_id = ?;
   -- Should now show is_mentor = 1
   
   SELECT mentor_id FROM mentors WHERE user_id = ?;
   -- Should now return a mentor record
   ```
7. Refresh the page
8. The "Mentor Profile" link should NOW appear in navbar

### Manual API Testing

Using curl or Postman:

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor@test.com","password":"password123"}'

# Response will include token
# Save the token from response

# 2. Check mentor status
curl -X GET http://localhost:3000/api/mentors/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected response for mentor:
# {"isMentor":true,"mentorId":123}

# Expected response for non-mentor:
# {"isMentor":false,"mentorId":null}
```

## Server Console Output

When the fix is working correctly, you should see this in server console:

```
========================================
🔍 MENTOR STATUS API CALLED
========================================
User ID from token: 45
Request headers: { authorization: 'Present', 'content-type': undefined }
Database query result: [
  {
    "user_id": 45,
    "email": "mentor@test.com",
    "is_mentor": 1
  }
]
📊 Database Values:
  - user_id: 45
  - email: mentor@test.com
  - is_mentor (raw): 1
  - is_mentor (type): number
  - isMentor (boolean): true
✓ Mentor ID found: 123
📤 Sending response: {
  "isMentor": true,
  "mentorId": 123
}
========================================
```

## Common Issues & Troubleshooting

### Issue: API still returns 401/403
**Cause**: Token is missing or invalid
**Solution**: 
- Check that user is logged in
- Verify token in localStorage
- Check that JWT_SECRET matches between token generation and verification

### Issue: isMentor is false even though user has mentor record
**Cause**: `users.is_mentor` flag not updated when mentor profile was created
**Solution**:
```sql
-- Fix existing mentor records
UPDATE users u 
INNER JOIN mentors m ON u.user_id = m.user_id 
SET u.is_mentor = TRUE;
```

### Issue: isMentor is true but mentorId is null
**Cause**: User has `is_mentor=TRUE` but no record in `mentors` table (data inconsistency)
**Solution**:
```sql
-- Find inconsistent records
SELECT u.user_id, u.email, u.is_mentor 
FROM users u 
LEFT JOIN mentors m ON u.user_id = m.user_id 
WHERE u.is_mentor = TRUE AND m.mentor_id IS NULL;

-- Fix by setting is_mentor to FALSE
UPDATE users SET is_mentor = FALSE 
WHERE user_id IN (
  SELECT u.user_id 
  FROM users u 
  LEFT JOIN mentors m ON u.user_id = m.user_id 
  WHERE u.is_mentor = TRUE AND m.mentor_id IS NULL
);
```

### Issue: Mentor profile link still not showing
**Cause**: Frontend caching or auth.js not loaded
**Solution**:
- Clear browser cache and localStorage
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Verify api.js is loaded before auth.js in HTML
- Check browser console for JavaScript errors

## Success Criteria

The fix is successful when:

✅ **For Mentor Users:**
- API `/mentors/status` returns `{"isMentor": true, "mentorId": [number]}`
- No errors in browser console
- Mentor Profile link appears in navbar dropdown
- Clicking the link navigates to `mentor-profile.html?id=[mentorId]`

✅ **For Non-Mentor Users:**
- API `/mentors/status` returns `{"isMentor": false, "mentorId": null}`
- No errors in browser console
- Mentor Profile link does NOT appear in navbar dropdown
- Only Main Profile and Social Profile links show

✅ **For Unauthenticated Requests:**
- API returns 403 Forbidden with clear error message
- No undefined/null errors in server logs
- Graceful error handling in frontend

## Additional Notes

### Why verifyToken instead of optionalAuth?

The `/mentors/status` endpoint should ONLY be accessible to authenticated users because:
1. It reveals user-specific information (mentor status)
2. It queries the database with the user's ID from the token
3. Non-authenticated users have no need to check mentor status
4. The navbar only appears for logged-in users anyway

### Performance Considerations

The fix maintains good performance:
- Single query to `users` table (with index on `is_mentor`)
- Conditional query to `mentors` table (only if user is a mentor)
- No unnecessary joins
- Results can be cached on frontend

### Security Considerations

The fix improves security:
- Requires valid authentication token
- Prevents information leakage to unauthenticated users
- Validates token before database queries
- Follows principle of least privilege

## Related Files

- `server/api/mentors.js` - The fixed API endpoint
- `server/middleware/authMiddleware.js` - Authentication middleware
- `client/js/auth.js` - Frontend navbar code that calls the API
- `database_structure.txt` - Database schema reference
