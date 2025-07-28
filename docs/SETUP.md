# Setup Guide

This guide provides detailed instructions for setting up the Ideas Tracker application in different environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Latest version

### Optional Requirements
- **PostgreSQL**: Version 12.0 or higher (only if you choose PostgreSQL over SQLite)

### Verify Prerequisites
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version

# Check PostgreSQL version (only if using PostgreSQL)
psql --version
```

## Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ideas-tracker.git
cd ideas-tracker
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

**Key Dependencies:**
- `express` - Web framework
- `pg` - PostgreSQL client
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `express-validator` - Input validation
- `cors` - Cross-origin resource sharing
- `helmet` - Security middleware

#### Frontend Dependencies
```bash
cd ../frontend
npm install
```

**Key Dependencies:**
- `react` - UI library
- `typescript` - Type safety
- `vite` - Build tool
- `tailwindcss` - CSS framework
- `@tanstack/react-query` - Data fetching
- `react-router-dom` - Routing
- `react-hook-form` - Form management

## Database Configuration

The Ideas Tracker supports both SQLite (default) and PostgreSQL databases.

### Option 1: SQLite (Recommended for Development)

SQLite is the default database and requires no additional setup. The database file will be created automatically.

```bash
cd backend
npm run setup:db
```

Choose option 1 (SQLite) and the setup will:
1. Create the database file in `./data/ideas_tracker.db`
2. Set up all necessary tables and indexes automatically
3. Guide you through creating an admin user

### Option 2: PostgreSQL (Recommended for Production)

If you prefer PostgreSQL, follow these steps:

#### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Create Database User
```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create user and database
CREATE USER ideas_tracker_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE ideas_tracker OWNER ideas_tracker_user;
GRANT ALL PRIVILEGES ON DATABASE ideas_tracker TO ideas_tracker_user;

# Exit PostgreSQL
\q
```

#### Run Database Setup Script
```bash
cd backend
npm run setup:db
```

Choose option 2 (PostgreSQL) and provide your database credentials.

### 4. Manual Database Setup (Alternative)

If the setup script fails, you can manually create the database:

```sql
-- Connect to your database
\c ideas_tracker

-- Create tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ideas (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, idea_id)
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_ideas_author_id ON ideas(author_id);
CREATE INDEX idx_ideas_created_at ON ideas(created_at);
CREATE INDEX idx_votes_idea_id ON votes(idea_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_comments_idea_id ON comments(idea_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
```

## Environment Variables

### Backend Environment (.env)
Create `backend/.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ideas_tracker
DB_USER=ideas_tracker_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment (.env)
Create `frontend/.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# App Configuration
VITE_APP_NAME=Ideas Tracker
VITE_APP_VERSION=1.0.0
```

### Generate Secure Secrets
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
```

The backend will start on http://localhost:3001

#### Start Frontend Server
```bash
cd frontend
npm run dev
```

The frontend will start on http://localhost:5173

### Production Mode

#### Build Applications
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

#### Start Production Servers
```bash
# Start backend
cd backend
npm start

# Serve frontend (using a static server)
cd frontend
npm run preview
```

## Configuration Files

### Database Configuration
The application can use either environment variables or a configuration file:

#### Option 1: Environment Variables (Recommended)
Set the database environment variables as shown above.

#### Option 2: Configuration File
Create `backend/config/database.json`:

```json
{
  "host": "localhost",
  "port": 5432,
  "database": "ideas_tracker",
  "user": "ideas_tracker_user",
  "password": "your_secure_password",
  "ssl": false
}
```

### Tags Configuration
Create `backend/config/tags.json`:

```json
{
  "tags": [
    {
      "id": "technology",
      "name": "Technology",
      "color": "#3B82F6"
    },
    {
      "id": "innovation",
      "name": "Innovation",
      "color": "#10B981"
    },
    {
      "id": "business",
      "name": "Business",
      "color": "#F59E0B"
    },
    {
      "id": "design",
      "name": "Design",
      "color": "#EF4444"
    },
    {
      "id": "education",
      "name": "Education",
      "color": "#8B5CF6"
    }
  ]
}
```

## Testing Setup

### Backend Tests
```bash
cd backend
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

### Frontend Tests
```bash
cd frontend
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- Comment.test.tsx
```

### E2E Tests
```bash
cd frontend

# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e -- --headed
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Error: "database does not exist"**
```bash
# Create the database manually
createdb -U postgres ideas_tracker
```

**Error: "password authentication failed"**
```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'newpassword';
```

**Error: "connection refused"**
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start
```

#### Node.js Issues

**Error: "Cannot find module"**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: "Port already in use"**
```bash
# Find and kill process using the port
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 npm run dev
```

#### Frontend Build Issues

**Error: "Module not found"**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**Error: "TypeScript errors"**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

### Performance Optimization

#### Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM ideas ORDER BY created_at DESC LIMIT 20;

-- Update table statistics
ANALYZE ideas;
ANALYZE votes;
ANALYZE comments;
```

#### Frontend Optimization
```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for unused dependencies
npx depcheck
```

### Logging and Debugging

#### Backend Logging
```bash
# Enable debug logging
DEBUG=app:* npm run dev

# View application logs
tail -f logs/app.log
```

#### Frontend Debugging
```bash
# Enable React DevTools
# Install React Developer Tools browser extension

# Enable Redux DevTools (if using Redux)
# Install Redux DevTools browser extension
```

## Next Steps

After successful setup:

1. **Create your first admin user** using the setup script
2. **Configure tags** in `backend/config/tags.json`
3. **Customize the frontend** theme and branding
4. **Set up monitoring** and logging for production
5. **Configure backup** strategies for your database

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).

For API documentation, see [API.md](API.md).