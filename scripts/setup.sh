#!/bin/bash

# Setup startup script
# Guides through initial configuration of the Ideas Tracker application

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
    echo -e "${BLUE}[SETUP]${NC} $1"
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

# Function to prompt user for input
prompt_user() {
    local prompt_text=$1
    local default_value=$2
    local user_input
    
    if [ -n "$default_value" ]; then
        printf "${CYAN}%s${NC} [${YELLOW}%s${NC}]: " "$prompt_text" "$default_value"
    else
        printf "${CYAN}%s${NC}: " "$prompt_text"
    fi
    
    read -r user_input
    
    if [ -z "$user_input" ] && [ -n "$default_value" ]; then
        printf "%s" "$default_value"
    else
        printf "%s" "$user_input"
    fi
}

# Function to prompt for password (hidden input)
prompt_password() {
    local prompt_text=$1
    local password
    
    echo -n -e "${CYAN}$prompt_text${NC}: "
    read -r -s password
    echo
    echo "$password"
}

# Function to generate random string
generate_secret() {
    openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to test database connection
test_db_connection() {
    local host=$1
    local port=$2
    local database=$3
    local user=$4
    local password=$5
    
    PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT 1;" >/dev/null 2>&1
}

print_status "Ideas Tracker Setup Wizard"
echo "==========================================="
echo ""
echo "This script will guide you through the initial setup of the Ideas Tracker application."
echo "Please have the following information ready:"
echo "  • PostgreSQL database credentials"
echo "  • Domain name (for production)"
echo "  • Email for SSL certificate (for production)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    print_info "Visit: https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

if ! command_exists psql; then
    print_error "PostgreSQL client is not installed. Please install PostgreSQL and try again."
    print_info "Ubuntu/Debian: sudo apt install postgresql-client"
    print_info "macOS: brew install postgresql"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "Prerequisites check passed"

# Determine setup type
echo ""
print_status "Setup Configuration"
echo "1. Development setup (local development)"
echo "2. Production setup (server deployment)"
echo ""

while true; do
    printf "${CYAN}Select setup type (1 or 2)${NC} [${YELLOW}1${NC}]: "
    read -r SETUP_TYPE
    
    # Use default if empty
    if [ -z "$SETUP_TYPE" ]; then
        SETUP_TYPE="1"
    fi
    
    case $SETUP_TYPE in
        1)
            ENVIRONMENT="development"
            break
            ;;
        2)
            ENVIRONMENT="production"
            break
            ;;
        *)
            print_error "Invalid selection '$SETUP_TYPE'. Please choose 1 or 2."
            ;;
    esac
done

print_success "Selected: $ENVIRONMENT setup"

# Database Configuration
echo ""
print_status "Database Configuration"

echo "Choose database type:"
echo "1. SQLite (recommended for development and small deployments)"
echo "2. PostgreSQL (recommended for production)"
echo ""

