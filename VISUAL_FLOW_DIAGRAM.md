# Directory Feature - Button Flow Diagram

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ALUMNI DIRECTORY PAGE                        │
│                     (directory.html)                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ALUMNI CARD                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [Photo]  John Doe                    [Connection Badge]   │ │
│  │           Software Engineer @ Google                       │ │
│  │           Class of 2020 • Computer Science                 │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐                      │ │
│  │  │   BUTTON 1   │  │   Message    │     [Match: 95%]     │ │
│  │  └──────────────┘  └──────────────┘                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │  BUTTON 1 Dynamic States:     │
                └───────────────┬───────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐      ┌──────────────┐
│   Connect    │        │Request Sent  │      │View Profile  │
│   (Active)   │        │  (Disabled)  │      │   (Active)   │
└──────┬───────┘        └──────────────┘      └──────┬───────┘
       │                                              │
       │ Click                                        │ Click
       ▼                                              ▼
┌──────────────────────────┐              ┌──────────────────┐
│ POST /connect-request    │              │ Navigate to      │
│ • Validate user exists   │              │ view-profile.html│
│ • Check for duplicates   │              └──────────────────┘
│ • Create request         │
│ • Send notification      │
│ • Update button state    │
└──────────────────────────┘


## Button State Machine

┌─────────────┐
│ Page Load   │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ GET /connection-status/:email        │
│ • Fetch current connection status    │
│ • Returns: connected/pending/        │
│   received/not_connected             │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           Determine Button State                 │
├─────────────────────────────────────────────────┤
│                                                   │
│  if status === 'not_connected':                  │
│    → Show "Connect" button                       │
│                                                   │
│  if status === 'pending':                        │
│    → Show "Request Sent" (disabled)              │
│                                                   │
│  if status === 'received':                       │
│    → Show "View Request" (green)                 │
│                                                   │
│  if status === 'connected':                      │
│    → Show "View Profile"                         │
│                                                   │
└─────────────────────────────────────────────────┘


## Connection Request Flow

User A                    Backend                    User B
  │                         │                          │
  │─────Connect────────────>│                          │
  │  POST /connect-request  │                          │
  │                         │                          │
  │                         ├──Check existing─────────>│
  │                         │  connection/request      │
  │                         │                          │
  │                         ├──Create request──────────│
  │                         │  status: pending         │
  │                         │                          │
  │                         ├──Send notification──────>│
  │<────Success─────────────┤                          │
  │  (Update button state)  │                          │
  │                         │                          │
  │                         │<─────Accept──────────────│
  │                         │  POST /accept-connection │
  │                         │                          │
  │                         ├──Update status───────────│
  │                         │  status: accepted        │
  │                         │                          │
  │                         ├──Create connection───────│
  │                         │  connections table       │
  │                         │                          │
  │<────Notification────────┤                          │
  │  connection_accepted    │                          │
  │                         │                          │


## Message Button Flow (Always Available)

┌─────────────┐
│ User clicks │
│   Message   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Redirect to:                    │
│ messages.html?                  │
│   user=email@example.com&       │
│   name=John%20Doe               │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Messages page:                  │
│ • Loads conversation with user  │
│ • Creates new if doesn't exist  │
│ • Works for ALL users           │
│   (no connection required)      │
└─────────────────────────────────┘


## View Profile Flow

┌─────────────┐
│ User clicks │
│View Profile │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Redirect to:                    │
│ view-profile.html?              │
│   email=email@example.com       │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Profile page:                   │
│ • Shows user's public info      │
│ • Can accept/reject requests    │
│ • Shows connection status       │
└─────────────────────────────────┘


## Database Schema

┌──────────────────────────┐         ┌──────────────────────────┐
│   connection_requests    │         │      connections         │
├──────────────────────────┤         ├──────────────────────────┤
│ request_id (PK)          │         │ connection_id (PK)       │
│ from_user_id (FK)        │         │ user1_id (FK)            │
│ to_user_id (FK)          │         │ user2_id (FK)            │
│ status (pending/         │         │ connected_at             │
│        accepted/         │         └──────────────────────────┘
│        rejected)         │                    │
│ created_at               │                    │
│ updated_at               │         Constraint: user1_id < user2_id
└──────────────────────────┘         (Prevents duplicate connections)
         │
         │
    Unique constraint:
    (from_user_id, to_user_id)
    (Prevents duplicate requests)


## API Endpoints Summary

┌────────────────────────────────────────────────────────────┐
│                    BACKEND ENDPOINTS                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  POST   /api/users/connect-request                         │
│         → Send connection request                          │
│         → Input: { to_email: string }                      │
│         → Output: 201 Created / 400 Error                  │
│                                                             │
│  GET    /api/users/connection-status/:email                │
│         → Get connection status                            │
│         → Output: { status: string }                       │
│                                                             │
│  POST   /api/users/accept-connection/:requestId            │
│         → Accept connection request                        │
│         → Output: 200 OK / 404 Not Found                   │
│                                                             │
│  POST   /api/users/reject-connection/:requestId            │
│         → Reject connection request                        │
│         → Output: 200 OK / 404 Not Found                   │
│                                                             │
└────────────────────────────────────────────────────────────┘


## Security Features

┌────────────────────────────────────────┐
│        SECURITY MEASURES               │
├────────────────────────────────────────┤
│                                        │
│  ✓ JWT Authentication Required         │
│  ✓ Self-Connection Blocked             │
│  ✓ Duplicate Request Prevention        │
│  ✓ Authorization Checks                │
│  ✓ SQL Injection Protection            │
│  ✓ Parameterized Queries               │
│  ✓ Database Constraints                │
│  ✓ Token Validation                    │
│                                        │
└────────────────────────────────────────┘
