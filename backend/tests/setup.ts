import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from '../src/config/database';

// Load test environment variables first
dotenv.config({ path: '.env.test' });

// Initialize database immediately for tests
(async () => {
  try {
    await initializeDatabase();
    console.log('Test database initialized');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
  }
})();

// Setup test database connection
beforeAll(async () => {
  // Database should already be initialized
}, 30000);

// Note: Database cleanup is handled within individual test suites
// to allow tests within a suite to share data when needed

// Cleanup after all tests
afterAll(async () => {
  try {
    await closeDatabase();
  } catch (error) {
    console.warn('Error closing test database:', error);
  }
});

// Global test timeout
jest.setTimeout(30000);