while true; do
    printf "${CYAN}Select database type (1 or 2)${NC} [${YELLOW}1${NC}]: "
    read -r DB_TYPE_CHOICE
    
    # Use default if empty
    if [ -z "$DB_TYPE_CHOICE" ]; then
        DB_TYPE_CHOICE="1"
    fi
    
    case $DB_TYPE_CHOICE in
        1)
            DB_TYPE="sqlite"
            if [ "$ENVIRONMENT" = "production" ]; then
                printf "${CYAN}Database file path${NC} [${YELLOW}/opt/ideas-tracker/data/ideas_tracker.db${NC}]: "
                read -r DB_PATH
                if [ -z "$DB_PATH" ]; then
                    DB_PATH="/opt/ideas-tracker/data/ideas_tracker.db"
                fi
            else
                printf "${CYAN}Database file path${NC} [${YELLOW}./backend/data/ideas_tracker.db${NC}]: "
                read -r DB_PATH
                if [ -z "$DB_PATH" ]; then
                    DB_PATH="./backend/data/ideas_tracker.db"
                fi
            fi
            
            # Create database directory
            DB_DIR=$(dirname "$DB_PATH")
            mkdir -p "$DB_DIR"
            print_success "SQLite database will be created at: $DB_PATH"
            break
            ;;
        2)
            DB_TYPE="postgresql"
            printf "${CYAN}Database host${NC} [${YELLOW}localhost${NC}]: "
            read -r DB_HOST
            if [ -z "$DB_HOST" ]; then
                DB_HOST="localhost"
            fi
            
            printf "${CYAN}Database port${NC} [${YELLOW}5432${NC}]: "
            read -r DB_PORT
            if [ -z "$DB_PORT" ]; then
                DB_PORT="5432"
            fi

            if [ "$ENVIRONMENT" = "production" ]; then
                printf "${CYAN}Database name${NC} [${YELLOW}ideas_tracker_prod${NC}]: "
                read -r DB_NAME
                if [ -z "$DB_NAME" ]; then
                    DB_NAME="ideas_tracker_prod"
                fi
                
                printf "${CYAN}Database user${NC} [${YELLOW}ideas_tracker_user${NC}]: "
                read -r DB_USER
                if [ -z "$DB_USER" ]; then
                    DB_USER="ideas_tracker_user"
                fi
            else
                printf "${CYAN}Database name${NC} [${YELLOW}ideas_tracker${NC}]: "
                read -r DB_NAME
                if [ -z "$DB_NAME" ]; then
                    DB_NAME="ideas_tracker"
                fi
                
                printf "${CYAN}Database user${NC} [${YELLOW}ideas_tracker_user${NC}]: "
                read -r DB_USER
                if [ -z "$DB_USER" ]; then
                    DB_USER="ideas_tracker_user"
                fi
            fi

            printf "${CYAN}Database password${NC}: "
            read -r -s DB_PASSWORD
            echo

            # Test database connection
            print_status "Testing database connection..."
            if test_db_connection "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASSWORD"; then
                print_success "Database connection successful"
            else
                print_warning "Database connection failed. The database might not exist yet."
                
                printf "${CYAN}Would you like to create the database? (y/n)${NC} [${YELLOW}y${NC}]: "
                read -r CREATE_DB
                if [ -z "$CREATE_DB" ]; then
                    CREATE_DB="y"
                fi
                if [ "$CREATE_DB" = "y" ] || [ "$CREATE_DB" = "Y" ]; then
                    print_status "Creating database..."
                    
                    # Try to create database
                    PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || {
                        print_warning "Could not create database automatically. Please create it manually:"
                        print_info "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
                    }
                fi
            fi
            break
            ;;
        *)
            print_error "Invalid selection '$DB_TYPE_CHOICE'. Please choose 1 or 2."
            ;;
    esac
done

# JWT Configuration
echo ""
print_status "Security Configuration"

print_info "Generating JWT secrets..."
JWT_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)

print_success "JWT secrets generated"

# Server Configuration
echo ""
print_status "Server Configuration"

if [ "$ENVIRONMENT" = "production" ]; then
    printf "${CYAN}Domain name (e.g., yourdomain.com)${NC}: "
    read -r DOMAIN
    FRONTEND_URL="https://$DOMAIN"
    API_URL="https://$DOMAIN/api"
    
    # SSL Configuration
    printf "${CYAN}Email for SSL certificate${NC} [${YELLOW}admin@$DOMAIN${NC}]: "
    read -r EMAIL
    if [ -z "$EMAIL" ]; then
        EMAIL="admin@$DOMAIN"
    fi
else
    FRONTEND_URL="http://localhost:5173"
    API_URL="http://localhost:3001/api"
fi

# Create backend environment file
print_status "Creating backend environment configuration..."

if [ "$ENVIRONMENT" = "production" ]; then
    ENV_FILE="backend/.env.production"
else
    ENV_FILE="backend/.env"
fi

if [ "$DB_TYPE" = "sqlite" ]; then
    cat > "$ENV_FILE" << EOF
# Environment Configuration
NODE_ENV=$ENVIRONMENT
PORT=3001

# Database Configuration
DATABASE_TYPE=sqlite
SQLITE_PATH=$DB_PATH

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=10

# CORS
FRONTEND_URL=$FRONTEND_URL
EOF
else
    cat > "$ENV_FILE" << EOF
# Environment Configuration
NODE_ENV=$ENVIRONMENT
PORT=3001

# Database Configuration
DATABASE_TYPE=postgresql
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=10

# CORS
FRONTEND_URL=$FRONTEND_URL
EOF
fi

if [ "$ENVIRONMENT" = "production" ]; then
    echo "LOG_FILE=/opt/ideas-tracker/logs/app.log" >> "$ENV_FILE"
