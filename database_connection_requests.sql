-- Add connection requests table for directory feature
-- This table manages connection requests between users

CREATE TABLE IF NOT EXISTS `connection_requests` (
  `request_id` INT AUTO_INCREMENT PRIMARY KEY,
  `from_user_id` INT NOT NULL,
  `to_user_id` INT NOT NULL,
  `status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`from_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`to_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_connection_request` (`from_user_id`, `to_user_id`),
  INDEX `idx_to_user` (`to_user_id`, `status`),
  INDEX `idx_from_user` (`from_user_id`, `status`)
);

-- Add connections table to track accepted connections
CREATE TABLE IF NOT EXISTS `connections` (
  `connection_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user1_id` INT NOT NULL,
  `user2_id` INT NOT NULL,
  `connected_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user1_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user2_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_connection` (`user1_id`, `user2_id`),
  INDEX `idx_user1` (`user1_id`),
  INDEX `idx_user2` (`user2_id`),
  CHECK (`user1_id` < `user2_id`)
);
