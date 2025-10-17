# Database Migration for Profile Fields

## Overview
This migration adds missing profile fields to the `users` table to support the enhanced profile page functionality.

## Fields Added
1. **twitter_profile** - VARCHAR(255) - Stores Twitter/X handle
2. **github_profile** - VARCHAR(255) - Stores GitHub username or URL
3. **address** - VARCHAR(255) - User's complete address (if not already present)
4. **country** - VARCHAR(100) - User's country (if not already present)
5. **availability_status** - ENUM - User's availability status with proper values

## How to Apply Migration

### Option 1: Using MySQL Command Line
```bash
mysql -u your_username -p alumni_db < database_migration_profile_fields.sql
```

### Option 2: Using MySQL Workbench or phpMyAdmin
1. Open the database tool
2. Connect to the `alumni_db` database
3. Copy the contents of `database_migration_profile_fields.sql`
4. Execute the SQL statements

### Option 3: Manual Execution
If the migration file doesn't work with `ADD COLUMN IF NOT EXISTS`, manually add columns:

```sql
USE alumni_db;

-- Check if column exists first, then add
ALTER TABLE users ADD COLUMN twitter_profile VARCHAR(255) NULL AFTER linkedin_profile;
ALTER TABLE users ADD COLUMN github_profile VARCHAR(255) NULL AFTER twitter_profile;
```

## Verification
After running the migration, verify the changes:

```sql
DESCRIBE users;
```

You should see the new columns listed with their appropriate data types.

## Rollback (if needed)
To remove the added columns:

```sql
USE alumni_db;
ALTER TABLE users DROP COLUMN twitter_profile;
ALTER TABLE users DROP COLUMN github_profile;
ALTER TABLE users DROP COLUMN availability_status;
```

## Impact
- **Backend**: Server-side API (`server/api/users.js`) has been updated to handle these fields
- **Frontend**: Profile forms (`client/profile.html` and `client/js/profile.js`) now support these fields
- **Data Loss Prevention**: The issue where entering GitHub profile caused data loss has been fixed by properly handling all fields in form submission

## Notes
- The migration is safe to run multiple times (uses `IF NOT EXISTS`)
- Existing data will not be affected
- New columns allow NULL values by default
- The availability_status ENUM has been corrected to match the frontend options
