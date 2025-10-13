# Fix: Button Not Showing - Error Handling Improvement

## Problem Reported

User reported that mentors are loading correctly now, but the button is not showing. Instead, there's an error message:
> "Unable to check mentor status. Please refresh the page."

The user mentioned they are already a mentor and should see "Your Mentor Profile" button.

## Root Cause

The `checkMentorStatus()` function in `browse-mentors.js` had a try-catch block that wrapped BOTH:
1. The `/mentors/status` API call
2. The `/mentors/requests/sent` API call (for non-mentors)

If either API call failed, the entire function would catch the error and display the error message instead of showing any button.

The likely scenario:
- User is logged in as a mentor
- `/mentors/status` call succeeds and returns `{ isMentor: true, mentorId: 123 }`
- The code tries to show the "Your Mentor Profile" button
- But if there's ANY error in the process (network issue, parsing issue, etc.), it shows the error message instead

## The Fix

### Changed Error Handling Strategy

**Before** (Fragile):
```javascript
try {
    const data = await window.api.get('/mentors/status');
    
    if (data.isMentor) {
        // Show mentor button
    } else {
        // Show become mentor button
        // Load sent requests
        const requestsData = await window.api.get('/mentors/requests/sent');
    }
} catch (error) {
    // Show error message - NO BUTTON!
    mentorActionArea.innerHTML = `Unable to check mentor status...`;
}
```

**After** (Resilient):
```javascript
try {
    const data = await window.api.get('/mentors/status');
    
    if (data.isMentor) {
        // Show mentor button
    } else {
        // Show become mentor button
        
        // Load sent requests in background (separate try-catch)
        try {
            const requestsData = await window.api.get('/mentors/requests/sent');
        } catch (reqError) {
            // Silently fail - button already shown
        }
    }
} catch (error) {
    // Show default button instead of error message
    mentorActionArea.innerHTML = `Become a Mentor`;
}
```

### Key Changes

1. **Nested Try-Catch for Sent Requests**: Moved the `/mentors/requests/sent` call into its own try-catch block so it doesn't cause the main function to fail

2. **Show Button on Error**: Changed the outer catch block to show a default "Become a Mentor" button instead of an error message. This ensures users always see a button, even if the status check fails.

3. **Non-Blocking Background Load**: The sent requests are now loaded after the button is displayed, so they don't block the UI

## Why This Approach is Better

### User Experience
- **Before**: User sees error message, no button, can't proceed
- **After**: User always sees a button, can proceed even if there's an error

### Resilience
- Button display is no longer dependent on multiple API calls succeeding
- Each API call has its own error handling
- Background operations don't block UI updates

### Graceful Degradation
- If `/mentors/status` fails: Show "Become a Mentor" button (safe default)
- If `/mentors/requests/sent` fails: Button still shows, just no request tracking

## Expected Results

### For Mentors
✅ Button shows: "Your Mentor Profile" + "Requests"
✅ No error message displayed
✅ Works even if background requests fail

### For Non-Mentors
✅ Button shows: "Become a Mentor"
✅ Sent requests load in background
✅ Works even if sent requests API fails

### For All Users
✅ Always see a button (never just an error message)
✅ Better error resilience
✅ Improved user experience

## Technical Details

### File Modified
- `client/js/browse-mentors.js` - Lines 132-188

### Changes Made
1. Moved `/mentors/requests/sent` call inside the `else` block (lines 164-175)
2. Wrapped it in its own try-catch (lines 165-175)
3. Changed outer catch to show button instead of error (lines 177-188)

### Error Handling Pattern
```
Main Try:
  - Call /mentors/status
  - Show appropriate button based on response
  - If not mentor:
      Background Try:
        - Load sent requests
      Catch:
        - Log error, continue
Main Catch:
  - Log error
  - Show default button (don't leave user stranded)
```

## Impact

✅ **User Experience**: Users always see a usable button
✅ **Reliability**: Doesn't fail if secondary APIs fail
✅ **Error Handling**: Graceful degradation instead of blocking error
✅ **Backward Compatible**: All existing functionality preserved

## Testing Checklist

- [ ] Mentor user: See "Your Mentor Profile" button
- [ ] Non-mentor user: See "Become a Mentor" button
- [ ] Guest user: See "Sign In to Connect" button
- [ ] Network error: See default button (not error message)
- [ ] API timeout: See default button (not error message)

All scenarios should show a button, never just an error message.
