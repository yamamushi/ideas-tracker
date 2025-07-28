import { db } from '../src/utils/databaseAdapter';

describe('Fix Schema', () => {
  it('should add missing vote_count column', async () => {
    try {
      // Add the missing vote_count column
      await db.query("ALTER TABLE ideas ADD COLUMN vote_count INTEGER DEFAULT 0");
      console.log('Successfully added vote_count column');
      
      // Verify the column was added
      const createStatement = await db.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='ideas'");
      console.log('Updated ideas table CREATE statement:', createStatement.rows);
    } catch (error) {
      console.log('Error adding column:', error);
    }
  });
});