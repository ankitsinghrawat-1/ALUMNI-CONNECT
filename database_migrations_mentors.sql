-- Enhanced Mentors Database Schema
-- This file contains all the database migrations for the enhanced mentorship feature

-- 1. Update the existing mentors table with new fields
ALTER TABLE mentors 
ADD COLUMN industry VARCHAR(100),
ADD COLUMN experience_years INT,
ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 0,
ADD COLUMN bio TEXT,
ADD COLUMN skills TEXT,
ADD COLUMN languages VARCHAR(255) DEFAULT 'English',
ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN video_intro_url VARCHAR(500),
ADD COLUMN linkedin_url VARCHAR(500),
ADD COLUMN github_url VARCHAR(500),
ADD COLUMN portfolio_url VARCHAR(500),
ADD COLUMN mentoring_style ENUM('one_on_one', 'group', 'workshop', 'mixed') DEFAULT 'one_on_one',
ADD COLUMN communication_methods JSON,
ADD COLUMN verification_level ENUM('basic', 'verified', 'premium') DEFAULT 'basic',
ADD COLUMN total_mentees INT DEFAULT 0,
ADD COLUMN total_sessions INT DEFAULT 0,
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN total_reviews INT DEFAULT 0,
ADD COLUMN is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN response_time_hours INT DEFAULT 24,
ADD COLUMN success_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 2. Create mentor specializations table
CREATE TABLE mentor_specializations (
    specialization_id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    years_experience INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    INDEX idx_mentor_spec (mentor_id, specialization)
);

-- 3. Create mentor availability table
CREATE TABLE mentor_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    INDEX idx_mentor_availability (mentor_id, day_of_week)
);

-- 4. Create mentor reviews table
CREATE TABLE mentor_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    reviewer_user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    session_quality INT CHECK (session_quality >= 1 AND session_quality <= 5),
    communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
    helpfulness_rating INT CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    would_recommend BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (mentor_id, reviewer_user_id),
    INDEX idx_mentor_reviews (mentor_id, rating)
);

-- 5. Create mentor sessions table
CREATE TABLE mentor_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    mentee_user_id INT NOT NULL,
    session_title VARCHAR(255),
    session_description TEXT,
    scheduled_datetime DATETIME NOT NULL,
    actual_start_time DATETIME,
    actual_end_time DATETIME,
    duration_minutes INT DEFAULT 60,
    session_type ENUM('consultation', 'code_review', 'career_advice', 'mock_interview', 'project_guidance', 'other') DEFAULT 'consultation',
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    meeting_url VARCHAR(500),
    session_notes TEXT,
    mentor_feedback TEXT,
    mentee_feedback TEXT,
    price_paid DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    FOREIGN KEY (mentee_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_mentor_sessions (mentor_id, scheduled_datetime),
    INDEX idx_mentee_sessions (mentee_user_id, scheduled_datetime)
);

-- 6. Create mentor achievements table
CREATE TABLE mentor_achievements (
    achievement_id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    achievement_type ENUM('certification', 'award', 'publication', 'speaking', 'project', 'education') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issuer_organization VARCHAR(255),
    achievement_date DATE,
    verification_url VARCHAR(500),
    image_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    INDEX idx_mentor_achievements (mentor_id, achievement_type)
);

-- 7. Create mentor portfolio table
CREATE TABLE mentor_portfolio (
    portfolio_id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    project_title VARCHAR(255) NOT NULL,
    project_description TEXT,
    project_url VARCHAR(500),
    image_url VARCHAR(500),
    technologies_used TEXT,
    project_type ENUM('web_app', 'mobile_app', 'desktop_app', 'research', 'consulting', 'other') DEFAULT 'other',
    completion_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    INDEX idx_mentor_portfolio (mentor_id, is_featured, display_order)
);

-- 8. Create mentor analytics table
CREATE TABLE mentor_analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    date DATE NOT NULL,
    profile_views INT DEFAULT 0,
    message_requests INT DEFAULT 0,
    session_requests INT DEFAULT 0,
    sessions_completed INT DEFAULT 0,
    response_time_avg_minutes INT DEFAULT 0,
    earnings DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_mentor_date (mentor_id, date),
    INDEX idx_mentor_analytics (mentor_id, date)
);

-- 9. Create mentor pricing tiers table
CREATE TABLE mentor_pricing_tiers (
    tier_id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    tier_name VARCHAR(100) NOT NULL,
    tier_description TEXT,
    price_per_hour DECIMAL(10,2) NOT NULL,
    session_duration_minutes INT DEFAULT 60,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    max_mentees_per_month INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    INDEX idx_mentor_pricing (mentor_id, is_active)
);

-- 10. Create mentor preferences table
CREATE TABLE mentor_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id INT NOT NULL,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    auto_accept_requests BOOLEAN DEFAULT FALSE,
    max_mentees_active INT DEFAULT 10,
    preferred_session_length INT DEFAULT 60,
    advance_booking_days INT DEFAULT 7,
    buffer_time_minutes INT DEFAULT 15,
    weekend_availability BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_mentor_preferences (mentor_id)
);

-- Insert sample industries
INSERT INTO mentor_specializations (mentor_id, specialization, proficiency_level, years_experience) VALUES
(1, 'Software Engineering', 'expert', 8),
(1, 'Web Development', 'expert', 8),
(1, 'React.js', 'expert', 5),
(1, 'Node.js', 'advanced', 6);

-- Insert sample availability (assuming mentor_id 1 exists)
INSERT INTO mentor_availability (mentor_id, day_of_week, start_time, end_time) VALUES
(1, 'monday', '09:00:00', '17:00:00'),
(1, 'tuesday', '09:00:00', '17:00:00'),
(1, 'wednesday', '09:00:00', '17:00:00'),
(1, 'thursday', '09:00:00', '17:00:00'),
(1, 'friday', '09:00:00', '17:00:00');