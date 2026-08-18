-- Message Reminder schema for msgreminder_prod
-- Import this in phpMyAdmin: select msgreminder_prod → Import → choose this file → Go

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `country` VARCHAR(80) NOT NULL,
  `country_code` VARCHAR(8) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'UTC',
  `token_version` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_country_code_mobile_unique` (`country_code`, `mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `password_reset_tokens_token_hash_idx` (`token_hash`),
  KEY `password_reset_tokens_user_id_idx` (`user_id`),
  CONSTRAINT `password_reset_tokens_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reminders` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `title` VARCHAR(120) NULL,
  `message` VARCHAR(500) NOT NULL,
  `category` ENUM('general', 'birthday', 'meeting', 'anniversary', 'other') NOT NULL DEFAULT 'general',
  `scheduled_at` DATETIME NOT NULL,
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'UTC',
  `repeat` ENUM('none', 'daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'none',
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `status` ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  `completed_at` DATETIME NULL,
  `series_id` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reminders_user_status_scheduled_idx` (`user_id`, `status`, `scheduled_at`),
  KEY `reminders_user_completed_idx` (`user_id`, `completed_at`),
  KEY `reminders_series_id_idx` (`series_id`),
  CONSTRAINT `reminders_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SequelizeMeta` (
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES
  ('20260101000001-create-users.js'),
  ('20260101000002-create-password-reset-tokens.js'),
  ('20260101000003-create-reminders.js');

SET FOREIGN_KEY_CHECKS = 1;
