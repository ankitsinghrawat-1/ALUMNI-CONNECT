# Social Feed Testing Guide

This guide helps you verify that all social feed features are working correctly after the fixes.

## Prerequisites

1. Start the backend server
2. Log in to the application
3. Have at least 2-3 test threads created

---

## Feature Testing Checklist

### ✅ 1. Emoji Picker

#### Test on Add Thread Page (`add-thread.html`)
- [ ] Click the emoji button (😊) in the toolbar
- [ ] Emoji picker popup appears
- [ ] Click different category tabs (smileys, gestures, hearts, etc.)
- [ ] Search for emojis using the search box
- [ ] Click an emoji
- [ ] Emoji is inserted into content textarea at cursor position
- [ ] Character count updates

#### Test on Add Story Page (`add-story.html`)
- [ ] Emoji button appears in story text area
- [ ] Emoji picker works the same way as add-thread

#### Test on Thread Detail Comments (`thread-detail.html`)
- [ ] Navigate to any thread
- [ ] Emoji button appears in comment textarea
- [ ] Emoji picker works for comments

**Expected Result:** Emoji picker should work smoothly with no console errors.

---

### ✅ 2. Autocomplete

#### Test @Mentions (`add-thread.html`)
- [ ] Type `@` in the mentions input field
- [ ] Start typing a user name
- [ ] Autocomplete dropdown appears
- [ ] User suggestions are displayed
- [ ] Arrow keys navigate suggestions
- [ ] Enter key selects suggestion
- [ ] Selected user is added to mentions

#### Test #Hashtags (`add-thread.html`)
- [ ] Type `#` in the hashtags input field
- [ ] Start typing a hashtag
- [ ] Autocomplete dropdown appears
- [ ] Hashtag suggestions are displayed
- [ ] Selection works

**Expected Result:** Autocomplete should show suggestions and allow keyboard/mouse selection.

---

### ⚠️ 3. Reactions System

#### Test on Thread Cards (`threads.html`)
- [ ] Hover over a thread card
- [ ] Reaction buttons appear
- [ ] Click a reaction (like, love, celebrate, etc.)
- [ ] Reaction count increases
- [ ] Reaction is highlighted
- [ ] Click again to remove reaction
- [ ] Count decreases

**Check Console:** If reactions don't work, check if there are API errors.

---

### ⚠️ 4. Bookmarks

#### Test Bookmark Button
- [ ] Look for bookmark icon on thread cards
- [ ] Click bookmark button
- [ ] Visual feedback appears (filled bookmark icon)
- [ ] Click again to remove bookmark
- [ ] Icon returns to outline

**Check Console:** If bookmarks don't work, check if there are API errors.

---

### ⚠️ 5. Dark Mode

#### Test Theme Toggle
- [ ] Look for dark mode toggle button (moon/sun icon)
- [ ] Click to toggle dark mode
- [ ] Page background changes to dark
- [ ] Text colors invert appropriately
- [ ] Thread cards have dark background
- [ ] Toggle again to return to light mode
- [ ] Refresh page - theme persists

**Expected Result:** Entire page should switch themes smoothly.

---

### ⚠️ 6. Keyboard Shortcuts

#### Test Shortcuts
- [ ] Press `Ctrl+K` (or `Cmd+K` on Mac)
  - Search input should get focus
- [ ] Press `Ctrl+N` (or `Cmd+N` on Mac)
  - Should navigate to add-thread.html
- [ ] Press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
  - Should navigate to add-story.html

**Expected Result:** All shortcuts should work without page reload.

---

### ⚠️ 7. Lazy Loading

#### Test Image Loading
- [ ] Clear browser cache
- [ ] Load threads.html
- [ ] Open DevTools Network tab
- [ ] Scroll down slowly
- [ ] Images should load as you scroll near them
- [ ] Check network tab - images load on-demand

**Expected Result:** Images below the fold should not load until scrolled into view.

---

### ⚠️ 8. Media Lightbox

#### Test Lightbox
- [ ] Go to threads.html
- [ ] Find a thread with an image
- [ ] Click on the image
- [ ] Lightbox opens with full-size image
- [ ] Background is dark overlay
- [ ] Close button (X) appears in top-right
- [ ] Click X to close
- [ ] Click outside image to close

**Expected Result:** Lightbox should open/close smoothly with no errors.

