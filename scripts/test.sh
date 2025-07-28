#!/bin/bash

# Test startup script
# Runs all test suites with proper setup and reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
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

# Function to run tests with proper error handling
run_test_suite() {
    local suite_name=$1
    local command=$2
    local directory=$3
    
    print_status "Running $suite_name..."
    
    if [ -n "$directory" ]; then
        cd "$directory"
    fi
    
    if eval "$command"; then
        print_success "$suite_name passed"
        if [ -n "$directory" ]; then
            cd - >/dev/null
        fi
        return 0
    else
        print_error "$suite_name failed"
        if [ -n "$directory" ]; then
            cd - >/dev/null
        fi
        return 1
    fi
}

# Parse command line arguments
COVERAGE=false
WATCH=false
SPECIFIC_SUITE=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --watch|-w)
            WATCH=true
            shift
            ;;
        --suite|-s)
            SPECIFIC_SUITE="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --coverage, -c     Run tests with coverage report"
            echo "  --watch, -w        Run tests in watch mode"
            echo "  --suite, -s SUITE  Run specific test suite (backend|frontend|e2e)"
            echo "  --verbose, -v      Verbose output"
            echo "  --help, -h         Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                 Run all tests"
            echo "  $0 --coverage      Run all tests with coverage"
            echo "  $0 --suite backend Run only backend tests"
            echo "  $0 --watch         Run tests in watch mode"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

print_status "Starting Ideas Tracker Test Suite"
echo "=================================="

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

# Create test results directory
mkdir -p test-results
mkdir -p coverage

# Install dependencies if needed
print_status "Checking test dependencies..."

