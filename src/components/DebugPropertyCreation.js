import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { debugPropertyCreation, testPropertyScenarios } from '../utils/debugPropertyCreation';

const DebugPropertyCreation = () => {
  const { token } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const runDebug = async () => {
    if (!token) {
      alert('Please log in first to run the debug');
      return;
    }

    setIsRunning(true);
    setLogs([]);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const capturedLogs = [];

    console.log = (...args) => {
      const message = args.join(' ');
      capturedLogs.push({ type: 'log', message, timestamp: new Date().toLocaleTimeString() });
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      capturedLogs.push({ type: 'error', message, timestamp: new Date().toLocaleTimeString() });
      originalError(...args);
    };

    try {
      await debugPropertyCreation(token);
      await testPropertyScenarios(token);
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      // Restore original console functions
      console.log = originalLog;
      console.error = originalError;
      
      setLogs(capturedLogs);
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🔍 Property Creation Debug</h2>
      
      <div className="mb-6">
        <button
          onClick={runDebug}
          disabled={isRunning || !token}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isRunning || !token
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? 'Running Debug...' : 'Run Property Creation Debug'}
        </button>
        
        {!token && (
          <p className="text-red-600 mt-2">Please log in to run the debug</p>
        )}
      </div>

      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">What this debug does:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Shows exactly what data the frontend is sending</li>
          <li>Tests the data transformation process</li>
          <li>Sends test requests to the backend</li>
          <li>Shows the backend response</li>
          <li>Tests different scenarios (complete data, empty title, zero price)</li>
          <li>Helps identify where the data is getting lost</li>
        </ul>
      </div>

      {logs.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Debug Logs</h3>
          <div className="max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 font-mono text-sm ${
                  log.type === 'error' ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                <span className="text-gray-500 text-xs">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">How to interpret the results:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li><strong>✅ Success:</strong> If you see "Success! Response data" with correct title and price</li>
          <li><strong>❌ Empty Data:</strong> If the response shows null/empty title and price, the backend isn't saving data</li>
          <li><strong>❌ Network Error:</strong> If you see network errors, check your API connection</li>
          <li><strong>❌ Auth Error:</strong> If you see 401 errors, check your token</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugPropertyCreation;
