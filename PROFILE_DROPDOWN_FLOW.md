# Profile Dropdown Flow Diagram

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVBAR                                   │
│  ┌──────┐  ┌───────┐  ┌──────────┐  ┌───────┐  ┌──────────┐   │
│  │About │  │Connect│  │ Resources│  │  🔔   │  │  👤      │   │
│  └──────┘  └───────┘  └──────────┘  └───────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                                       │
                                                       │ Click
                                                       ▼
                                         ┌──────────────────────┐
                                         │  Profile Dropdown    │
                                         ├──────────────────────┤
                                         │ 📊 Dashboard         │
                                         │ 👤 My Profiles  →    │─────┐
                                         │ ✏️  My Blogs         │     │
                                         │ ──────────────       │     │
                                         │ 🌙 Toggle Theme      │     │
                                         │ 🚪 Logout            │     │
                                         └──────────────────────┘     │
                                                                      │
                                                                      │ Click/Hover
                                                                      ▼
                                                        ┌──────────────────────────┐
                                                        │   Profile Submenu        │
                                                        ├──────────────────────────┤
                                                        │ ✏️  Main Profile         │
                                                        │ 🆔 Social Profile        │
                                                        │ 👨‍🏫 Mentor Profile*       │
                                                        └──────────────────────────┘
                                                                 * Only for mentors
```

## Technical Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Page Load (auth.js)                                │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  1. Check if user is logged in (token exists)                           │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  2. Get user info from localStorage                                     │
│     - userName                                                           │
│     - userId                                                             │
│     - userRole                                                           │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  3. Fetch mentor status via API                                         │
│     GET /api/mentors/status                                             │
└────────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
          Is Mentor?                    Not Mentor
                    │                   │
                    ▼                   ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │ mentorProfileLink =  │   │ mentorProfileLink =  │
    │ <mentor link HTML>   │   │ '' (empty)           │
    └─────────────────────┘   └─────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  4. Build navbar HTML with nested dropdown                              │
│     - Include Main Profile link                                         │
│     - Include Social Profile link with userId                           │
│     - Include Mentor Profile link if mentorProfileLink is not empty     │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  5. Attach event listeners                                              │
│     - Dropdown toggle handlers                                          │
│     - Submenu toggle handlers                                           │
│     - Click-outside-to-close handler                                    │
└────────────────────────────────────────────────────────────────────────┘
```

## Conditional Rendering Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mentor Status Check                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Call API         │
                    │ /mentors/status  │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            Success                    Error
                    │                   │
                    ▼                   ▼
        ┌────────────────────┐   ┌──────────────┐
        │ Check isMentor     │   │ Log error    │
        │ & mentorId         │   │ Continue     │
        └────────────────────┘   └──────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
     isMentor=true          isMentor=false
     mentorId=123           mentorId=null
        │                        │
        ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│ Show 3 options: │      │ Show 2 options:  │
│ • Main Profile  │      │ • Main Profile   │
│ • Social        │      │ • Social         │
│ • Mentor ✅     │      │                  │
└─────────────────┘      └──────────────────┘
```

## User Scenarios

### Scenario 1: Regular User (Not a Mentor)
```
User → Clicks Profile Pic → Sees Dropdown → Clicks "My Profiles"
                                                    ↓
                                           Sees 2 Options:
                                           • Main Profile
                                           • Social Profile
```

### Scenario 2: Mentor User
```
User → Clicks Profile Pic → Sees Dropdown → Clicks "My Profiles"
                                                    ↓
                                           Sees 3 Options:
                                           • Main Profile
                                           • Social Profile
                                           • Mentor Profile ⭐
```

### Scenario 3: API Failure
```
User → Clicks Profile Pic → Sees Dropdown → Clicks "My Profiles"
                                                    ↓
                                           Sees 2 Options:
                                           • Main Profile
                                           • Social Profile
                                           (Mentor link hidden due to error)
```

## Navigation Paths

### Main Profile
```
Click "Main Profile" → Navigate to profile.html
                     → User can edit their basic information
```

### Social Profile
```
Click "Social Profile" → Navigate to social-profile.html?userId=123
                       → User sees their social/public profile view
                       → Same view others see when visiting their profile
```

### Mentor Profile (Mentors Only)
```
Click "Mentor Profile" → Navigate to mentor-profile.html?id=456
                       → User sees their mentor-specific profile
                       → Shows expertise, ratings, availability, etc.
```

## CSS Cascade

```
.nav-dropdown
    └── .dropdown-menu
            ├── li (Dashboard)
            ├── li.profile-submenu
            │       └── .dropdown-menu (nested)
            │               ├── li (Main Profile)
            │               ├── li (Social Profile)
            │               └── li (Mentor Profile - conditional)
            ├── li (My Blogs)
            ├── hr.dropdown-divider
            ├── li > button (Toggle Theme)
            └── li > button (Logout)
```

## Event Handling Flow

```
┌──────────────────────────────────────────────────────────────┐
│              User Clicks Profile Picture                      │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Event: click on .dropdown-toggle                             │
│  Handler: Toggle parent .nav-dropdown                         │
│  Result: Profile dropdown becomes visible                     │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              User Clicks "My Profiles"                        │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Event: click on nested .dropdown-toggle                      │
│  Handler: Check if parent has .profile-submenu class          │
│  Result: Toggle only the submenu (don't close parent)         │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│           Submenu appears to the right                        │
│           Shows Main, Social, Mentor (if applicable)          │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              User Clicks Outside                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Event: click on window                                       │
│  Handler: Remove .dropdown-active from all dropdowns          │
│  Result: All dropdowns close                                  │
└──────────────────────────────────────────────────────────────┘
```