---

### ⚠️ 9. Share Functionality

#### Test Share Button
- [ ] Find share button on thread card
- [ ] Click share button
- [ ] Share modal appears
- [ ] "Copy Link" button is present
- [ ] Click "Copy Link"
- [ ] Link is copied to clipboard
- [ ] Success message appears
- [ ] Close modal

**Expected Result:** Share modal works and copies thread URL.

---

### ⚠️ 10. Filter Panel

#### Test Filters (`threads.html`)
- [ ] Click filter button (funnel icon)
- [ ] Filter panel slides down/appears
- [ ] Change "Sort by" dropdown (Latest, Popular, Trending)
- [ ] Threads re-order according to selection
- [ ] Change "Time range" dropdown
- [ ] Threads filter by time
- [ ] Click filter button again to hide panel

**Expected Result:** Filters work and update thread display.

---

### ⚠️ 11. Infinite Scroll

#### Test Auto-Load (`threads.html`)
- [ ] Scroll to bottom of feed
- [ ] "Load more" indicator appears
- [ ] New threads load automatically
- [ ] No page reload
- [ ] Scroll more and more threads load
- [ ] Loading spinner shows during load

**Expected Result:** Threads load automatically as you scroll.

---

### ⚠️ 12. Search with Debounce

#### Test Search (`threads.html`)
- [ ] Type in search box
- [ ] Wait 300ms (0.3 seconds)
- [ ] Search executes
- [ ] Threads filter to match search
- [ ] Type more characters
- [ ] Previous search cancels
- [ ] New search executes after delay

**Expected Result:** Search doesn't execute on every keystroke, waits for pause.

---

### ⚠️ 13. Skeleton Loaders

#### Test Loading States
- [ ] Reload threads.html
- [ ] Skeleton cards appear while loading
- [ ] Animated shimmer effect
- [ ] Skeleton cards disappear when data loads
- [ ] Real thread cards appear

**Expected Result:** Smooth transition from skeleton to real content.

---

### ⚠️ 14. Toast Notifications

#### Test Notifications
- [ ] Perform actions that trigger notifications:
  - Create a new thread
  - React to a thread
  - Bookmark a thread
  - Share a thread
- [ ] Toast notification appears
- [ ] Has appropriate icon and color
- [ ] Auto-dismisses after 3 seconds
- [ ] Can be manually dismissed

**Expected Result:** Toast appears for user actions with feedback.

---

## Common Issues & Solutions

### Issue: Emoji picker not appearing
**Solution:** Check browser console for JavaScript errors. Ensure `EmojiPicker` class is defined.

### Issue: Autocomplete not working
**Solution:** Check if API endpoints exist for user/hashtag search. Look for 404 errors in Network tab.

### Issue: Reactions not saving
**Solution:** Backend API endpoint `/api/reactions` may not exist. Check Network tab for errors.

### Issue: Dark mode not persisting
**Solution:** Check if `localStorage.setItem('theme', ...)` is being called. Check browser localStorage.

### Issue: Images not lazy loading
**Solution:** Ensure `IntersectionObserver` is supported in browser. Check for polyfill if needed.

---

## Reporting Issues

If any test fails, please report:

1. **Feature name** that failed
2. **Browser** and version
3. **Console errors** (screenshot)
4. **Network errors** (screenshot of Network tab)
5. **Steps to reproduce**

---

## API Endpoint Verification

Check if these endpoints exist on your backend:

### Required for Full Functionality:
- `GET /api/threads` - List threads
- `POST /api/threads` - Create thread
- `GET /api/threads/:id` - Get thread detail
- `POST /api/comments` - Add comment
- `POST /api/reactions` - Add reaction (may be missing)
- `DELETE /api/reactions/:id` - Remove reaction (may be missing)
- `POST /api/bookmarks` - Add bookmark (may be missing)
- `DELETE /api/bookmarks/:id` - Remove bookmark (may be missing)
- `GET /api/users/search?q=` - Search users for @mentions (may be missing)
- `GET /api/hashtags/search?q=` - Search hashtags (may be missing)

### How to Check:
1. Open Browser DevTools
2. Go to Network tab
3. Perform actions
4. Look for API calls
5. Check response status (200 = OK, 404 = Not Found, 500 = Server Error)

---

*Happy Testing! 🚀*
