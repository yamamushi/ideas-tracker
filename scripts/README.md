# Scripts Directory

This directory contains utility scripts for the Ideas Tracker project.

## Available Scripts

### `db.sh` - Database Reset Script

Safely deletes and reinitializes the SQLite database.

**Usage:**
```bash
./scripts/db.sh
```

**Features:**
- ✅ Prompts for confirmation (requires typing "Y" to proceed)
- ✅ Safely removes existing database files
- ✅ Automatically initializes a fresh database
- ✅ Cleans up SQLite journal/WAL files
- ✅ Provides clear status messages with colors
- ✅ Handles both possible database file names

**Safety:**
- Only proceeds if you type exactly "Y" (case-sensitive)
- Any other input (including "y", "yes", or just pressing Enter) cancels the operation
- Shows clear warnings about data loss before proceeding

**Example:**
```bash
$ ./scripts/db.sh
🗄️  Database Reset Script
This will permanently delete the existing database and create a fresh one.

⚠️  WARNING: This will delete the existing database at: backend/data/ideas_tracker.db
All existing users, ideas, comments, and votes will be lost!

Do you want to proceed? (Y/n)
Y

🔄 Resetting database...
🗑️  Removing existing database: backend/data/ideas_tracker.db
🚀 Starting backend to initialize new database...
✅ Database successfully initialized!
📊 New SQLite database created at: backend/data/ideas_tracker.db

You can now:
• Start the backend: npm run dev (from backend directory)
• Run tests: npm test (from backend directory)
• Register new users via the API

🎉 Database reset complete!
```

### `make-admin.sh` - Make User Admin Script

Promotes an existing user to admin status by updating the SQLite database.

**Usage:**
```bash
./scripts/make-admin.sh
```

**Features:**
- ✅ Prompts for username to promote
- ✅ Validates user exists in database
- ✅ Shows current user information and status
- ✅ Confirms action before making changes
- ✅ Verifies admin status after update
- ✅ Handles already-admin users gracefully
- ✅ Lists available users if username not found
- ✅ Works with SQLite databases only

**Requirements:**
- Backend database must be initialized (run backend server once)
- SQLite database (configured in backend/.env)
- User must already exist (register through API first)

**Example:**
```bash
$ ./scripts/make-admin.sh
[ADMIN] Make Admin User
This script will promote an existing user to admin status.

Enter username to make admin: johndoe
[ADMIN] Checking if user exists...
[SUCCESS] User found:
  ID: 5
  Username: johndoe
  Email: john@example.com
  Current Status: Regular User

Are you sure you want to make 'johndoe' an admin? (y/N): y
[ADMIN] Promoting user to admin...
[SUCCESS] User 'johndoe' has been promoted to admin!
[SUCCESS] Admin status verified in database

[INFO] The user can now:
[INFO] • Access admin endpoints (/api/admin/*)
[INFO] • Delete any ideas or comments
[INFO] • View admin statistics and flagged content
[INFO] • Perform bulk operations

[SUCCESS] Admin promotion complete! 🎉
```

### `dev.sh` - Development Server Script

Starts the development environment (if available).