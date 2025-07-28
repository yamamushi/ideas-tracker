#!/bin/bash

# Database Reset Script for Ideas Tracker
# This script will delete the existing SQLite database and create a fresh one

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database paths - check for both possible names
DB_DIR="backend/data"
DB_PATH1="backend/data/ideas.db"
DB_PATH2="backend/data/ideas_tracker.db"

# Function to find existing database
find_existing_db() {
    if [ -f "$DB_PATH1" ]; then
        echo "$DB_PATH1"
    elif [ -f "$DB_PATH2" ]; then
        echo "$DB_PATH2"
    else
        echo ""
    fi
}

echo -e "${YELLOW}🗄️  Database Reset Script${NC}"
echo "This will permanently delete the existing database and create a fresh one."
echo ""

# Check if database exists
EXISTING_DB=$(find_existing_db)
if [ -n "$EXISTING_DB" ]; then
    echo -e "${RED}⚠️  WARNING: This will delete the existing database at: $EXISTING_DB${NC}"
    echo "All existing users, ideas, comments, and votes will be lost!"
else
    echo -e "${GREEN}ℹ️  No existing database found. A new one will be created.${NC}"
fi

echo ""
echo -e "${YELLOW}Do you want to proceed? (Y/n)${NC}"
read -r response

# Check if response is exactly "Y"
if [ "$response" != "Y" ]; then
    echo -e "${RED}❌ Database reset cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Resetting database...${NC}"

# Create data directory if it doesn't exist
if [ ! -d "$DB_DIR" ]; then
    echo "📁 Creating data directory..."
    mkdir -p "$DB_DIR"
fi

# Remove existing database files if they exist
if [ -f "$DB_PATH1" ]; then
    echo "🗑️  Removing existing database: $DB_PATH1"
    rm "$DB_PATH1"
fi
if [ -f "$DB_PATH2" ]; then
    echo "🗑️  Removing existing database: $DB_PATH2"
    rm "$DB_PATH2"
fi

# Remove any SQLite journal/wal files
rm -f "$DB_DIR"/*.db-shm "$DB_DIR"/*.db-wal "$DB_DIR"/*.db-journal 2>/dev/null || true

echo "🚀 Starting backend to initialize new database..."

# Change to backend directory and start the backend briefly
cd backend

# Start the backend in the background and capture its PID
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!

# Wait a few seconds for database initialization
sleep 5

# Stop the backend
kill $BACKEND_PID 2>/dev/null || true
wait $BACKEND_PID 2>/dev/null || true

# Go back to root directory
cd ..

# Check if database was created (check both possible paths)
CREATED_DB=$(find_existing_db)
if [ -n "$CREATED_DB" ]; then
    echo -e "${GREEN}✅ Database successfully initialized!${NC}"
    echo -e "${GREEN}📊 New SQLite database created at: $CREATED_DB${NC}"
    echo ""
    echo "You can now:"
    echo "• Start the backend: npm run dev (from backend directory)"
    echo "• Run tests: npm test (from backend directory)"
    echo "• Register new users via the API"
else
    echo -e "${RED}❌ Failed to create database. Please check the backend configuration.${NC}"
    echo "Try running 'npm run dev' manually from the backend directory to see any errors."
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Database reset complete!${NC}"