-- Migration to add missing profile fields to users table
-- This adds twitter_profile, github_profile, address, country, and availability_status columns

USE alumni_db;

-- Add twitter_profile column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS twitter_profile VARCHAR(255) NULL AFTER linkedin_profile;

-- Add github_profile column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS github_profile VARCHAR(255) NULL AFTER twitter_profile;

-- Add address column if it doesn't exist (it's already in the schema but might be missing)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL AFTER dob;

-- Add country column if it doesn't exist (it's already in the schema but might be missing)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL AFTER city;

-- Add availability_status column if it doesn't exist (it's in the schema but might have wrong type)
-- First, try to drop if exists with wrong type
ALTER TABLE users 
DROP COLUMN IF EXISTS availability_status;

-- Then add with correct type
ALTER TABLE users 
ADD COLUMN availability_status ENUM('available', 'open_to_offers', 'not_looking', 'busy') DEFAULT 'available' NULL AFTER social_media_links;

-- Show the updated structure
DESCRIBE users;
