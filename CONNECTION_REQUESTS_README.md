# Connection Requests Feature - Implementation Guide

## Overview
This document describes the implementation of the connection request feature for the Alumni Directory.

## Database Setup

Before using the connection request feature, you need to create the required database tables. Run the SQL script:

```bash
mysql -u your_username -p alumni_db < database_connection_requests.sql
```

Or manually execute the SQL commands in `database_connection_requests.sql` in your MySQL database.

## Tables Created

### 1. connection_requests
Stores connection requests between users with the following statuses:
- `pending`: Request sent but not yet responded to
- `accepted`: Request accepted and connection created
- `rejected`: Request declined

### 2. connections
Stores accepted connections between users. Uses a normalized approach where `user1_id < user2_id` to avoid duplicate connections.

## API Endpoints

### POST /users/connect-request
Send a connection request to another user.

**Request Body:**
```json
{
  "to_email": "recipient@example.com"
}
```

**Response:**
- `201`: Connection request sent successfully
- `400`: Invalid request (e.g., connecting to yourself, already connected)
- `404`: User not found

**Features:**
- Prevents duplicate requests
- Auto-connects if a reverse request exists
- Creates notifications for the recipient

### GET /users/connection-status/:email
Check connection status with another user.

**Response:**
```json
{
  "status": "connected" | "pending" | "received" | "not_connected"
}
```

- `connected`: Users are connected
- `pending`: Current user sent a request
- `received`: Current user received a request
- `not_connected`: No connection or request exists

### POST /users/accept-connection/:requestId
Accept a connection request (must be the recipient).

**Response:**
- `200`: Connection accepted
- `404`: Request not found

### POST /users/reject-connection/:requestId
Reject a connection request (must be the recipient).

**Response:**
- `200`: Connection rejected
- `404`: Request not found

## Frontend Integration

The directory page (`client/js/directory.js`) has been updated to:

1. Fetch real connection status from the backend
2. Display appropriate buttons based on connection status:
   - **Connect**: Send a new connection request
   - **Request Sent**: Request is pending (disabled)
   - **View Request**: User has received a request
   - **View Profile**: Users are connected

3. Handle connection requests with proper error handling and user feedback

## Button Functionality

### Connect Button
- Sends a connection request to the user
- Updates to "Request Sent" on success
- Shows error toast on failure

### Message Button
- Redirects to messages page with user parameters
- Works for all users (no connection required)

### View Profile Button
- Redirects to the user's profile page
- Shows for connected users or when viewing requests

## Notifications

When a connection request is sent or accepted, notifications are automatically created for the affected user with:
- Notification type
- Actor user information
- Link to the requester's profile

## Testing

To test the feature:

1. Ensure database tables are created
2. Start the server: `npm start`
3. Log in as two different users
4. Navigate to the directory page
5. Send a connection request from one user to another
6. Verify the button states update correctly
7. Check notifications are created

## Security

- All endpoints require authentication (JWT token)
- Users cannot send requests to themselves
- Duplicate requests are prevented
- Only recipients can accept/reject requests
- Connection status checks ensure proper authorization
