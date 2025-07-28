#!/bin/bash

# Make Admin Script for Ideas Tracker
# This script promotes an existing user to admin status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[ADMIN]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/.env" ]; then
    print_error "Please run this script from the project root directory"
    print_info "Make sure backend/.env exists"
    exit 1
fi

# Load environment variables
if [ -f "backend/.env" ]; then
    export $(grep -v '^#' backend/.env | xargs)
fi

# Determine database path
if [ "$DATABASE_TYPE" = "sqlite" ]; then
    if [ -n "$SQLITE_PATH" ]; then
        # Handle relative paths - the SQLITE_PATH is relative to backend directory
        if [[ "$SQLITE_PATH" == ./* ]]; then
            # Remove the leading ./ 
            DB_PATH="${SQLITE_PATH#./}"
        else
            DB_PATH="$SQLITE_PATH"
        fi
    else
        DB_PATH="backend/data/ideas_tracker.db"
    fi
else
    print_error "This script only supports SQLite databases"
    print_info "Current database type: $DATABASE_TYPE"
    exit 1
fi

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    print_error "Database not found at: $DB_PATH"
    print_info "Please start the backend server first to initialize the database"
    exit 1
fi

print_status "Make Admin User"
echo "This script will promote an existing user to admin status."
echo ""

# Prompt for username
printf "${CYAN}Enter username to make admin${NC}: "
read -r USERNAME

if [ -z "$USERNAME" ]; then
    print_error "Username cannot be empty"
    exit 1
fi

print_status "Checking if user exists..."

# Check if user exists and get current admin status
USER_INFO=$(sqlite3 "$DB_PATH" "SELECT id, username, email, is_admin FROM users WHERE username = '$USERNAME';" 2>/dev/null || echo "")

if [ -z "$USER_INFO" ]; then
    print_error "User '$USERNAME' not found"
    print_info "Available users:"
    sqlite3 "$DB_PATH" "SELECT username, email, CASE WHEN is_admin = 1 THEN 'Admin' ELSE 'User' END as role FROM users ORDER BY username;" -header -column
    exit 1
fi

# Parse user info
USER_ID=$(echo "$USER_INFO" | cut -d'|' -f1)
USER_USERNAME=$(echo "$USER_INFO" | cut -d'|' -f2)
USER_EMAIL=$(echo "$USER_INFO" | cut -d'|' -f3)
IS_ADMIN=$(echo "$USER_INFO" | cut -d'|' -f4)

print_success "User found:"
echo "  ID: $USER_ID"
echo "  Username: $USER_USERNAME"
echo "  Email: $USER_EMAIL"
echo "  Current Status: $([ "$IS_ADMIN" = "1" ] && echo "Admin" || echo "Regular User")"
echo ""

# Check if user is already admin
if [ "$IS_ADMIN" = "1" ]; then
    print_warning "User '$USERNAME' is already an admin"
    exit 0
fi

# Confirm action
printf "${YELLOW}Are you sure you want to make '$USERNAME' an admin? (y/N)${NC}: "
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    print_info "Operation cancelled"
    exit 0
fi

print_status "Promoting user to admin..."

# Update user to admin
sqlite3 "$DB_PATH" "UPDATE users SET is_admin = 1, updated_at = CURRENT_TIMESTAMP WHERE username = '$USERNAME';"

if [ $? -eq 0 ]; then
    print_success "User '$USERNAME' has been promoted to admin!"
    
    # Verify the change
    UPDATED_STATUS=$(sqlite3 "$DB_PATH" "SELECT is_admin FROM users WHERE username = '$USERNAME';")
    if [ "$UPDATED_STATUS" = "1" ]; then
        print_success "Admin status verified in database"
    else
        print_warning "Could not verify admin status change"
    fi
else
    print_error "Failed to update user admin status"
    exit 1
fi

echo ""
print_info "The user can now:"
print_info "• Access admin endpoints (/api/admin/*)"
print_info "• Delete any ideas or comments"
print_info "• View admin statistics and flagged content"
print_info "• Perform bulk operations"
echo ""
print_success "Admin promotion complete! 🎉"