-- Import this in phpMyAdmin → msgreminder_prod → Import
-- Syncs accounts created on your Mac (SQLite) into production MySQL.
-- Safe to re-run: uses INSERT IGNORE (skips rows that already exist by id/email/mobile).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT IGNORE INTO `users`
  (`id`, `full_name`, `email`, `country`, `country_code`, `mobile`, `password_hash`, `timezone`, `token_version`, `created_at`, `updated_at`)
VALUES
  (
    '79846ac7-c23a-4b07-bd4f-69d6016aae07',
    'Demo User',
    'demo@msgreminder.com',
    'India',
    '+91',
    '9876543210',
    '$2b$12$JVW3uiR8Aul3rKYs8ni7KOw3qBl1Y7iw6iodwJnahsWTFBJPUIp8y',
    'Asia/Kolkata',
    0,
    '2026-07-30 05:39:28',
    '2026-07-30 05:39:28'
  ),
  (
    '0e92bad1-4a96-43a3-9065-63aff411c28a',
    'Rajesh Viswanadhapalli',
    'rajesh6v6@gmail.com',
    'India',
    '+91',
    '9966305528',
    '$2b$12$0x1Y9Fag1SlO0mYNvimekOfGDDOKuT2W7Ysh6CxHMvLslxrPQF/PS',
    'Asia/Kolkata',
    0,
    '2026-07-31 05:53:36',
    '2026-07-31 05:53:36'
  ),
  (
    '75c9bfc6-6467-41d3-858a-d225ce412312',
    'Nagaraju',
    'nagaraju11@gmail.com',
    'India',
    '+91',
    '9966305520',
    '$2b$12$u4YCypxxl2zfTMg.kMUzLu0qUvkT2rtsXrgPEdXR5ackeTt0OdI0u',
    'Asia/Kolkata',
    0,
    '2026-08-04 09:21:55',
    '2026-08-04 09:21:55'
  );

INSERT IGNORE INTO `reminders`
  (`id`, `user_id`, `title`, `message`, `category`, `scheduled_at`, `timezone`, `repeat`, `priority`, `status`, `completed_at`, `series_id`, `created_at`, `updated_at`)
VALUES
  (
    '4081829e-9e3d-49bb-b029-7984400a2892',
    '79846ac7-c23a-4b07-bd4f-69d6016aae07',
    'Mom''s Birthday',
    'Wish mom happy birthday',
    'birthday',
    '2026-08-15 05:00:00',
    'Asia/Kolkata',
    'yearly',
    'high',
    'pending',
    NULL,
    '1f6c92de-019a-4f9a-bf7c-b04f7a08707a',
    '2026-07-30 05:39:28',
    '2026-07-30 05:39:28'
  ),
  (
    'fb889f6e-af63-4272-83df-2a2fcb59f978',
    '0e92bad1-4a96-43a3-9065-63aff411c28a',
    'Raise PR',
    'Need To Send Raise PR',
    'general',
    '2026-07-31 06:30:00',
    'Asia/Kolkata',
    'none',
    'medium',
    'completed',
    '2026-07-31 06:32:12',
    NULL,
    '2026-07-31 06:01:01',
    '2026-07-31 06:32:12'
  );

SET FOREIGN_KEY_CHECKS = 1;
