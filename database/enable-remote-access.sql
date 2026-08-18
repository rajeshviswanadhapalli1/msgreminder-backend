-- Run this in phpMyAdmin → SQL tab WHILE logged into the control panel.
-- Goal: allow user msgreminder_prod to connect from ANY IP (required for Mac / mobile backend outside the server).
--
-- On many shared hosts this will FAIL with "Access denied" — only the host admin can create user@'%'.
-- If it fails: open a support ticket (text at bottom of this file).

-- 1) See which hosts are currently allowed for this user
SELECT User, Host FROM mysql.user WHERE User = 'msgreminder_prod';

-- 2) Allow connections from any IP
-- MySQL 5.7 / MariaDB style (DirectAdmin often uses MariaDB):
CREATE USER IF NOT EXISTS 'msgreminder_prod'@'%' IDENTIFIED BY 'REPLACE_WITH_YOUR_DB_PASSWORD';
GRANT ALL PRIVILEGES ON msgreminder_prod.* TO 'msgreminder_prod'@'%';
FLUSH PRIVILEGES;

-- 3) Confirm
SELECT User, Host FROM mysql.user WHERE User = 'msgreminder_prod';
-- You want to see BOTH:
--   msgreminder_prod | localhost
--   msgreminder_prod | %

/*
If CREATE USER / GRANT fails, email support:

Subject: Enable remote MySQL for msgreminder_prod

Hello,

Please allow remote MySQL connections for database user `msgreminder_prod`
on database `msgreminder_prod`.

We need Access Host `%` (any host) for development and API hosting outside the server.

If Access Hosts is available in DirectAdmin, please enable it on our account.

Thank you.
*/
