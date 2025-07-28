#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function createDirectoryIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function main() {
  console.log('🚀 Ideas Tracker Setup Script');
  console.log('==============================\n');

  try {
    // Database Configuration
    console.log('📊 Database Configuration');
    const dbHost = await question('Database host (default: localhost): ') || 'localhost';
    const dbPort = await question('Database port (default: 5432): ') || '5432';
    const dbName = await question('Database name (default: ideas_tracker): ') || 'ideas_tracker';
    const dbUser = await question('Database username: ');
    const dbPassword = await question('Database password: ');

    // Application Configuration
    console.log('\n🔐 Application Configuration');
    const jwtSecret = await question('JWT Secret (leave empty to generate): ') || 
      require('crypto').randomBytes(64).toString('hex');
    const jwtRefreshSecret = await question('JWT Refresh Secret (leave empty to generate): ') || 
      require('crypto').randomBytes(64).toString('hex');
    const appPort = await question('Application port (default: 3001): ') || '3001';

    // Admin User Configuration
    console.log('\n👤 Admin User Configuration');
    const adminEmail = await question('Admin email: ');
    const adminUsername = await question('Admin username: ');
    const adminPassword = await question('Admin password: ');

    // Create configuration directories
    createDirectoryIfNotExists('config');
    createDirectoryIfNotExists('backend/config');

    // Create .env file
    const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# Application Configuration
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
PORT=${appPort}
NODE_ENV=development

# Admin Configuration
ADMIN_EMAIL=${adminEmail}
ADMIN_USERNAME=${adminUsername}
ADMIN_PASSWORD=${adminPassword}
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file');

    // Create database config
    const dbConfig = {
      host: dbHost,
      port: parseInt(dbPort),
      database: dbName,
      user: dbUser,
      password: dbPassword,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

    fs.writeFileSync('config/database.json', JSON.stringify(dbConfig, null, 2));
    console.log('✅ Created database configuration');

    // Create app config
    const appConfig = {
      pagination: {
        defaultLimit: 20,
        maxLimit: 100
      },
      rateLimit: {
        windowMs: 900000,
        max: 100
      },
      jwt: {
        accessTokenExpiry: '1h',
        refreshTokenExpiry: '7d'
      }
    };

    fs.writeFileSync('config/app.json', JSON.stringify(appConfig, null, 2));
    console.log('✅ Created application configuration');

    // Create tags config
    const tagsConfig = {
      tags: [
        { id: 'technology', name: 'Technology', color: '#3b82f6' },
        { id: 'business', name: 'Business', color: '#10b981' },
        { id: 'design', name: 'Design', color: '#f59e0b' },
        { id: 'marketing', name: 'Marketing', color: '#ef4444' },
        { id: 'product', name: 'Product', color: '#8b5cf6' },
        { id: 'research', name: 'Research', color: '#06b6d4' },
        { id: 'innovation', name: 'Innovation', color: '#f97316' },
        { id: 'improvement', name: 'Improvement', color: '#84cc16' }
      ]
    };

    fs.writeFileSync('config/tags.json', JSON.stringify(tagsConfig, null, 2));
    console.log('✅ Created tags configuration');

    // Create .env.example
    const envExample = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ideas_tracker
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Application Configuration
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
PORT=3001
NODE_ENV=development

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
`;

    fs.writeFileSync('.env.example', envExample);
    console.log('✅ Created .env.example template');

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Install dependencies: npm run install:all');
    console.log('2. Run database migrations: npm run migrate');
    console.log('3. Create admin user: npm run create-admin');
    console.log('4. Start development: npm run dev');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();