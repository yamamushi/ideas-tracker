#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const migrations = [
  {
    name: '001_create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `
  },
  {
    name: '002_create_ideas_table',
    sql: `
      CREATE TABLE IF NOT EXISTS ideas (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tags TEXT[] DEFAULT '{}',
        vote_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_ideas_author_id ON ideas(author_id);
      CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at);
      CREATE INDEX IF NOT EXISTS idx_ideas_vote_count ON ideas(vote_count);
      CREATE INDEX IF NOT EXISTS idx_ideas_tags ON ideas USING GIN(tags);
    `
  },
  {
    name: '003_create_votes_table',
    sql: `
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
        vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, idea_id)
      );

      CREATE INDEX IF NOT EXISTS idx_votes_idea_id ON votes(idea_id);
      CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
    `
  },
  {
    name: '004_create_comments_table',
    sql: `
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
      CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
    `
  },
  {
    name: '005_create_migrations_table',
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: '006_create_vote_count_trigger',
    sql: `
      -- Function to update vote count
      CREATE OR REPLACE FUNCTION update_idea_vote_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE ideas 
          SET vote_count = (
            SELECT COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - 
                   COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END)
            FROM votes 
            WHERE idea_id = NEW.idea_id
          )
          WHERE id = NEW.idea_id;
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          UPDATE ideas 
          SET vote_count = (
            SELECT COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - 
                   COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END)
            FROM votes 
            WHERE idea_id = NEW.idea_id
          )
          WHERE id = NEW.idea_id;
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE ideas 
          SET vote_count = (
            SELECT COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - 
                   COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END)
            FROM votes 
            WHERE idea_id = OLD.idea_id
          )
          WHERE id = OLD.idea_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger
      DROP TRIGGER IF EXISTS trigger_update_vote_count ON votes;
      CREATE TRIGGER trigger_update_vote_count
        AFTER INSERT OR UPDATE OR DELETE ON votes
        FOR EACH ROW EXECUTE FUNCTION update_idea_vote_count();
    `
  }
];

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Create migrations table first
    await client.query(migrations[4].sql);

    // Check which migrations have been run
    const { rows: executedMigrations } = await client.query(
      'SELECT name FROM migrations'
    );
    const executedNames = executedMigrations.map(row => row.name);

    // Run pending migrations
    for (const migration of migrations) {
      if (!executedNames.includes(migration.name)) {
        console.log(`🔄 Running migration: ${migration.name}`);
        
        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migration.name]
          );
          await client.query('COMMIT');
          console.log(`✅ Completed migration: ${migration.name}`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      } else {
        console.log(`⏭️  Skipping migration: ${migration.name} (already executed)`);
      }
    }

    console.log('🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };