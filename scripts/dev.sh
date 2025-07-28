#!/bin/bash

# Development startup script
# Runs both frontend and backend with hot reload

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DEV]${NC} $1"
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if port_in_use $1; then
        print_warning "Port $1 is in use. Attempting to free it..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Cleanup function
cleanup() {
    print_status "Shutting down development servers..."
    
    # Kill background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Kill processes on specific ports
    kill_port 3001
    kill_port 5173
    
    print_success "Development servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "Starting Ideas Tracker Development Environment"
echo "=============================================="

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "Prerequisites check passed"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Free up ports if they're in use
kill_port 3001
kill_port 5173

# Install dependencies if needed
print_status "Checking dependencies..."

if [ ! -d "backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies installed"
fi

if [ ! -d "frontend/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
fi

# Check environment files
print_status "Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found. Creating from template..."
    cp backend/.env.example backend/.env 2>/dev/null || {
        cat > backend/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ideas_tracker
DB_USER=ideas_tracker_user
DB_PASSWORD=secure_password_123

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_minimum_32_characters_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    }
    print_warning "Please update backend/.env with your database credentials"
fi

if [ ! -f "frontend/.env" ]; then
    print_warning "Frontend .env file not found. Creating from template..."
    cp frontend/.env.example frontend/.env 2>/dev/null || {
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Ideas Tracker
VITE_APP_VERSION=1.0.0
EOF
    }
fi

# Check database connection
print_status "Checking database connection..."
cd backend
if npm run db:check >/dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_warning "Database connection failed. Please ensure PostgreSQL is running and configured correctly."
    print_status "You can run 'npm run setup:db' in the backend directory to set up the database."
fi
cd ..

# Start backend server
print_status "Starting backend server..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
if wait_for_service "http://localhost:3001/api/health" "Backend API"; then
    print_success "Backend server started successfully (PID: $BACKEND_PID)"
else
    print_error "Backend server failed to start. Check logs/backend.log for details."
    cleanup
    exit 1
fi

# Start frontend server
print_status "Starting frontend development server..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
if wait_for_service "http://localhost:5173" "Frontend server"; then
    print_success "Frontend server started successfully (PID: $FRONTEND_PID)"
else
    print_error "Frontend server failed to start. Check logs/frontend.log for details."
    cleanup
    exit 1
fi

# Display status
echo ""
echo "=============================================="
print_success "Development environment is ready!"
echo "=============================================="
echo ""
echo "🚀 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001/api"
echo "📊 API Health: http://localhost:3001/api/health"
echo ""
echo "📝 Logs:"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep script running and show logs
tail -f logs/backend.log logs/frontend.log &
TAIL_PID=$!

# Wait for user interrupt
wait

# Cleanup will be called by trap