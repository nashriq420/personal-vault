<?php
// Configuration for cPanel Database

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'qifd_personal'); // Replace with cPanel DB Name
define('DB_USER', getenv('DB_USER') ?: 'qifd_nashriq'); // Replace with cPanel DB User
define('DB_PASS', getenv('DB_PASS') ?: '6ZrpzVH{IOA4[@7,'); // Replace with cPanel DB Password

// Admin credentials
define('ADMIN_EMAIL', getenv('ADMIN_EMAIL') ?: 'nshrqirfn@gmail.com');
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'Starsun2097!');

// Viewer credentials (Read-Only)
define('VIEWER_EMAIL', getenv('VIEWER_EMAIL') ?: 'viewer@qifd.my');
define('VIEWER_PASSWORD', getenv('VIEWER_PASSWORD') ?: 'Viewer123!');
