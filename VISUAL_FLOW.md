# Visual Flow Diagram of the Fix

## Before the Fix

```
User visits browse-mentors.html
    ↓
JavaScript calls /mentors/status
    ↓
    ┌─────────────────────────────┐
    │  API Request to Server      │
    │  (No token or invalid token)│
    └─────────────┬───────────────┘
                  ↓
    ┌─────────────────────────────┐
    │  verifyToken Middleware     │
    │  Checks: req.headers['auth']│
    └─────────────┬───────────────┘
                  ↓
            No token found
                  ↓
    ┌─────────────────────────────┐
    │  ❌ Returns 403 Forbidden   │
    │  "No token provided"        │
    └─────────────┬───────────────┘
                  ↓
    ┌─────────────────────────────┐
    │  Frontend receives error    │
    │  Loading spinner keeps      │
    │  spinning forever...        │
    └─────────────────────────────┘
```

## After the Fix

```
User visits browse-mentors.html
    ↓
JavaScript calls /mentors/status
    ↓
    ┌─────────────────────────────┐
    │  API Request to Server      │
    │  (No token or invalid token)│
    └─────────────┬───────────────┘
                  ↓
    ┌─────────────────────────────┐
    │  optionalAuth Middleware    │
    │  No token? Set req.user=null│
    │  Continue to endpoint...    │
    └─────────────┬───────────────┘
                  ↓
    ┌─────────────────────────────┐
    │  /status Endpoint           │
    │  if (!req.user)             │
    │    return {isMentor: false} │
    └─────────────┬───────────────┘
                  ↓
    ┌─────────────────────────────┐
    │  ✓ Returns 200 OK           │
    │  {isMentor: false,          │
    │   mentorId: null}           │
    └─────────────┬───────────────┘
                  ↓
    ┌─────────────────────────────┐
    │  Frontend processes response│
    │  Shows correct button       │
    │  Loading stops ✓            │
    └─────────────────────────────┘
```

## Route Organization

### Public Routes (No Authentication Required)
```
┌──────────────────────────────────────────┐
│  Public Routes (Lines 9-406)             │
├──────────────────────────────────────────┤
│  GET  /                                  │
│  GET  /:mentorId                         │
│  GET  /stats/overview                    │
│  GET  /status (with optionalAuth)        │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│  router.use(verifyToken)  [Line 409]    │
│  ⚠️ Everything after requires auth       │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│  Protected Routes (Lines 410+)           │
├──────────────────────────────────────────┤
│  POST /                                  │
│  PUT  /profile                           │
│  GET  /requests                          │
│  POST /requests/:requestId/respond       │
│  ... and more                            │
└──────────────────────────────────────────┘
```

## Button Display Logic

### For Non-Logged-In Users
```
┌─────────────────┐
│  User State:    │
│  Not logged in  │
└────────┬────────┘
         ↓
    /status returns
    {isMentor: false}
         ↓
┌─────────────────────┐
│  Button Displayed:  │
│  "Sign In to        │
│   Connect"          │
└─────────────────────┘
```

### For Logged-In Non-Mentors
```
┌─────────────────┐
│  User State:    │
│  Logged in but  │
│  not a mentor   │
└────────┬────────┘
         ↓
    /status returns
    {isMentor: false}
         ↓
┌─────────────────────┐
│  Button Displayed:  │
│  "Become a Mentor"  │
└─────────────────────┘
```

### For Existing Mentors
```
┌─────────────────┐
│  User State:    │
│  Logged in AND  │
│  is a mentor    │
└────────┬────────┘
         ↓
    /status returns
    {isMentor: true,
     mentorId: 123}
         ↓
┌─────────────────────────┐
│  Buttons Displayed:     │
│  "Your Mentor Profile"  │
│  "Requests"             │
└─────────────────────────┘
```

## Middleware Comparison

### verifyToken (Strict)
```javascript
if (!authHeader) {
    return res.status(403).json({ 
        message: 'No token provided.' 
    });
}
// ❌ Stops request if no token
```

### optionalAuth (Permissive)
```javascript
if (!authHeader) {
    req.user = null;
    return next();
}
// ✓ Continues with req.user = null
```

## File Changes Summary

```
server/middleware/authMiddleware.js
├─ Added: optionalAuth function (26 lines)
└─ Modified: module.exports to include optionalAuth

server/api/mentors.js
├─ Modified: Import to include optionalAuth
├─ Moved: /status endpoint to line 382 (before verifyToken)
├─ Modified: /status to use optionalAuth middleware
└─ Removed: Duplicate /status endpoint (was after verifyToken)
```

## Expected User Experience

### Scenario Matrix

| User Type          | Logged In? | isMentor? | Button Shown              |
|--------------------|------------|-----------|---------------------------|
| Guest              | No         | N/A       | "Sign In to Connect"      |
| Regular User       | Yes        | No        | "Become a Mentor"         |
| Existing Mentor    | Yes        | Yes       | "Your Mentor Profile"     |

### Loading Behavior

```
Page Load
    ↓
[Loading Spinner Shows]
    ↓
API Call: /mentors/status
    ↓
[Response Received: 200 OK]
    ↓
Update UI with correct button
    ↓
API Call: /mentors (list)
    ↓
[Response Received: 200 OK]
    ↓
Display mentors in grid
    ↓
[Loading Spinner Hides]
    ↓
Page Ready ✓
```

## Mentor Profile Edit Button

The edit button was already implemented:

```
Mentor visits own profile
    ↓
Check: currentUserId === mentor.user_id
    ↓
If true (isOwner = true)
    ↓
┌─────────────────────────────────┐
│  Buttons shown:                 │
│  ┌───────────────────────────┐  │
│  │  📝 Edit Profile          │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  📬 View Requests         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  🗑️  Delete Profile        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

This functionality was already working correctly and required no changes.
