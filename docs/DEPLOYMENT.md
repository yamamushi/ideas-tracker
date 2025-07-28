# Deployment Guide

This guide covers deploying the Ideas Tracker application to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Application Deployment](#application-deployment)
- [Web Server Configuration](#web-server-configuration)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

### System Requirements
- **Server**: Linux (Ubuntu 20.04+ recommended)
- **Node.js**: Version 18.0.0 or higher
- **PostgreSQL**: Version 12.0 or higher
- **Web Server**: Nginx or Apache
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)
- **Domain**: Configured DNS pointing to your server

### Security Considerations
- Firewall configured (UFW recommended)
- SSH key-based authentication
- Regular security updates
- Non-root user for application
- Database access restricted

## Environment Setup

### 1. Create Application User
```bash
# Create dedicated user for the application
sudo adduser --system --group --home /opt/ideas-tracker ideas-tracker

# Create application directories
sudo mkdir -p /opt/ideas-tracker/{app,logs,config}
sudo chown -R ideas-tracker:ideas-tracker /opt/ideas-tracker
```

### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### 3. Configure Firewall
```bash
# Enable UFW
sudo ufw enable

# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432
```

## Database Setup

### 1. Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE ideas_tracker_prod;
CREATE USER ideas_tracker_user WITH PASSWORD 'your_secure_production_password';
GRANT ALL PRIVILEGES ON DATABASE ideas_tracker_prod TO ideas_tracker_user;

# Configure for production
ALTER DATABASE ideas_tracker_prod SET timezone TO 'UTC';
\q
```

### 2. Secure PostgreSQL
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/12/main/postgresql.conf

# Set these values:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB

# Edit pg_hba.conf for security
sudo nano /etc/postgresql/12/main/pg_hba.conf

# Ensure only local connections are allowed:
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Database Backup Setup
```bash
# Create backup script
sudo nano /opt/ideas-tracker/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/ideas-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ideas_tracker_prod"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U ideas_tracker_user -h localhost $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
# Make executable and set up cron
sudo chmod +x /opt/ideas-tracker/backup-db.sh
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/ideas-tracker/backup-db.sh
```

## Application Deployment

### 1. Deploy Application Code
```bash
# Clone repository
cd /opt/ideas-tracker
sudo -u ideas-tracker git clone https://github.com/your-username/ideas-tracker.git app
cd app

# Install dependencies
sudo -u ideas-tracker npm install --prefix backend
sudo -u ideas-tracker npm install --prefix frontend

# Build applications
sudo -u ideas-tracker npm run build --prefix backend
sudo -u ideas-tracker npm run build --prefix frontend
```

### 2. Environment Configuration

#### Backend Environment
```bash
# Create production environment file
sudo -u ideas-tracker nano /opt/ideas-tracker/app/backend/.env.production
```

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ideas_tracker_prod
DB_USER=ideas_tracker_user
DB_PASSWORD=your_secure_production_password

# JWT Secrets (generate new ones for production)
JWT_SECRET=your_super_secure_jwt_secret_64_chars_minimum_length_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_64_chars_minimum_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# CORS
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=/opt/ideas-tracker/logs/app.log
```

#### Frontend Environment
```bash
# Create production environment file
sudo -u ideas-tracker nano /opt/ideas-tracker/app/frontend/.env.production
```

```env
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=Ideas Tracker
VITE_APP_VERSION=1.0.0
```

### 3. Database Migration
```bash
# Run database setup
cd /opt/ideas-tracker/app/backend
sudo -u ideas-tracker NODE_ENV=production npm run setup:db
```

### 4. Process Management with PM2
```bash
# Create PM2 ecosystem file
sudo -u ideas-tracker nano /opt/ideas-tracker/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'ideas-tracker-api',
    script: '/opt/ideas-tracker/app/backend/dist/server.js',
    cwd: '/opt/ideas-tracker/app/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: '/opt/ideas-tracker/logs/api-error.log',
    out_file: '/opt/ideas-tracker/logs/api-out.log',
    log_file: '/opt/ideas-tracker/logs/api.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

```bash
# Start application with PM2
sudo -u ideas-tracker pm2 start /opt/ideas-tracker/ecosystem.config.js

# Save PM2 configuration
sudo -u ideas-tracker pm2 save

# Setup PM2 startup script
sudo pm2 startup systemd -u ideas-tracker --hp /opt/ideas-tracker
```

## Web Server Configuration

### Nginx Configuration

#### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/ideas-tracker
```

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend (React App)
    location / {
        root /opt/ideas-tracker/app/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Routes
    location /api/ {
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints with stricter rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### 2. Enable Site and SSL
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ideas-tracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Restart Nginx
sudo systemctl restart nginx
```

### Apache Configuration (Alternative)

#### 1. Enable Required Modules
```bash
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
```

#### 2. Create Virtual Host
```bash
sudo nano /etc/apache2/sites-available/ideas-tracker.conf
```

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    DocumentRoot /opt/ideas-tracker/app/frontend/dist
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # Security Headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    # Frontend Routes
    <Directory "/opt/ideas-tracker/app/frontend/dist">
        Options -Indexes
        AllowOverride All
        Require all granted
        
        # Handle React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # API Proxy
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:3001/
    ProxyPassReverse /api/ http://127.0.0.1:3001/
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/ideas-tracker-error.log
    CustomLog ${APACHE_LOG_DIR}/ideas-tracker-access.log combined
</VirtualHost>
```

```bash
# Enable site
sudo a2ensite ideas-tracker.conf
sudo systemctl restart apache2
```

## Docker Deployment

### 1. Create Dockerfiles

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Frontend Nginx Config
```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Docker Compose Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  database:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: ideas_tracker_prod
      POSTGRES_USER: ideas_tracker_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DB_HOST: database
      DB_PORT: 5432
      DB_NAME: ideas_tracker_prod
      DB_USER: ideas_tracker_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - database
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### 3. Deploy with Docker
```bash
# Create environment file
echo "DB_PASSWORD=your_secure_password" > .env
echo "JWT_SECRET=your_jwt_secret" >> .env
echo "JWT_REFRESH_SECRET=your_refresh_secret" >> .env

# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Cloud Deployment

### AWS Deployment

#### 1. EC2 Setup
```bash
# Launch EC2 instance (t3.medium recommended)
# Configure security groups:
# - SSH (22) from your IP
# - HTTP (80) from anywhere
# - HTTPS (443) from anywhere

# Connect and setup
ssh -i your-key.pem ubuntu@your-ec2-ip

# Follow the standard deployment steps above
```

#### 2. RDS Database
```bash
# Create RDS PostgreSQL instance
# Configure security group to allow access from EC2
# Update backend .env with RDS endpoint
```

#### 3. Application Load Balancer
```bash
# Create ALB with SSL certificate
# Configure target groups for backend
# Set up health checks
```

### DigitalOcean Deployment

#### 1. Droplet Setup
```bash
# Create Ubuntu 20.04 droplet
# Add SSH key
# Configure firewall

# Follow standard deployment steps
```

#### 2. Managed Database
```bash
# Create managed PostgreSQL database
# Configure firewall rules
# Update connection strings
```

### Heroku Deployment

#### 1. Prepare Application
```bash
# Create Procfile
echo "web: npm start" > backend/Procfile

# Update package.json
"scripts": {
  "start": "node dist/server.js",
  "heroku-postbuild": "npm run build"
}
```

#### 2. Deploy
```bash
# Install Heroku CLI
# Login and create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

## Monitoring and Maintenance

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. Health Checks
```bash
# Create health check script
nano /opt/ideas-tracker/health-check.sh
```

```bash
#!/bin/bash
API_URL="https://yourdomain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "API is healthy"
    exit 0
else
    echo "API is down (HTTP $RESPONSE)"
    # Restart application
    pm2 restart ideas-tracker-api
    exit 1
fi
```

### 3. Automated Backups
```bash
# Database backup script (already created above)
# Add to crontab for regular backups

# File backup script
nano /opt/ideas-tracker/backup-files.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/ideas-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    /opt/ideas-tracker/app \
    /opt/ideas-tracker/ecosystem.config.js \
    /etc/nginx/sites-available/ideas-tracker

# Keep only last 7 days
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete
```

### 4. SSL Certificate Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Security Updates
```bash
# Create update script
nano /opt/ideas-tracker/update-system.sh
```

```bash
#!/bin/bash
# Update system packages
apt update && apt upgrade -y

# Update Node.js packages
cd /opt/ideas-tracker/app/backend
npm audit fix

cd /opt/ideas-tracker/app/frontend
npm audit fix

# Restart services
systemctl restart nginx
pm2 restart all
```

### 6. Performance Monitoring
```bash
# Install monitoring tools
npm install -g clinic

# Monitor application performance
clinic doctor -- node dist/server.js

# Database performance monitoring
sudo -u postgres psql -d ideas_tracker_prod -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;"
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs ideas-tracker-api

# Check environment variables
pm2 env 0
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U ideas_tracker_user -d ideas_tracker_prod

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-12-main.log
```

#### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

## Performance Optimization

### Database Optimization
```sql
-- Create additional indexes
CREATE INDEX CONCURRENTLY idx_ideas_tags ON ideas USING GIN(tags);
CREATE INDEX CONCURRENTLY idx_ideas_search ON ideas USING GIN(to_tsvector('english', title || ' ' || description));

-- Analyze tables
ANALYZE ideas;
ANALYZE votes;
ANALYZE comments;
ANALYZE users;
```

### Application Optimization
```bash
# Enable Node.js clustering
# Update ecosystem.config.js to use more instances
instances: 'max', // Use all CPU cores

# Enable compression in Nginx
# Already included in configuration above
```

### Caching
```bash
# Install Redis for caching
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set maxmemory and eviction policy
```

This deployment guide provides comprehensive instructions for deploying the Ideas Tracker application to production. Choose the deployment method that best fits your infrastructure and requirements.