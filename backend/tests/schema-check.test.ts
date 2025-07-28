import { db } from '../src/utils/databaseAdapter';

describe('Schema Check', () => {
  it('should show current schema', async () => {
    // Check what tables exist
    const tables = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.rows);

    // Check the ideas table schema
    try {
      const ideasSchema = await db.query("PRAGMA table_info(ideas)");
      console.log('Ideas table schema:', ideasSchema.rows);
    } catch (error) {
      console.log('Error getting schema:', error);
    }

    // Try to describe the table differently
    try {
      const createStatement = await db.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='ideas'");
      console.log('Ideas table CREATE statement:', createStatement.rows);
    } catch (error) {
      console.log('Error getting CREATE statement:', error);
    }
  });
});