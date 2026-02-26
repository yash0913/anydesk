import React, { useState, useEffect } from 'react';

export function WebRTCDebugPanel() {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console methods to capture logs
    const addLog = (type, ...args) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev, { timestamp, type, message }].slice(-100)); // Keep last 100 logs
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog('LOG', ...args);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog('ERROR', ...args);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('WARN', ...args);
    };

    // Cleanup on unmount
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.type}: ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText).then(() => {
      alert('Logs copied to clipboard!');
    }).catch(err => {
      alert('Failed to copy logs: ' + err.message);
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '8px 12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        📋 Debug Logs
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px',
          backgroundColor: '#1f2937',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3 style={{ margin: 0, color: 'white', fontSize: '14px' }}>
          WebRTC Debug Logs
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearLogs}
            style={{
              padding: '4px 8px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
          <button
            onClick={copyLogs}
            style={{
              padding: '4px 8px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Copy All
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Logs */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.4'
        }}
      >
        {logs.map((log, index) => (
          <div
            key={index}
            style={{
              marginBottom: '4px',
              color: 
                log.type === 'ERROR' ? '#ef4444' :
                log.type === 'WARN' ? '#f59e0b' :
                log.type === 'LOG' ? '#10b981' :
                '#9ca3af'
            }}
          >
            <span style={{ color: '#6b7280' }}>
              [{log.timestamp}]
            </span>
            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
              {log.type}:
            </span>
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div style={{ color: '#9ca3af', textAlign: 'center', marginTop: '50px' }}>
            No logs captured yet. Start a remote session to see WebRTC logs...
          </div>
        )}
      </div>
    </div>
  );
}
