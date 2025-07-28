import { Pool } from 'pg';
import Database from 'better-sqlite3';
import { getDatabaseType, getDatabase } from '../config/database';

export interface QueryResult {
  rows: any[];
  rowCount: number;
}

export class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private db: Pool | Database.Database;
  private type: 'postgresql' | 'sqlite';

  private constructor() {
    this.db = getDatabase();
    this.type = getDatabaseType();
  }

  public static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  public static resetInstance(): void {
    DatabaseAdapter.instance = null as any;
  }

  public async query(sql: string, params: any[] = []): Promise<QueryResult> {
    if (this.type === 'postgresql') {
      const pool = this.db as Pool;
      const result = await pool.query(sql, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0
      };
    } else {
      const sqlite = this.db as Database.Database;
      
      // Convert PostgreSQL-style parameters ($1, $2) to SQLite-style (?, ?)
      const sqliteQuery = this.convertPostgresToSQLite(sql);
      
      // Convert boolean values to integers for SQLite
      const convertedParams = params.map(param => {
        if (typeof param === 'boolean') {
          return param ? 1 : 0;
        }
        return param;
      });
      
      try {
        if (sqliteQuery.trim().toUpperCase().startsWith('SELECT') || 
            sqliteQuery.trim().toUpperCase().startsWith('WITH')) {
          const stmt = sqlite.prepare(sqliteQuery);
          const rows = stmt.all(...convertedParams);
          return {
            rows: rows,
            rowCount: rows.length
          };
        } else {
          const stmt = sqlite.prepare(sqliteQuery);
          const result = stmt.run(...convertedParams);
          
          // For INSERT statements, return the inserted row if possible
          if (sqliteQuery.trim().toUpperCase().startsWith('INSERT') && result.lastInsertRowid) {
            // Try to get the inserted row
            const tableName = this.extractTableName(sqliteQuery);
            if (tableName) {
              try {
                const selectStmt = sqlite.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
                const insertedRow = selectStmt.get(result.lastInsertRowid);
                return {
                  rows: insertedRow ? [insertedRow] : [],
                  rowCount: result.changes
                };
              } catch (e) {
                // If we can't get the inserted row, just return the changes count
                return {
                  rows: [],
                  rowCount: result.changes
                };
              }
            }
          }
          
          return {
            rows: [],
            rowCount: result.changes
          };
        }
      } catch (error) {
        if (process.env['NODE_ENV'] !== 'test') {
          console.error('SQLite query error:', error);
          console.error('Query:', sqliteQuery);
          console.error('Params:', convertedParams);
        }
        throw error;
      }
    }
  }

  private convertPostgresToSQLite(sql: string): string {
    // Convert PostgreSQL parameter placeholders ($1, $2, etc.) to SQLite (?, ?)
    return sql.replace(/\$(\d+)/g, '?');
  }

  private extractTableName(sql: string): string | null {
    const match = sql.match(/INSERT\s+INTO\s+(\w+)/i);
    return match ? match[1] || null : null;
  }

  public async transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    if (this.type === 'postgresql') {
      const pool = this.db as Pool;
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create a temporary adapter for the transaction
        const transactionAdapter = new DatabaseAdapter();
        (transactionAdapter as any).db = client;
        
        const result = await callback(transactionAdapter);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      const sqlite = this.db as Database.Database;
      
      return sqlite.transaction(() => {
        return callback(this);
      })();
    }
  }

  public getType(): 'postgresql' | 'sqlite' {
    return this.type;
  }
}

// Export a singleton instance
export const db = DatabaseAdapter.getInstance();