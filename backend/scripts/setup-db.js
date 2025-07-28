#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupDatabase() {
  const rl = createInterface();
  
  try {
    colorLog('blue', '='.repeat(50));
    colorLog('blue', 'Ideas Tracker Database Setup');
    colorLog('blue', '='.repeat(50));
    console.log();
    
    // Check if config file exists
    const configPath = path.join(__dirname, '..', 'config', 'database.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      colorLog('yellow', `Found existing database configuration: ${config.type || 'postgresql'}`);
      
      const useExisting = await question(rl, 'Use existing configuration? (y/n): ');
      if (useExisting.toLowerCase() === 'y') {
        if (config.type === 'sqlite') {
          await setupSQLite(config);
        } else {
          await setupPostgreSQL(config);
        }
        rl.close();
        return;
      }
    }
    
    // Ask for database type
    console.log('Choose database type:');
    console.log('1. SQLite (recommended for development and small deployments)');
    console.log('2. PostgreSQL (recommended for production)');
    console.log();
    
    const dbChoice = await question(rl, 'Enter your choice (1 or 2): ');
    
    if (dbChoice === '1') {
      await setupSQLiteInteractive(rl);
    } else if (dbChoice === '2') {
      await setupPostgreSQLInteractive(rl);
    } else {
      colorLog('red', 'Invalid choice. Exiting.');
      process.exit(1);
    }
    
  } catch (error) {
    colorLog('red', `Error: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function setupSQLiteInteractive(rl) {
  colorLog('cyan', 'Setting up SQLite database...');
  console.log();
  
  const dbPath = await question(rl, 'Database file path (./data/ideas_tracker.db): ') || './data/ideas_tracker.db';
  const readonly = await question(rl, 'Read-only mode? (y/n): ');
  
  const config = {
    type: 'sqlite',
    database: dbPath,
    readonly: readonly.toLowerCase() === 'y'
  };
  
  await setupSQLite(config);
  await saveConfig(config);
}

async function setupPostgreSQLInteractive(rl) {
  colorLog('cyan', 'Setting up PostgreSQL database...');
  console.log();
  
  const host = await question(rl, 'Database host (localhost): ') || 'localhost';
  const port = parseInt(await question(rl, 'Database port (5432): ') || '5432');
  const database = await question(rl, 'Database name (ideas_tracker): ') || 'ideas_tracker';
  const user = await question(rl, 'Database user: ');
  const password = await question(rl, 'Database password: ');
  
  const config = {
    type: 'postgresql',
    host,
    port,
    database,
    user,
    password,
    ssl: false
  };
  
  await setupPostgreSQL(config);
  await saveConfig(config);
}

async function setupSQLite(config) {
  colorLog('blue', 'Setting up SQLite database...');
  
  // Ensure data directory exists
  const dbDir = path.dirname(path.resolve(config.database));
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    colorLog('green', `Created directory: ${dbDir}`);
  }
  
  // Test SQLite setup by importing the database module
  try {
    // We'll let the application create the database and tables automatically
    // when it starts up, since we have the schema in the database.ts file
    colorLog('green', `SQLite database will be created at: ${path.resolve(config.database)}`);
    colorLog('green', 'Database tables will be created automatically on first run.');
    
    // Create a sample admin user script
    await createAdminUserScript();
    
    colorLog('green', 'SQLite setup completed successfully!');
    console.log();
    colorLog('cyan', 'Next steps:');
    console.log('1. Start the application with: npm run dev');
    console.log('2. Create an admin user with: npm run create:admin');
    
  } catch (error) {
    colorLog('red', `SQLite setup failed: ${error.message}`);
    throw error;
  }
}

async function setupPostgreSQL(config) {
  colorLog('blue', 'Setting up PostgreSQL database...');
  
  try {
    const { Pool } = require('pg');
    
    // Test connection
    const pool = new Pool(config);
    await pool.query('SELECT NOW()');
    await pool.end();
    
    colorLog('green', 'PostgreSQL connection successful!');
    colorLog('yellow', 'Note: You will need to run database migrations manually.');
    
    await createAdminUserScript();
    
    colorLog('green', 'PostgreSQL setup completed successfully!');
    console.log();
    colorLog('cyan', 'Next steps:');
    console.log('1. Run database migrations (if available)');
    console.log('2. Start the application with: npm run dev');
    console.log('3. Create an admin user with: npm run create:admin');
    
  } catch (error) {
    colorLog('red', `PostgreSQL setup failed: ${error.message}`);
    colorLog('yellow', 'Please check your database credentials and ensure PostgreSQL is running.');
    throw error;
  }
}

async function saveConfig(config) {
  const configPath = path.join(__dirname, '..', 'config', 'database.json');
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  colorLog('green', `Configuration saved to: ${configPath}`);
}

async function createAdminUserScript() {
  const scriptPath = path.join(__dirname, 'create-admin.js');
  
  if (!fs.existsSync(scriptPath)) {
    const adminScript = `#!/usr/bin/env node

const path = require('path');

// Add the src directory to the module path for development
require('ts-node/register');

async function createAdmin() {
  try {
    const { initializeDatabase } = require('../src/config/database.ts');
    const { UserModel } = require('../src/models/User.ts');
    
    // Initialize database
    initializeDatabase();
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    function question(prompt) {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    }
    
    console.log('Create Admin User');
    console.log('================');
    
    const username = await question('Username: ');
    const email = await question('Email: ');
    const password = await question('Password: ');
    
    const adminUser = await UserModel.create({
      username,
      email,
      password,
      isAdmin: true
    });
    
    console.log('\\nAdmin user created successfully!');
    console.log(\`ID: \${adminUser.id}\`);
    console.log(\`Username: \${adminUser.username}\`);
    console.log(\`Email: \${adminUser.email}\`);
    
    rl.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();
`;
    
    fs.writeFileSync(scriptPath, adminScript);
    fs.chmodSync(scriptPath, '755');
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupDatabase };