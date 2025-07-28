describe('Database Tests', () => {
  let db: any;
  
  beforeAll(async () => {
    // Import after environment is set up
    const { initializeDatabase } = await import('../src/config/database');
    const dbAdapter = await import('../src/utils/databaseAdapter');
    db = dbAdapter.db;
    
    await initializeDatabase();
  });

  it('should initialize database tables', async () => {
    const result = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = result.rows.map(row => row.name);
    
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('ideas');
    expect(tableNames).toContain('comments');
    expect(tableNames).toContain('votes');
  });

  it('should handle boolean parameters correctly', async () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?) RETURNING id',
      [`testuser-${Date.now()}`, uniqueEmail, 'hashedpassword', true]
    );
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBeDefined();
    
    // Verify the boolean was stored correctly
    const user = await db.query('SELECT is_admin FROM users WHERE id = ?', [result.rows[0].id]);
    expect(user.rows[0].is_admin).toBe(1); // SQLite stores as integer
  });
});