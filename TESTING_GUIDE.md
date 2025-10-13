# Manual Testing Guide for Mentor Loading Fixes

## Prerequisites
1. Set up a MySQL database with the required schema
2. Create a `.env` file with database credentials
3. Install dependencies: `npm install`
4. Start the server: `npm start`

## Test Scenarios

### Scenario 1: Browse Mentors as Guest (Not Logged In)

**Steps:**
1. Open a browser in incognito/private mode
2. Navigate to `http://localhost:3000/browse-mentors.html`

**Expected Results:**
- ✓ Page loads successfully
- ✓ Loading spinner appears briefly then disappears
- ✓ Mentors are displayed in a grid
- ✓ "Sign In to Connect" button is shown in the action area
- ✓ No errors in the browser console

**What was broken before:**
- Loading spinner would keep spinning indefinitely
- `/mentors/status` endpoint would return 403 error
- Mentors list might not load

---

### Scenario 2: Browse Mentors as Regular User (Not a Mentor)

**Steps:**
1. Log in as a regular user (not registered as a mentor)
2. Navigate to `http://localhost:3000/browse-mentors.html`

**Expected Results:**
- ✓ Page loads successfully
- ✓ Loading spinner appears briefly then disappears
- ✓ Mentors are displayed in a grid
- ✓ "Become a Mentor" button is shown in the action area
- ✓ Can click on mentor cards to view their profiles
- ✓ Can send mentorship requests to mentors

**What was broken before:**
- Loading spinner might keep spinning
- Status check might fail silently

---

### Scenario 3: Browse Mentors as Existing Mentor

**Steps:**
1. Log in as a user who is already registered as a mentor
2. Navigate to `http://localhost:3000/browse-mentors.html`

**Expected Results:**
- ✓ Page loads successfully
- ✓ Loading spinner appears briefly then disappears
- ✓ Mentors are displayed in a grid
- ✓ "Your Mentor Profile" button is shown (NOT "Become a Mentor")
- ✓ "Requests" button is also shown
- ✓ Can click "Your Mentor Profile" to view own profile

**What was broken before:**
- "Become a Mentor" button might show instead of "Your Mentor Profile"
- Status check would fail, preventing proper button display

---

### Scenario 4: View Own Mentor Profile

**Steps:**
1. Log in as a mentor
2. Navigate to `http://localhost:3000/browse-mentors.html`
3. Click "Your Mentor Profile" button
   OR directly navigate to `http://localhost:3000/mentor-profile.html?id=YOUR_MENTOR_ID`

**Expected Results:**
- ✓ Profile page loads successfully
- ✓ All profile information is displayed correctly
- ✓ "Edit Profile" button is visible at the top
- ✓ Small edit icons appear next to each section heading
- ✓ Clicking "Edit Profile" switches to edit mode
- ✓ Can update profile fields and save changes

**What was working before:**
- This functionality was already implemented correctly

---

### Scenario 5: View Another Mentor's Profile

**Steps:**
1. Log in as any user
2. Navigate to `http://localhost:3000/browse-mentors.html`
3. Click on any mentor card (not your own)

**Expected Results:**
- ✓ Mentor's profile is displayed in a modal or new page
- ✓ "Send Request" button is shown (NOT "Edit Profile")
- ✓ Can send a mentorship request
- ✓ Cannot edit the profile

---

## API Endpoint Tests

### Test `/mentors/status` Without Authentication

```bash
curl -X GET http://localhost:3000/api/mentors/status
```

**Expected Response:**
```json
{
  "isMentor": false,
  "mentorId": null
}
```

---

### Test `/mentors/status` With Valid Authentication

```bash
curl -X GET http://localhost:3000/api/mentors/status \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"
```

**Expected Response (if user is a mentor):**
```json
{
  "isMentor": true,
  "mentorId": 123
}
```

**Expected Response (if user is not a mentor):**
```json
{
  "isMentor": false,
  "mentorId": null
}
```

---

### Test `/mentors` Endpoint (List Mentors)

```bash
curl -X GET http://localhost:3000/api/mentors
```

**Expected Response:**
```json
{
  "mentors": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "pages": 5
  },
  "filters": {...}
}
```

---

## Browser Console Checks

Open the browser's developer tools (F12) and check the Console and Network tabs:

### Expected Console Logs (browse-mentors.js)
```
checkMentorStatus - loggedInUserEmail: (email or null)
Mentor status response: {isMentor: false, mentorId: null}
Is mentor? false
Mentor ID: null
User is NOT a mentor - showing Become a Mentor button
```

### Expected Network Requests
1. `GET /api/mentors/status` - Status: 200 OK
2. `GET /api/mentors?page=1&limit=12&sort=rating&order=desc` - Status: 200 OK
3. `GET /api/mentors/stats/overview` - Status: 200 OK

### No Errors Should Appear
- ❌ No 403 Forbidden errors
- ❌ No 401 Unauthorized errors
- ❌ No "Unauthorized: Invalid token" messages

---

## Troubleshooting

### Issue: Loading spinner keeps spinning
**Check:**
1. Open browser console for JavaScript errors
2. Check Network tab for failed API requests
3. Verify the server is running and accessible
4. Check if `.env` file has correct database credentials

### Issue: "Become a Mentor" shows for existing mentors
**Check:**
1. Verify the user is actually registered in the `mentors` table
2. Check browser console for the status check response
3. Verify the token is being sent in the Authorization header

### Issue: 403 or 401 errors
**Check:**
1. This should NOT happen with the new fixes
2. If it does, verify you're using the latest code
3. Check that `optionalAuth` is imported and used in `mentors.js`

---

## Code Review Checklist

Before marking as complete:

- [ ] `optionalAuth` middleware is defined in `authMiddleware.js`
- [ ] `optionalAuth` is exported from `authMiddleware.js`
- [ ] `/status` endpoint uses `optionalAuth` middleware
- [ ] `/status` endpoint is before `router.use(verifyToken)`
- [ ] No duplicate `/status` endpoints exist
- [ ] All mentor list pages (browse-mentors.html, mentors.html) load successfully
- [ ] "Edit Profile" button appears on own mentor profile
- [ ] Correct action buttons show based on user status
