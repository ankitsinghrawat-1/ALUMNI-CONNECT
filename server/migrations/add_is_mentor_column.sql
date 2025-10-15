-- Migration: Add is_mentor column to users table
-- This improves performance by avoiding joins when checking mentor status

-- Add is_mentor column to users table
ALTER TABLE users 
ADD COLUMN is_mentor BOOLEAN DEFAULT FALSE NOT NULL
AFTER role;

-- Update existing data: Set is_mentor = TRUE for users who have mentor records
UPDATE users u
INNER JOIN mentors m ON u.user_id = m.user_id
SET u.is_mentor = TRUE;

-- Create index for faster queries
CREATE INDEX idx_users_is_mentor ON users(is_mentor);

-- Verify the migration
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN is_mentor = TRUE THEN 1 ELSE 0 END) as mentor_count
FROM users;
