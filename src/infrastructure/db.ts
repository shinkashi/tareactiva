/**
 * PouchDB Setup
 * Configures the local database for task storage
 */

import PouchDB from 'pouchdb-browser';

// Debug logging
console.log('Loading db.ts module...');

// PouchDB browser version includes find plugin by default

// Create the tasks database
console.log('Creating PouchDB instance...');
export const tasksDB = new PouchDB<any>('taskel-tasks');
console.log('PouchDB instance created successfully');

// Initialize database indexes for better query performance
export async function initializeDB(): Promise<void> {
  try {
    console.log('Database initialization - indexes disabled for now');
    // TODO: Re-enable indexes once we confirm PouchDB is working
    // // Create index for status queries
    // await tasksDB.createIndex({
    //   index: {
    //     fields: ['startedAt', 'completedAt']
    //   }
    // });

    // // Create index for project tag queries
    // await tasksDB.createIndex({
    //   index: {
    //     fields: ['projectTag']
    //   }
    // });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}