if [ ! -d "backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check for Playwright installation (for E2E tests)
if [ "$SPECIFIC_SUITE" = "e2e" ] || [ -z "$SPECIFIC_SUITE" ]; then
    if [ ! -d "frontend/node_modules/@playwright" ]; then
        print_status "Installing Playwright for E2E tests..."
        cd frontend
        npx playwright install
        cd ..
    fi
fi

print_success "Dependencies check completed"

# Set up test environment
print_status "Setting up test environment..."

# Create test environment files if they don't exist
if [ ! -f "backend/.env.test" ]; then
    print_status "Creating test environment configuration..."
    cat > backend/.env.test << EOF
# Test Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ideas_tracker_test
DB_USER=ideas_tracker_test_user
DB_PASSWORD=test_password_123

# JWT Configuration (test values)
JWT_SECRET=test_jwt_secret_key_for_testing_minimum_32_characters
JWT_REFRESH_SECRET=test_refresh_secret_key_for_testing_minimum_32_characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3002
NODE_ENV=test
FRONTEND_URL=http://localhost:5174

# Rate Limiting (relaxed for testing)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
EOF
fi

# Variables to track test results
BACKEND_RESULT=0
FRONTEND_RESULT=0
E2E_RESULT=0
TOTAL_TESTS=0
PASSED_TESTS=0

# Run backend tests
if [ "$SPECIFIC_SUITE" = "backend" ] || [ -z "$SPECIFIC_SUITE" ]; then
    echo ""
    echo "=================================="
    print_status "Backend Tests"
    echo "=================================="
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$COVERAGE" = true ]; then
        TEST_COMMAND="npm run test:coverage"
    elif [ "$WATCH" = true ]; then
        TEST_COMMAND="npm run test:watch"
    else
        TEST_COMMAND="npm test"
    fi
    
    if [ "$VERBOSE" = true ]; then
        TEST_COMMAND="$TEST_COMMAND -- --verbose"
    fi
    
    if run_test_suite "Backend Unit Tests" "$TEST_COMMAND" "backend"; then
        BACKEND_RESULT=0
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        BACKEND_RESULT=1
    fi
fi

# Run frontend tests
if [ "$SPECIFIC_SUITE" = "frontend" ] || [ -z "$SPECIFIC_SUITE" ]; then
    echo ""
    echo "=================================="
    print_status "Frontend Tests"
    echo "=================================="
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$COVERAGE" = true ]; then
        TEST_COMMAND="npm run test:coverage"
    elif [ "$WATCH" = true ]; then
        TEST_COMMAND="npm run test:watch"
    else
        TEST_COMMAND="npm test -- --run"
    fi
    
    if [ "$VERBOSE" = true ]; then
        TEST_COMMAND="$TEST_COMMAND -- --reporter=verbose"
    fi
    
    if run_test_suite "Frontend Unit Tests" "$TEST_COMMAND" "frontend"; then
        FRONTEND_RESULT=0
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FRONTEND_RESULT=1
    fi
fi

# Run E2E tests
if [ "$SPECIFIC_SUITE" = "e2e" ] || [ -z "$SPECIFIC_SUITE" ]; then
    echo ""
    echo "=================================="
    print_status "End-to-End Tests"
    echo "=================================="
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check if development servers are running
    if ! curl -s http://localhost:5173 >/dev/null 2>&1; then
        print_warning "Frontend development server not running. Starting servers for E2E tests..."
        
        # Start servers in background
        cd backend
        npm run dev > ../test-results/e2e-backend.log 2>&1 &
        BACKEND_PID=$!
        cd ..
        
        cd frontend
        npm run dev > ../test-results/e2e-frontend.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        
        # Wait for servers to be ready
        print_status "Waiting for servers to be ready..."
        sleep 10
        
        # Check if servers are responding
        if ! curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
            print_error "Backend server failed to start for E2E tests"
            E2E_RESULT=1
        elif ! curl -s http://localhost:5173 >/dev/null 2>&1; then
            print_error "Frontend server failed to start for E2E tests"
            E2E_RESULT=1
        else
            if run_test_suite "End-to-End Tests" "npm run test:e2e" "frontend"; then
                E2E_RESULT=0
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                E2E_RESULT=1
            fi
        fi
        
        # Clean up background processes
        if [ -n "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        if [ -n "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID 2>/dev/null || true
        fi
    else
        if run_test_suite "End-to-End Tests" "npm run test:e2e" "frontend"; then
            E2E_RESULT=0
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            E2E_RESULT=1
        fi
    fi
fi

# Generate test report
echo ""
echo "=================================="
print_status "Test Results Summary"
echo "=================================="

if [ "$SPECIFIC_SUITE" = "backend" ] || [ -z "$SPECIFIC_SUITE" ]; then
    if [ $BACKEND_RESULT -eq 0 ]; then
        print_success "✓ Backend Tests: PASSED"
    else
        print_error "✗ Backend Tests: FAILED"
    fi
fi

if [ "$SPECIFIC_SUITE" = "frontend" ] || [ -z "$SPECIFIC_SUITE" ]; then
    if [ $FRONTEND_RESULT -eq 0 ]; then
        print_success "✓ Frontend Tests: PASSED"
    else
        print_error "✗ Frontend Tests: FAILED"
    fi
fi

if [ "$SPECIFIC_SUITE" = "e2e" ] || [ -z "$SPECIFIC_SUITE" ]; then
    if [ $E2E_RESULT -eq 0 ]; then
        print_success "✓ E2E Tests: PASSED"
    else
        print_error "✗ E2E Tests: FAILED"
    fi
fi

echo ""
echo "Tests Passed: $PASSED_TESTS/$TOTAL_TESTS"

# Show coverage information if requested
if [ "$COVERAGE" = true ]; then
    echo ""
    print_status "Coverage Reports:"
    if [ -f "backend/coverage/lcov-report/index.html" ]; then
        echo "  Backend: backend/coverage/lcov-report/index.html"
    fi
    if [ -f "frontend/coverage/index.html" ]; then
        echo "  Frontend: frontend/coverage/index.html"
    fi
fi

# Show test artifacts
echo ""
print_status "Test Artifacts:"
echo "  Results: test-results/"
if [ "$COVERAGE" = true ]; then
    echo "  Coverage: coverage/"
fi

# Exit with appropriate code
TOTAL_RESULT=$((BACKEND_RESULT + FRONTEND_RESULT + E2E_RESULT))

if [ $TOTAL_RESULT -eq 0 ]; then
    echo ""
    print_success "All tests passed! 🎉"
    exit 0
else
    echo ""
    print_error "Some tests failed. Please check the output above."
    exit 1
fi