fi

print_success "Backend environment file created: $ENV_FILE"

# Create frontend environment file
print_status "Creating frontend environment configuration..."

if [ "$ENVIRONMENT" = "production" ]; then
    FRONTEND_ENV_FILE="frontend/.env.production"
else
    FRONTEND_ENV_FILE="frontend/.env"
fi

cat > "$FRONTEND_ENV_FILE" << EOF
VITE_API_URL=$API_URL
VITE_APP_NAME=Ideas Tracker
VITE_APP_VERSION=1.0.0
EOF

print_success "Frontend environment file created: $FRONTEND_ENV_FILE"

# Install dependencies
echo ""
print_status "Installing dependencies..."

print_status "Installing backend dependencies..."
cd backend
npm install
cd ..

print_status "Installing frontend dependencies..."
cd frontend
npm install
cd ..

print_success "Dependencies installed"

# Database setup
echo ""
print_status "Database will be initialized on first run"
print_info "The database tables will be created automatically when you start the backend"

# Admin user info
echo ""
print_status "Admin User Setup"
print_info "You can create an admin user after starting the application by:"
print_info "1. Registering a normal user account"
print_info "2. Manually updating the database to set is_admin=1 for that user"
print_info "3. Or using the API to promote a user to admin"

# Production-specific setup
if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    print_status "Production Setup"
    
    # Create systemd service
    printf "${CYAN}Create systemd service? (y/n)${NC} [${YELLOW}y${NC}]: "
    read -r CREATE_SERVICE
    if [ -z "$CREATE_SERVICE" ]; then
        CREATE_SERVICE="y"
    fi
    if [ "$CREATE_SERVICE" = "y" ] || [ "$CREATE_SERVICE" = "Y" ]; then
        print_status "Creating systemd service..."
        
        sudo tee /etc/systemd/system/ideas-tracker.service > /dev/null << EOF
[Unit]
Description=Ideas Tracker Application
After=network.target

[Service]
Type=simple
User=ideas-tracker
WorkingDirectory=/opt/ideas-tracker
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable ideas-tracker
        
        print_success "Systemd service created and enabled"
    fi
    
    # SSL Certificate setup
    printf "${CYAN}Set up SSL certificate with Let's Encrypt? (y/n)${NC} [${YELLOW}y${NC}]: "
    read -r SETUP_SSL
    if [ -z "$SETUP_SSL" ]; then
        SETUP_SSL="y"
    fi
    if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
        print_status "Setting up SSL certificate..."
        
        if command_exists certbot; then
            sudo certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
            print_success "SSL certificate configured"
        else
            print_warning "Certbot not installed. Please install it and run:"
            print_info "sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos"
        fi
    fi
fi

# Create useful scripts
echo ""
print_status "Creating utility scripts..."

# Make scripts executable
chmod +x scripts/*.sh

print_success "Utility scripts are ready"

# Final instructions
echo ""
echo "==========================================="
print_success "Setup completed successfully!"
echo "==========================================="
echo ""

if [ "$ENVIRONMENT" = "development" ]; then
    echo "🚀 To start development:"
    echo "   ./scripts/dev.sh"
    echo ""
    echo "🧪 To run tests:"
    echo "   ./scripts/test.sh"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:3001/api"
else
    echo "🚀 To start production:"
    echo "   ./scripts/prod.sh"
    echo ""
    echo "📱 Application URLs:"
    echo "   Website: https://$DOMAIN"
    echo "   API: https://$DOMAIN/api"
    echo ""
    echo "🔧 Management:"
    echo "   sudo systemctl start ideas-tracker"
    echo "   sudo systemctl status ideas-tracker"
    echo "   sudo systemctl logs ideas-tracker"
fi

echo ""
echo "📚 Documentation:"
echo "   Setup Guide: docs/SETUP.md"
echo "   API Docs: docs/API.md"
echo "   Deployment: docs/DEPLOYMENT.md"
echo ""

if [ "$CREATE_ADMIN" = "y" ] || [ "$CREATE_ADMIN" = "Y" ]; then
    echo "👤 Admin Login:"
    echo "   Username: $ADMIN_USERNAME"
    echo "   Email: $ADMIN_EMAIL"
    echo ""
fi

print_success "Ideas Tracker is ready to use! 🎉"