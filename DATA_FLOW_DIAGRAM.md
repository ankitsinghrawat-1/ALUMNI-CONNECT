# Data Flow: Role Badge Display

This document shows how the role badge information flows from database to UI after the fix.

## Flow Diagram

```
┌──────────────┐
│   Database   │
│  (MySQL)     │
│              │
│ users table  │
│  ├─ role     │  ← Existing field (alumni/student/faculty/employer/institute/admin)
│  ├─ name     │
│  └─ ...      │
└──────┬───────┘
       │
       │ SELECT ... role ... WHERE ... AND role != 'admin'
       ↓
┌──────────────────────────────┐
│  Server API                  │
│  /users/directory            │
│  (server/api/users.js)       │
│                              │
│  1. Query database           │
│  2. Filter admin users       │ ← NEW: Server-side filtering
│  3. Map response             │
│  4. Include 'role' field     │ ← NEW: Include role in response
└──────────────┬───────────────┘
               │
               │ JSON Response: { role: "student", ... }
               ↓
┌──────────────────────────────┐
│  Client JavaScript           │
│  (client/js/directory.js)    │
│                              │
│  1. Fetch alumni data        │
│  2. Extract role field       │ ← FIXED: Now uses actual role
│  3. Map to roleConfig        │
│  4. Generate badge HTML      │
└──────────────┬───────────────┘
               │
               │ Badge: <div class="role-badge" style="background: #10b981">
               ↓                      <i class="fas fa-graduation-cap"></i>
┌──────────────────────────────┐      <span>Student</span>
│  Browser (UI)                │  </div>
│                              │
│  ┌────────────────────────┐  │
│  │ [Photo]  John Doe      │  │
│  │          Student       │  │
│  │          Badge: 🎓     │  │ ← Badge displays correctly!
│  │          Student       │  │   (Green color for student)
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## Before Fix (BROKEN)

```
Database (users table)
└─ role: "student"
        ↓
Server API (/users/directory)
└─ Does NOT include 'role' field ❌
        ↓ JSON: { name: "John", email: "..." }
Client JavaScript
└─ alumnus.role is undefined
└─ Falls back to: role = 'alumni' ❌
        ↓
Browser displays: Badge: 🎓 Alumni (WRONG!)
```

## After Fix (WORKING)

```
Database (users table)
└─ role: "student"
        ↓
Server API (/users/directory)
├─ Includes 'role' in SELECT ✅
├─ Filters admin users ✅
└─ Includes 'role' in response ✅
        ↓ JSON: { name: "John", role: "student", ... }
Client JavaScript
└─ alumnus.role = "student" ✅
└─ Maps to roleConfig.student ✅
└─ Badge: color=#10b981, icon=graduation-cap ✅
        ↓
Browser displays: Badge: 🎓 Student (CORRECT!)
```

## Code Locations

### 1. Database Query (Server)
**File**: `server/api/users.js`
**Line**: 106-107

```javascript
let sql = `SELECT user_id, full_name, email, ..., role, ...
           FROM users 
           WHERE is_profile_public = TRUE AND role != 'admin'`;
           //                                  ^^^^^^^^^^^^^^^^ Admin filter
           //                           ^^^^ Role included
```

### 2. Response Mapping (Server)
**File**: `server/api/users.js`
**Line**: 147

```javascript
const publicProfiles = rows.map(user => ({
    user_id: user.user_id,
    full_name: user.full_name,
    // ... other fields
    role: user.role, // ← Include role in response
}));
```

### 3. Role Extraction (Client)
**File**: `client/js/directory.js`
**Line**: 526

```javascript
const mappedAlumnus = {
    full_name: alumnus.full_name,
    // ... other fields
    role: alumnus.role || 'alumni' // ← Use role from API
};
```

### 4. Role Mapping (Client)
**File**: `client/js/directory.js`
**Line**: 128, 137

```javascript
const role = (alumnus.role || 'alumni').toLowerCase();
const userRole = roleConfig[role] || roleConfig.alumni;
```

### 5. Badge Rendering (Client)
**File**: `client/js/directory.js`
**Line**: 232-235

```javascript
<div class="role-badge" 
     style="background: ${userRole.color};" 
     title="${userRole.label}">
    <i class="fas ${userRole.icon}"></i>
    <span>${userRole.label}</span>
</div>
```

## Role Configuration

**File**: `client/js/directory.js`
**Line**: 129-136

```javascript
const roleConfig = {
    alumni: { 
        label: 'Alumni', 
        icon: 'fa-user-graduate', 
        color: '#667eea' // Purple
    },
    student: { 
        label: 'Student', 
        icon: 'fa-graduation-cap', 
        color: '#10b981' // Green
    },
    faculty: { 
        label: 'Faculty', 
        icon: 'fa-chalkboard-teacher', 
        color: '#f59e0b' // Orange
    },
    employer: { 
        label: 'Employer', 
        icon: 'fa-building', 
        color: '#ef4444' // Red
    },
    institute: { 
        label: 'Institute', 
        icon: 'fa-university', 
        color: '#8b5cf6' // Purple
    },
    admin: { 
        label: 'Admin', 
        icon: 'fa-user-shield', 
        color: '#dc2626' // Red (not used - admins filtered)
    }
};
```

## Security Enhancement

### Before: Client-Side Filtering (INSECURE)
```javascript
// Client filters admin users after receiving data
const filteredAlumni = alumni.filter(alumnus => 
    alumnus.role !== 'admin'
);
// Problem: Data was still sent to client
```

### After: Server-Side Filtering (SECURE)
```sql
-- Server never sends admin users
SELECT ... FROM users 
WHERE is_profile_public = TRUE 
AND role != 'admin'
-- Admin data never leaves the server
```

## Summary

✅ **Database** → Contains role field
✅ **Server** → Includes role in query and response, filters admins
✅ **Client** → Uses role to display correct badge
✅ **UI** → Shows proper badge with color and icon for each role
