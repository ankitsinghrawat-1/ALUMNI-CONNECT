# Thread Error Fix Guide

## Problem
You're getting this error when posting a new thread:
```
Error: Unknown column 'thread_type' in 'field list'
```

## Root Cause
The `threads` table in your database is missing several columns that the API expects. This is because the database schema in `database_structure.txt` was incomplete.

## Solution

Run the migration script to add the missing columns to your existing `threads` table.

### Step 1: Choose Migration Method

#### Option A: Using MySQL CLI (Recommended)
```bash
mysql -u root -p alumni_db < database_threads_migration_safe.sql
```

#### Option B: Using phpMyAdmin or MySQL Workbench
1. Open your database tool
2. Select the `alumni_db` database
3. Go to SQL tab
4. Copy and paste the contents of `database_threads_migration_safe.sql`
5. Execute the queries

### Step 2: Verify the Fix

After running the migration, check if the columns exist:

```sql
DESCRIBE threads;
```

You should see these new columns:
- `title` - VARCHAR(200)
- `thread_type` - ENUM('discussion', 'question', 'announcement', 'poll')
- `category` - VARCHAR(100)
- `is_anonymous` - BOOLEAN
- `target_audience` - ENUM('all', 'alumni', 'students', 'faculty')
- `batch_year` - VARCHAR(20)
- `tags` - VARCHAR(500)
- `content_warning` - ENUM('none', 'sensitive', 'nsfw')
- `scheduled_at` - TIMESTAMP
- `is_published` - BOOLEAN
- `read_time` - INT

### Step 3: Test Thread Creation

Try creating a new thread again. The error should be resolved!

## What Was Fixed

### 1. Fixed Syntax Error
- **Before**: `VARCHAR(200) NOT NULL;` (missing column name)
- **After**: `title VARCHAR(200) NOT NULL`

### 2. Added Missing Columns
The following columns were added to support the enhanced thread features:

| Column | Type | Purpose |
|--------|------|---------|
| `thread_type` | ENUM | Thread category (discussion, question, announcement, poll) |
| `category` | VARCHAR(100) | Thread topic/category |
| `is_anonymous` | BOOLEAN | Anonymous posting support |
| `target_audience` | ENUM | Who can see the thread |
| `batch_year` | VARCHAR(20) | Target specific graduation years |
| `tags` | VARCHAR(500) | Comma-separated tags |
| `content_warning` | ENUM | Content sensitivity warnings |
| `scheduled_at` | TIMESTAMP | Scheduled post feature |
| `is_published` | BOOLEAN | Draft/published status |
| `read_time` | INT | Estimated reading time |

### 3. Added Performance Indexes
- `idx_threads_type` - For filtering by thread type
- `idx_threads_category` - For filtering by category
- `idx_threads_published` - For scheduled posts

## Files Updated

1. **database_structure.txt** - Complete threads table schema (Table 25)
2. **database_threads_migration_safe.sql** - Migration script for existing databases
3. **THREAD_ERROR_FIX_GUIDE.md** - This guide

## Notes

- **Safe Migration**: The migration script is safe to run multiple times. If columns already exist, you'll see "Duplicate column name" errors which you can ignore.
  
- **Existing Data**: All existing threads will be updated with default values:
  - `thread_type` = 'discussion'
  - `is_anonymous` = FALSE
  - `target_audience` = 'all'
  - `content_warning` = 'none'
  - `is_published` = TRUE
  - `read_time` = 0

- **Fresh Installations**: If you're setting up a new database, use `database_structure.txt` instead of the migration script.

## Support

If you continue to see errors after running the migration:

1. Verify the migration ran successfully:
   ```sql
   SHOW COLUMNS FROM threads LIKE 'thread_type';
   ```

2. Check for any error messages in the migration output

3. Ensure your MySQL user has ALTER TABLE permissions

4. Try running the commands one at a time to identify which specific column is causing issues

## Summary

✅ **Fixed**: Syntax error in threads table definition  
✅ **Added**: 10 missing columns required by the API  
✅ **Added**: 3 new indexes for better performance  
✅ **Created**: Safe migration script for existing databases  
✅ **Updated**: Complete database_structure.txt documentation  

**Your thread creation should now work perfectly!** 🎉
