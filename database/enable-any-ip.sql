-- =============================================================================
-- Allow MySQL connections from ANY IP  (MongoDB Atlas equivalent of 0.0.0.0/0)
-- =============================================================================
-- MongoDB:  Network Access → Add IP 0.0.0.0/0
-- MySQL:    user must exist as  'username'@'%'
--
-- WHERE TO RUN: phpMyAdmin → SQL tab
-- If CREATE USER / GRANT fails → your hosting user is not allowed to open remote
-- access. Email support with the ticket text at the bottom.
-- =============================================================================

-- Show current allowed hosts for this user (localhost only = remote blocked)
SELECT User, Host FROM mysql.user WHERE User = 'msgreminder_prod';

-- Create "any IP" login (same password you already use for this user)
-- Replace YOUR_DB_PASSWORD with the real msgreminder_prod password.
CREATE USER IF NOT EXISTS 'msgreminder_prod'@'%' IDENTIFIED BY 'YOUR_DB_PASSWORD';

-- Give full rights on the production database
GRANT ALL PRIVILEGES ON `msgreminder_prod`.* TO 'msgreminder_prod'@'%';

-- Apply
FLUSH PRIVILEGES;

-- Confirm you now see BOTH rows:
--   msgreminder_prod | localhost
--   msgreminder_prod | %
SELECT User, Host FROM mysql.user WHERE User = 'msgreminder_prod';

/*
======================== SUPPORT TICKET (if SQL fails) ========================

Subject: Enable remote MySQL 0.0.0.0/0 equivalent (user@%)

Hello,

Please enable remote MySQL access for our shared hosting account (msgreminder.com).

We need the same behaviour as MongoDB Atlas IP allowlist 0.0.0.0/0:

  Database: msgreminder_prod
  User:     msgreminder_prod
  Host:     %   (allow from any IP)

Also ensure Access Hosts / Remote MySQL is enabled in DirectAdmin for our account
(we do not see an Access Hosts page in the Databases UI).

Thank you.

================================================================================
*/
