# Mentor Loading Issues - Fixes Summary

## Problems Identified

1. **Mentors not loading**: The `/mentors/status` endpoint required authentication (via `verifyToken` middleware), but was being called before the user was authenticated, causing the request to fail with a 403 error.

2. **Loading spinner keeps spinning**: When the status check failed, the browse-mentors page would get stuck in a loading state because the error wasn't being handled properly.

3. **"Become a Mentor" button showing for existing mentors**: This was a consequence of the status check failing - the page couldn't determine if the user was already a mentor.

4. **Mentor profile edit button**: This was already implemented correctly in `mentor-profile.js` (line 396-399).

## Solutions Implemented

### 1. Created `optionalAuth` Middleware

**File**: `server/middleware/authMiddleware.js`

Added a new middleware function that allows requests to proceed regardless of authentication status:
- If a valid token is provided, it sets `req.user` with the decoded user data
- If no token or an invalid token is provided, it sets `req.user = null` and continues
- This allows endpoints to work for both authenticated and unauthenticated users

### 2. Moved `/status` Endpoint Before `verifyToken`

**File**: `server/api/mentors.js`

- Moved the `/status` endpoint (line 382) to before the `router.use(verifyToken)` middleware (line 409)
- Applied the `optionalAuth` middleware to the `/status` endpoint
- Removed the duplicate `/status` endpoint that was after the `verifyToken` middleware

### 3. Route Organization

The mentor routes are now organized as follows:

**Public Routes** (Before line 409):
- `GET /` - List mentors (line 9)
- `GET /:mentorId` - Get mentor details (line 216)
- `GET /stats/overview` - Get mentor statistics (line 342)
- `GET /status` - Check if user is a mentor (line 382) - uses `optionalAuth`

**Protected Routes** (After line 409):
- `POST /` - Register as a mentor
- `PUT /profile` - Update mentor profile
- `GET /requests` - Get mentorship requests
- All other POST, PUT, DELETE operations

## Testing

To verify the fixes work correctly:

1. **Without authentication**:
   - Visit `/browse-mentors.html` without logging in
   - The page should load successfully
   - Mentors should be displayed
   - "Sign In to Connect" button should be shown

2. **With authentication (non-mentor)**:
   - Log in as a regular user
   - Visit `/browse-mentors.html`
   - Mentors should be displayed
   - "Become a Mentor" button should be shown

3. **With authentication (existing mentor)**:
   - Log in as a mentor
   - Visit `/browse-mentors.html`
   - Mentors should be displayed
   - "Your Mentor Profile" button should be shown (NOT "Become a Mentor")
   - Clicking "Your Mentor Profile" should show the mentor's profile
   - An "Edit Profile" button should be visible on the profile page

## Files Changed

1. `server/middleware/authMiddleware.js` - Added `optionalAuth` middleware
2. `server/api/mentors.js` - Reorganized routes and applied `optionalAuth` to `/status` endpoint

## Expected Behavior

After these fixes:
- The browse-mentors page should load successfully for all users (logged in or not)
- The loading spinner should disappear once mentors are loaded
- The correct action buttons should be displayed based on user status
- Existing mentors should see their profile button, not "Become a Mentor"
- The mentor profile page should show an "Edit Profile" button for the profile owner
