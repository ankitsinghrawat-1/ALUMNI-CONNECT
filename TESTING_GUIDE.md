# Testing Guide for Directory Feature

## Prerequisites

1. MySQL database running with `alumni_db` database created
2. Run the SQL script to create the new tables:
   ```bash
   mysql -u root -p alumni_db < database_connection_requests.sql
   ```
3. `.env` file configured with database credentials
4. Server running: `npm start`

## Test Scenarios

### Scenario 1: View Directory (Guest/Unauthenticated User)

**Steps:**
1. Open browser to `http://localhost:3000/directory.html` without logging in
2. Observe the alumni cards displayed

**Expected Results:**
- All users show "Connect" button (default state)
- Message button is visible on all cards
- No connection status fetched (displays default state)

### Scenario 2: Send Connection Request

**Steps:**
1. Log in as User A (e.g., `user1@example.com`)
2. Navigate to directory page
3. Find User B's card
4. Click the "Connect" button

**Expected Results:**
- Button text changes to "Request Sent"
- Button becomes disabled (greyed out)
- Success toast notification appears
- User B receives a notification

**Backend Verification:**
```sql
-- Check connection_requests table
SELECT * FROM connection_requests WHERE from_user_id = 1 AND to_user_id = 2;
-- Should show: status = 'pending'

-- Check notifications table
SELECT * FROM notifications WHERE user_id = 2 AND notification_type = 'connection_request';
-- Should show new notification for User B
```

### Scenario 3: View Received Connection Request

**Steps:**
1. Log in as User B (who received the request)
2. Navigate to directory page
3. Find User A's card

**Expected Results:**
- Button shows "View Request" (green color)
- Clicking redirects to User A's profile
- Can accept/reject from profile or notifications

### Scenario 4: Accept Connection Request

**Steps:**
1. As User B, go to notifications or User A's profile
2. Click "Accept" on the connection request

**Expected Results:**
- Connection is created in `connections` table
- Request status updated to 'accepted'
- User A receives "connection_accepted" notification
- Both users now show "View Profile" button for each other

**Backend Verification:**
```sql
-- Check connections table
SELECT * FROM connections WHERE 
  (user1_id = 1 AND user2_id = 2) OR (user1_id = 2 AND user2_id = 1);
-- Should show one connection row

-- Check connection_requests table
SELECT * FROM connection_requests WHERE request_id = 1;
-- Should show: status = 'accepted'
```

### Scenario 5: Connected Users

**Steps:**
1. Log in as User A
2. Navigate to directory
3. Find User B's card (now connected)

**Expected Results:**
- Button shows "View Profile" 
- Clicking redirects to User B's profile page
- Message button still available

### Scenario 6: Message Any User

**Steps:**
1. Log in as any user
2. Navigate to directory
3. Click "Message" button on any card

**Expected Results:**
- Redirects to `messages.html?user=email&name=fullname`
- Message conversation starts or opens
- Works regardless of connection status

### Scenario 7: Auto-Connect (Mutual Requests)

**Steps:**
1. User A sends request to User B (becomes pending)
2. User B sends request to User A (before accepting A's request)

**Expected Results:**
- Auto-connect happens immediately
- Both requests marked as 'accepted'
- Connection created in `connections` table
- Both users notified
- Both users see "View Profile" button for each other

**Backend Verification:**
```sql
-- Both requests should be accepted
SELECT * FROM connection_requests WHERE 
  (from_user_id = 1 AND to_user_id = 2) OR (from_user_id = 2 AND to_user_id = 1);

-- Connection should exist
SELECT * FROM connections WHERE user1_id = 1 AND user2_id = 2;
```

### Scenario 8: Duplicate Request Prevention

**Steps:**
1. User A sends request to User B
2. User A tries to send another request to User B

**Expected Results:**
- Error message: "Connection request already sent"
- No duplicate entry in database
- Button remains in "Request Sent" state

### Scenario 9: Self-Connection Prevention

**Steps:**
1. Log in as User A
2. Try to send connection request to yourself (would need API call)

**Expected Results:**
- Error: "Cannot send connection request to yourself"
- No request created

### Scenario 10: Already Connected Prevention

**Steps:**
1. Users A and B are already connected
2. Try to send a new request

**Expected Results:**
- Error: "Already connected"
- Button shows "View Profile"
- No new request created

## Testing API Endpoints Directly

### Using cURL

**Send Connection Request:**
```bash
curl -X POST http://localhost:3000/api/users/connect-request \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to_email": "user2@example.com"}'
```

**Check Connection Status:**
```bash
curl -X GET "http://localhost:3000/api/users/connection-status/user2@example.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Accept Connection:**
```bash
curl -X POST http://localhost:3000/api/users/accept-connection/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Reject Connection:**
```bash
curl -X POST http://localhost:3000/api/users/reject-connection/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Verification Queries

**View All Connection Requests:**
```sql
SELECT 
  cr.request_id,
  u1.full_name as from_user,
  u1.email as from_email,
  u2.full_name as to_user,
  u2.email as to_email,
  cr.status,
  cr.created_at
FROM connection_requests cr
JOIN users u1 ON cr.from_user_id = u1.user_id
JOIN users u2 ON cr.to_user_id = u2.user_id
ORDER BY cr.created_at DESC;
```

**View All Connections:**
```sql
SELECT 
  c.connection_id,
  u1.full_name as user1_name,
  u1.email as user1_email,
  u2.full_name as user2_name,
  u2.email as user2_email,
  c.connected_at
FROM connections c
JOIN users u1 ON c.user1_id = u1.user_id
JOIN users u2 ON c.user2_id = u2.user_id
ORDER BY c.connected_at DESC;
```

**Check User's Connections:**
```sql
SELECT 
  CASE 
    WHEN c.user1_id = 1 THEN u2.full_name
    ELSE u1.full_name
  END as connected_with,
  c.connected_at
FROM connections c
LEFT JOIN users u1 ON c.user1_id = u1.user_id
LEFT JOIN users u2 ON c.user2_id = u2.user_id
WHERE c.user1_id = 1 OR c.user2_id = 1;
```

## Common Issues and Debugging

### Issue: "Unauthorized" Error
**Solution:** Check that JWT token is present in localStorage as 'alumniConnectToken'

### Issue: Buttons Not Updating
**Solution:** 
- Check browser console for JavaScript errors
- Verify API endpoints are returning correct status
- Check network tab for API responses

### Issue: Duplicate Connection Errors
**Solution:**
- Verify database constraints are properly set
- Check for data inconsistencies in both tables

### Issue: Connection Status Not Loading
**Solution:**
- Ensure user is logged in
- Check that email parameter is correctly encoded
- Verify backend endpoint is accessible

## Performance Testing

Test with multiple users (10+) to ensure:
- Connection status loads efficiently
- No race conditions in auto-connect logic
- Database queries are performant with indexes

## Security Testing

Verify:
- Cannot send requests without authentication
- Cannot accept requests meant for other users
- Cannot bypass unique constraints
- SQL injection protected by parameterized queries
