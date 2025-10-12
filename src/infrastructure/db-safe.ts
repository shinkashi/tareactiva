/**
 * Safe PouchDB Setup
 * Configures the local database for task storage with error handling
 */

import PouchDB from 'pouchdb-browser';

// Debug logging
console.log('[db-safe] Loading db module...');

let tasksDB: PouchDB.Database<any> | null = null;

// Safe database creation
export function getTasksDB(): PouchDB.Database<any> {
  if (!tasksDB) {
    try {
      // PouchDB browser version includes find plugin by default

      console.log('[db-safe] Creating PouchDB instance...');
      tasksDB = new PouchDB<any>('taskel-tasks');
      console.log('[db-safe] PouchDB instance created successfully');
    } catch (error) {
      console.error('[db-safe] Failed to create PouchDB:', error);
      throw error;
    }
  }
  return tasksDB;
}

// Initialize database indexes for better query performance
export async function initializeDB(): Promise<void> {
  try {
    console.log('[db-safe] Initializing database...');
    const db = getTasksDB();

    // Create index for status queries
    await db.createIndex({
      index: {
        fields: ['startedAt', 'completedAt']
      }
    });

    // Create index for project tag queries
    await db.createIndex({
      index: {
        fields: ['projectTag']
      }
    });

    console.log('[db-safe] Database initialized successfully');
  } catch (error) {
    console.error('[db-safe] Failed to initialize database:', error);
    throw error;
  }
}