import { Pool } from 'pg';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

interface PostgreSQLConfig {
  type: 'postgresql';
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: any;
}

interface SQLiteConfig {
  type: 'sqlite';
  database: string;
  readonly?: boolean;
}

type DatabaseConfig = PostgreSQLConfig | SQLiteConfig;

let pool: Pool | null = null;
let sqlite: Database.Database | null = null;
let currentConfig: DatabaseConfig | null = null;

export function initializeDatabase(): Pool | Database.Database {
  if (pool || sqlite) {
    return pool || sqlite!;
  }

  let config: DatabaseConfig;

  // Try to load from config file first, then fall back to environment variables
  try {
    const configPath = path.join(process.cwd(), 'config', 'database.json');
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      throw new Error('Config file not found');
    }
  } catch {
    // Fallback to environment variables - default to SQLite
    const dbType = process.env['DB_TYPE'] || 'sqlite';
    
    if (dbType === 'sqlite') {
      config = {
        type: 'sqlite',
        database: process.env['DB_PATH'] || path.join(process.cwd(), 'data', 'ideas_tracker.db'),
        readonly: process.env['DB_READONLY'] === 'true'
      };
    } else {
      config = {
        type: 'postgresql',
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        database: process.env['DB_NAME'] || 'ideas_tracker',
        user: process.env['DB_USER'] || '',
        password: process.env['DB_PASSWORD'] || '',
        ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false
      };
    }
  }

  currentConfig = config;

  if (config.type === 'sqlite') {
    // Ensure data directory exists
    const dbDir = path.dirname(config.database);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    sqlite = new Database(config.database, {
      readonly: config.readonly || false,
      fileMustExist: false,
      timeout: 5000,
      verbose: process.env['NODE_ENV'] === 'development' ? console.log : undefined
    });

    // Enable WAL mode for better concurrency
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('cache_size = 1000000');
    sqlite.pragma('temp_store = memory');

    // Initialize SQLite schema
    initializeSQLiteSchema(sqlite);

    return sqlite;
  } else {
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    return pool;
  }
}

export function getDatabase(): Pool | Database.Database {
  if (!pool && !sqlite) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool || sqlite!;
}

export function getDatabaseType(): 'postgresql' | 'sqlite' {
  if (!currentConfig) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return currentConfig.type;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
  currentConfig = null;
  
  // Reset the database adapter singleton
  const { DatabaseAdapter } = await import('../utils/databaseAdapter');
  DatabaseAdapter.resetInstance();
}

function initializeSQLiteSchema(db: Database.Database): void {
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      tags TEXT DEFAULT '[]',
      vote_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      idea_id INTEGER NOT NULL,
      vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
      UNIQUE(user_id, idea_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      idea_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_ideas_author_id ON ideas(author_id);
    CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at);
    CREATE INDEX IF NOT EXISTS idx_votes_idea_id ON votes(idea_id);
    CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
    CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
    CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

    -- Create triggers to update updated_at timestamps
    CREATE TRIGGER IF NOT EXISTS update_users_updated_at
      AFTER UPDATE ON users
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

    CREATE TRIGGER IF NOT EXISTS update_ideas_updated_at
      AFTER UPDATE ON ideas
      BEGIN
        UPDATE ideas SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

    CREATE TRIGGER IF NOT EXISTS update_comments_updated_at
      AFTER UPDATE ON comments
      BEGIN
        UPDATE comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
  `);
}