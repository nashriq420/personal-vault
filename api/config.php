<?php
// Configuration for cPanel Database

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'vault_db'); // Replace with cPanel DB Name
define('DB_USER', getenv('DB_USER') ?: 'vault_user'); // Replace with cPanel DB User
define('DB_PASS', getenv('DB_PASS') ?: 'vault_password'); // Replace with cPanel DB Password

// Admin credentials
define('ADMIN_EMAIL', getenv('ADMIN_EMAIL') ?: 'nshrqirfn@gmail.com');
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'Starsun2097!');
