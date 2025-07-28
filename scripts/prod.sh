#!/bin/bash

# Production startup script
# Builds and starts the application in production mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[PROD]${NC} $1"
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

# Cleanup function
cleanup() {
    print_status "Stopping production servers..."
    
    # Stop PM2 processes
    if command_exists pm2; then
        pm2 stop all 2>/dev/null || true
    fi
    
    print_success "Production servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "Starting Ideas Tracker Production Build"
echo "========================================"

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

# Install PM2 if not present
if ! command_exists pm2; then
    print_status "Installing PM2 process manager..."
    npm install -g pm2
    print_success "PM2 installed"
fi

print_success "Prerequisites check passed"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Check environment files
print_status "Checking production environment configuration..."

if [ ! -f "backend/.env.production" ]; then
    print_error "Backend .env.production file not found. Please create it with production settings."
    print_status "Example:"
    echo "  DB_HOST=your_db_host"
    echo "  DB_NAME=ideas_tracker_prod"
    echo "  JWT_SECRET=your_production_jwt_secret"
    echo "  NODE_ENV=production"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    print_error "Frontend .env.production file not found. Please create it with production settings."
    print_status "Example:"
    echo "  VITE_API_URL=https://yourdomain.com/api"
    exit 1
fi

# Install dependencies
print_status "Installing production dependencies..."

cd backend
npm ci --only=production
cd ..

cd frontend
npm ci
cd ..

print_success "Dependencies installed"

# Build applications
print_status "Building backend application..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    print_error "Backend build failed"
    exit 1
fi
cd ..
print_success "Backend build completed"

print_status "Building frontend application..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi
cd ..
print_success "Frontend build completed"

# Database migration (if needed)
print_status "Checking database..."
cd backend
if [ -f "package.json" ] && npm run db:migrate >/dev/null 2>&1; then
    print_success "Database migration completed"
else
    print_warning "Database migration skipped or failed"
fi
cd ..

# Create PM2 ecosystem file if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
    print_status "Creating PM2 ecosystem configuration..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ideas-tracker-api',
    script: './backend/dist/server.js',
    cwd: './',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_file: './logs/api.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000
  }]
};
EOF
    print_success "PM2 ecosystem configuration created"
fi

# Stop any existing PM2 processes
print_status "Stopping existing processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start application with PM2
print_status "Starting production application..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
print_status "Application status:"
pm2 status

# Display final information
echo ""
echo "========================================"
print_success "Production application started!"
echo "========================================"
echo ""
echo "🚀 API Server: http://localhost:3001"
echo "📊 API Health: http://localhost:3001/api/health"
echo "📁 Frontend Build: ./frontend/dist"
echo ""
echo "📝 Logs:"
echo "   API: logs/api.log"
echo "   Errors: logs/api-error.log"
echo ""
echo "🔧 Management Commands:"
echo "   pm2 status          - Show process status"
echo "   pm2 logs            - Show logs"
echo "   pm2 restart all     - Restart all processes"
echo "   pm2 stop all        - Stop all processes"
echo "   pm2 monit           - Monitor processes"
echo ""
echo "Press Ctrl+C to stop monitoring (processes will continue running)"

# Monitor logs
pm2 logs --lines 50