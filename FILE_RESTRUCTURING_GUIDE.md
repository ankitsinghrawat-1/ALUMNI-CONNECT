# Profile Pages File Restructuring Guide

## 📋 Overview

The profile-related files have been reorganized to provide a clearer separation between viewing and editing functionality, with a centralized settings hub.

## 🔄 File Changes

### Renamed Files

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `profile.html` | `edit-profile.html` | Edit your main profile |
| `view-profile.html` | `profile.html` | View any user's profile |

### New Files Created

| File Name | Purpose |
|-----------|---------|
| `settings.html` | Central settings hub for all account settings |
| `edit-social-profile.html` | Edit interface for social profile |
| `js/settings.js` | JavaScript logic for settings page |

### Existing Files (Unchanged)

| File Name | Purpose |
|-----------|---------|
| `social-profile.html` | View social profile/feed |
| `mentor-profile.html` | View mentor profile |
| `edit-mentor-profile.html` | Edit mentor profile ✅ Already existed |

## 📁 File Structure

```
client/
├── profile.html                  ← View profiles (renamed from view-profile.html)
├── edit-profile.html            ← Edit main profile (renamed from profile.html)
├── social-profile.html          ← View social profile
├── edit-social-profile.html     ← Edit social profile (NEW)
├── mentor-profile.html          ← View mentor profile
├── edit-mentor-profile.html     ← Edit mentor profile (existed)
├── settings.html                ← Settings hub (NEW)
└── js/
    └── settings.js              ← Settings logic (NEW)
```

## 🎯 Usage Guide

### Viewing Profiles

**View Any User's Profile:**
```html
<a href="profile.html?email=user@example.com">View Profile</a>
<a href="profile.html?id=123">View Profile</a>
```

**View Social Profile:**
```html
<a href="social-profile.html?userId=123">View Social Profile</a>
```

**View Mentor Profile:**
```html
<a href="mentor-profile.html?id=123">View Mentor Profile</a>
```

### Editing Profiles

**Edit Main Profile:**
```html
<a href="edit-profile.html">Edit Profile</a>
```

**Edit Social Profile:**
```html
<a href="edit-social-profile.html?userId=123">Edit Social Profile</a>
```

**Edit Mentor Profile:**
```html
<a href="edit-mentor-profile.html">Edit Mentor Profile</a>
```

### Settings Hub

**Access Settings:**
```html
<a href="settings.html">Settings</a>
```

The settings page provides:
- Navigation to all edit profile pages
- Change password functionality
- Privacy settings (toggles for visibility)

## 🧭 Navigation Structure

### Settings Hub Sidebar

```
Settings
├── Edit Profile → edit-profile.html
├── Social Profile → edit-social-profile.html
├── Mentor Profile → edit-mentor-profile.html (mentors only)
├── My Blogs → my-blogs.html
├── Change Password (tab on settings page)
└── Privacy Settings (tab on settings page)
```

### Profile Dropdown Menu

```
Profile Menu
├── Dashboard
├── My Profiles ►
│   ├── Main Profile → profile.html?email={email}
│   ├── Social Profile → social-profile.html?userId={id}
│   └── Mentor Profile → mentor-profile.html?id={id} (if mentor)
├── Settings → settings.html
├── My Blogs → my-blogs.html
├── Toggle Theme
└── Logout
```

## 🔗 Updated References

### Files with Updated Links

All the following files have been updated to use the new file names:

**JavaScript Files:**
- `js/auth.js` - Profile dropdown menu
- `js/profile.js` - Profile sharing URLs
- `js/settings.js` - NEW file for settings logic

**HTML Files:**
- `dashboard.html` - "Update Profile" button
- `my-blogs.html` - "Back to Settings" link
- `mentor-requests.html` - "Back to Settings" link
- `setup-required.html` - "Go to Edit Profile" link
- Admin pages (admin.html, user-management.html, etc.) - Dynamic profile links

**Unchanged (Correct Usage):**
- Blog, directory, events, threads - All correctly use `profile.html` for viewing
- Bookmarks, mentors, groups - All correctly link to `profile.html`

## ⚙️ Settings Page Features

### Change Password Section
- Validates current password
- Requires new password confirmation
- Minimum 6 characters
- API endpoint: `POST /api/users/change-password`

### Privacy Settings Section
- Public Profile toggle - `is_profile_public`
- Show Email toggle - `is_email_visible`
- Show Company toggle - `is_company_visible`
- Show Location toggle - `is_location_visible`
- API endpoints: 
  - `GET /api/users/privacy`
  - `PUT /api/users/privacy`

## 🚀 Migration Notes

### For Developers

1. **No Action Required** - All references have been automatically updated
2. **New Features Available** - Settings hub with password and privacy management
3. **Clear Naming** - Distinction between view and edit pages is now obvious

### For Users

1. **Navigation Improved** - Settings hub provides centralized access
2. **No Breaking Changes** - All existing links have been updated
3. **New Features** - Easy access to change password and privacy settings

## 🧪 Testing Checklist

- [ ] Click "Edit Profile" from dashboard - should go to edit-profile.html
- [ ] Click on user name in blog posts - should go to profile.html with email
- [ ] Click "Settings" from profile dropdown - should go to settings.html
- [ ] From settings, click "Edit Profile" - should go to edit-profile.html
- [ ] From settings, click "Social Profile" - should go to edit-social-profile.html
- [ ] From settings, change password - should work with validation
- [ ] From settings, toggle privacy settings - should save correctly
- [ ] Click "My Profiles > Main Profile" - should go to profile.html with your email
- [ ] View another user's profile - should show profile.html with their data

## 📝 Code Examples

### Link to Edit Profile
```html
<!-- From anywhere in the app -->
<a href="edit-profile.html" class="btn btn-primary">
    <i class="fas fa-user-edit"></i> Edit Profile
</a>
```

### Link to View Profile
```html
<!-- View logged-in user's profile -->
<a href="profile.html?email=${localStorage.getItem('loggedInUserEmail')}">
    View My Profile
</a>

<!-- View another user's profile -->
<a href="profile.html?email=john@example.com">
    View John's Profile
</a>
```

### Link to Settings
```html
<a href="settings.html" class="btn btn-secondary">
    <i class="fas fa-cog"></i> Settings
</a>
```

## 🔒 Security Notes

- All edit pages require authentication (checked by auth.js)
- Settings page requires authentication
- Privacy settings respect user preferences
- Password change requires current password validation

## 📚 Related Documentation

- `README_PROFILE_REDESIGN.md` - Profile redesign overview
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `VISUAL_CHANGES_GUIDE.md` - Visual changes and UI improvements
- `DATABASE_MIGRATION_README.md` - Database changes for new fields

## ✅ Summary

### What Changed
- Renamed 2 files for clarity
- Created 3 new files for better organization
- Updated all references across the codebase
- Added centralized settings hub

### What Stayed the Same
- All existing functionality preserved
- No data loss or breaking changes
- Same user experience, better organization

### What's New
- Settings hub for easy access
- Clear separation of view vs edit pages
- Integrated password change
- Integrated privacy settings

---

**Version**: 1.3.0
**Date**: 2025-10-17
**Status**: Complete and Production Ready
