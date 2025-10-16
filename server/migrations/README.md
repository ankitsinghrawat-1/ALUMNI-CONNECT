# Database Migration: Add is_mentor Column

## Purpose
This migration adds an `is_mentor` boolean column to the `users` table to improve performance when checking mentor status. Instead of joining with the `mentors` table on every request, we can now check the user's mentor status directly.

## Benefits
1. **Better Performance**: No join required when checking mentor status
2. **Simpler Queries**: Direct boolean check instead of checking if mentor record exists
3. **Faster API Response**: Reduces query complexity for the `/mentors/status` endpoint
4. **Database Optimization**: Indexed column for fast lookups

## How to Run

### Method 1: Using MySQL Command Line
```bash
mysql -u your_username -p your_database_name < add_is_mentor_column.sql
```

### Method 2: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Open the `add_is_mentor_column.sql` file
4. Execute the script

### Method 3: Using phpMyAdmin
1. Open phpMyAdmin
2. Select your database
3. Go to SQL tab
4. Copy and paste the contents of `add_is_mentor_column.sql`
5. Click "Go"

## What This Migration Does

1. **Adds Column**: Adds `is_mentor` boolean column to `users` table (default: FALSE)
2. **Updates Existing Data**: Sets `is_mentor = TRUE` for all users who have mentor records
3. **Creates Index**: Adds index on `is_mentor` column for faster queries
4. **Verifies**: Shows count of total users and mentors

## Code Changes

The following files have been updated to work with the new column:

### server/api/mentors.js
- **POST /**: When a user registers as a mentor, sets `is_mentor = TRUE` in users table
- **GET /status**: Reads `is_mentor` from users table instead of joining with mentors table
- **DELETE /profile**: When mentor profile is deleted, sets `is_mentor = FALSE` in users table

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove the index
DROP INDEX idx_users_is_mentor ON users;

-- Remove the column
ALTER TABLE users DROP COLUMN is_mentor;
```

## Testing

After running the migration, test the mentor status endpoint:

```bash
# Test mentor status check
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/mentors/status
```

Expected response for a mentor:
```json
{
  "isMentor": true,
  "mentorId": 123
}
```

Expected response for a non-mentor:
```json
{
  "isMentor": false,
  "mentorId": null
}
```

## Monitoring

Check the browser console after running the migration. The enhanced logging in auth.js will show:

```
✓ window.api is available
🔄 Fetching mentor status from /api/mentors/status...
✓ Mentor status API response received:
  └─ Full response: { "isMentor": true, "mentorId": 123 }
  └─ Has isMentor field: true
  └─ Has mentorId field: true
  └─ isMentor value: true
  └─ mentorId value: 123
✓ SUCCESS: Mentor profile link created!
```

## Notes

- This migration is **backward compatible** - the old code that joins with mentors table will still work
- The `is_mentor` flag is automatically maintained by the mentor registration/deletion endpoints
- No changes needed to existing frontend code - the API response format remains the same
