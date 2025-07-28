#!/usr/bin/env node

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
    
    console.log('\nAdmin user created successfully!');
    console.log(`ID: ${adminUser.id}`);
    console.log(`Username: ${adminUser.username}`);
    console.log(`Email: ${adminUser.email}`);
    
    rl.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();
