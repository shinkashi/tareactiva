/**
 * Debug Panel Component
 * Shows raw database content for debugging
 */

import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    PouchDB: any;
  }
}

export const DebugPanel: React.FC = () => {
  const [dbContent, setDbContent] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const loadDbContent = async () => {
    try {
      const db = new window.PouchDB('taskel-tasks');
      const result = await db.allDocs({ include_docs: true });
      const tasks = result.rows
        .filter((row: any) => !row.value.deleted)
        .map((row: any) => ({
          ...row.doc,
          _shortened_rev: row.doc._rev ? row.doc._rev.substring(0, 8) + '...' : ''
        }));
      setDbContent(tasks);
    } catch (error) {
      console.error('Failed to load DB content:', error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadDbContent();
      // Refresh every 2 seconds when visible
      const interval = setInterval(loadDbContent, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      background: 'white',
      border: '2px solid #007AFF',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      maxHeight: '400px'
    }}>
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          style={{
            padding: '10px 15px',
            background: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗄️ Show DB Content ({dbContent.length})
        </button>
      ) : (
        <div style={{ padding: '15px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Database Content ({dbContent.length} tasks)</h3>
            <div>
              <button
                onClick={loadDbContent}
                style={{
                  marginRight: '10px',
                  padding: '5px 10px',
                  background: '#34C759',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  padding: '5px 10px',
                  background: '#FF3B30',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div style={{
            overflowY: 'auto',
            maxHeight: '320px',
            fontSize: '12px',
            fontFamily: 'monospace',
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px'
          }}>
            {dbContent.length === 0 ? (
              <p>No tasks in database</p>
            ) : (
              <pre>{JSON.stringify(dbContent, null, 2)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};