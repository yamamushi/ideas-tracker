#!/bin/bash

# Production build script
# Builds both frontend and backend for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
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

print_status "Starting production build process"
echo "=================================="

# Check prerequisites
if ! command_exists node; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current: $(node --version)"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create build directories
print_status "Creating build directories..."
mkdir -p dist
mkdir -p logs

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf backend/dist
rm -rf frontend/dist
rm -rf dist/*

print_success "Cleanup completed"

# Install dependencies
print_status "Installing production dependencies..."

# Backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm ci --only=production
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Frontend dependencies (need dev dependencies for build)
print_status "Installing frontend dependencies..."
cd frontend
npm ci
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ..

print_success "Dependencies installed"

# Build backend
print_status "Building backend application..."
cd backend

# Check if TypeScript build script exists
if npm run build >/dev/null 2>&1; then
    print_success "Backend build completed"
else
    print_error "Backend build failed"
    exit 1
fi

# Verify backend build
if [ ! -d "dist" ] || [ ! -f "dist/server.js" ]; then
    print_error "Backend build verification failed - dist/server.js not found"
    exit 1
fi

cd ..
print_success "Backend build verified"

# Build frontend
print_status "Building frontend application..."
cd frontend

# Check environment file
if [ ! -f ".env.production" ]; then
    print_warning "Frontend .env.production not found, using .env"
fi

# Build frontend
if npm run build >/dev/null 2>&1; then
    print_success "Frontend build completed"
else
    print_error "Frontend build failed"
    exit 1
fi

# Verify frontend build
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    print_error "Frontend build verification failed - dist/index.html not found"
    exit 1
fi

cd ..
print_success "Frontend build verified"

# Copy builds to dist directory
print_status "Organizing build artifacts..."

# Copy backend build
cp -r backend/dist dist/backend
cp backend/package.json dist/backend/
cp -r backend/config dist/backend/ 2>/dev/null || true

# Copy frontend build
cp -r frontend/dist dist/frontend

# Copy configuration files
cp -r config dist/ 2>/dev/null || true

# Create production package.json
cat > dist/package.json << EOF
{
  "name": "ideas-tracker-production",
  "version": "1.0.0",
  "description": "Ideas Tracker - Production Build",
  "main": "backend/server.js",
  "scripts": {
    "start": "node backend/server.js",
    "health": "node -e \"require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })\""
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create deployment info
cat > dist/build-info.json << EOF
{
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF

print_success "Build artifacts organized"

# Generate build report
print_status "Generating build report..."

BACKEND_SIZE=$(du -sh backend/dist 2>/dev/null | cut -f1 || echo "unknown")
FRONTEND_SIZE=$(du -sh frontend/dist 2>/dev/null | cut -f1 || echo "unknown")
TOTAL_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "unknown")

cat > dist/build-report.txt << EOF
Ideas Tracker - Production Build Report
======================================

Build Date: $(date)
Node Version: $(node --version)
NPM Version: $(npm --version)

Build Sizes:
- Backend: $BACKEND_SIZE
- Frontend: $FRONTEND_SIZE
- Total: $TOTAL_SIZE

Backend Files:
$(find backend/dist -type f -name "*.js" | wc -l) JavaScript files
$(find backend/dist -type f -name "*.map" | wc -l) Source map files

Frontend Files:
$(find frontend/dist -type f -name "*.js" | wc -l) JavaScript files
$(find frontend/dist -type f -name "*.css" | wc -l) CSS files
$(find frontend/dist -type f -name "*.html" | wc -l) HTML files
$(find frontend/dist -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.svg" -o -name "*.ico" \) | wc -l) Image files

Git Information:
- Commit: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')
- Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')
- Status: $(git status --porcelain 2>/dev/null | wc -l) modified files

Build completed successfully!
EOF

print_success "Build report generated"

# Security check
print_status "Running security checks..."

# Check for sensitive files
SENSITIVE_FILES=$(find dist -name "*.env*" -o -name "*.key" -o -name "*.pem" -o -name "*.p12" 2>/dev/null || true)
if [ -n "$SENSITIVE_FILES" ]; then
    print_warning "Sensitive files found in build:"
    echo "$SENSITIVE_FILES"
fi

# Check for development dependencies in production build
if [ -f "dist/backend/package.json" ]; then
    DEV_DEPS=$(node -e "const pkg = require('./dist/backend/package.json'); console.log(Object.keys(pkg.devDependencies || {}).length)" 2>/dev/null || echo "0")
    if [ "$DEV_DEPS" -gt 0 ]; then
        print_warning "Development dependencies found in production build"
    fi
fi

print_success "Security checks completed"

# Final verification
print_status "Final verification..."

# Check if all required files exist
REQUIRED_FILES=(
    "dist/backend/server.js"
    "dist/frontend/index.html"
    "dist/package.json"
    "dist/build-info.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_success "All required files present"

# Display summary
echo ""
echo "=================================="
print_success "Production build completed!"
echo "=================================="
echo ""
echo "📦 Build artifacts: ./dist/"
echo "📊 Build report: ./dist/build-report.txt"
echo "ℹ️  Build info: ./dist/build-info.json"
echo ""
echo "📁 Directory structure:"
echo "  dist/"
echo "  ├── backend/          # Node.js application"
echo "  ├── frontend/         # Static web files"
echo "  ├── config/           # Configuration files"
echo "  ├── package.json      # Production package.json"
echo "  ├── build-info.json   # Build metadata"
echo "  └── build-report.txt  # Detailed build report"
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "  1. Copy dist/ to your production server"
echo "  2. Run 'npm install' in the dist/ directory"
echo "  3. Set up environment variables"
echo "  4. Start with 'npm start' or use PM2"
echo ""

print_success "Build process completed successfully! 🎉"