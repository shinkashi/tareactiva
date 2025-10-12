/**
 * PouchDB Setup using CDN version
 * Uses global PouchDB loaded from CDN
 */

// Declare the global PouchDB from CDN
declare global {
  interface Window {
    PouchDB: any;
  }
}

// Debug logging
console.log('Loading db-cdn.ts module...');

// Check if PouchDB is available
if (typeof window !== 'undefined' && !window.PouchDB) {
  console.error('PouchDB not found! Make sure it is loaded from CDN');
  throw new Error('PouchDB not found');
}

const PouchDB = window.PouchDB;

// CouchDB remote server configuration
// Try HTTP first if HTTPS certificate is not trusted
const COUCHDB_URL = 'http://ocho.ddns.net:5984/taskel-tasks';

// Create the local tasks database
console.log('Creating PouchDB instance from CDN...');
export const tasksDB = new PouchDB('taskel-tasks');
console.log('PouchDB instance created successfully');

// Sync handler reference
let syncHandler: any = null;

// Initialize database and start sync
export async function initializeDB(): Promise<void> {
  try {
    console.log('Database initialization starting...');

    // Test the local database by getting info
    const info = await tasksDB.info();
    console.log('Database info:', info);

    // Start sync with CouchDB
    await startSync();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Start continuous sync with CouchDB
export async function startSync(): Promise<void> {
  try {
    console.log('Starting sync with CouchDB:', COUCHDB_URL);

    // Live, continuous, bidirectional sync
    syncHandler = tasksDB.sync(COUCHDB_URL, {
      live: true,
      retry: true
    })
      .on('change', (info: any) => {
        console.log('Sync change:', info);
      })
      .on('paused', (err: any) => {
        console.log('Sync paused:', err);
      })
      .on('active', () => {
        console.log('Sync active');
      })
      .on('denied', (err: any) => {
        console.error('Sync denied:', err);
      })
      .on('complete', (info: any) => {
        console.log('Sync complete:', info);
      })
      .on('error', (err: any) => {
        console.error('Sync error:', err);
      });

    console.log('Sync started successfully');
  } catch (error) {
    console.error('Failed to start sync:', error);
    // Don't throw - allow app to work offline
  }
}

// Stop sync
export function stopSync(): void {
  if (syncHandler) {
    syncHandler.cancel();
    syncHandler = null;
    console.log('Sync stopped');
  }
}

// Get sync status
export function getSyncStatus(): 'syncing' | 'paused' | 'error' | 'offline' {
  // This is a simplified status
  // In a real app, you'd track the actual state
  return syncHandler ? 'syncing' : 'offline';
}