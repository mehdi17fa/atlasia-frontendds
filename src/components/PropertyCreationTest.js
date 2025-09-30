import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { runPropertyCreationTests } from '../utils/testPropertyCreationComplete';

const PropertyCreationTest = () => {
  const { token } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const runTest = async () => {
    if (!token) {
      alert('Please log in first to run the test');
      return;
    }

    setIsRunning(true);
    setTestResult(null);
    setLogs([]);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const capturedLogs = [];

    console.log = (...args) => {
      capturedLogs.push({ type: 'log', message: args.join(' ') });
      originalLog(...args);
    };

    console.error = (...args) => {
      capturedLogs.push({ type: 'error', message: args.join(' ') });
      originalError(...args);
    };

    try {
      const result = await runPropertyCreationTests(token);
      setTestResult(result);
    } catch (error) {
      console.error('Test error:', error);
      setTestResult(false);
    } finally {
      // Restore original console functions
      console.log = originalLog;
      console.error = originalError;
      
      setLogs(capturedLogs);
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Property Creation Test</h2>
      
      <div className="mb-6">
        <button
          onClick={runTest}
          disabled={isRunning || !token}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isRunning || !token
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? 'Running Test...' : 'Run Property Creation Test'}
        </button>
        
        {!token && (
          <p className="text-red-600 mt-2">Please log in to run the test</p>
        )}
      </div>

      {testResult !== null && (
        <div className={`p-4 rounded-lg mb-6 ${
          testResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <h3 className="font-semibold text-lg">
            Test Result: {testResult ? '✅ PASSED' : '❌ FAILED'}
          </h3>
          <p className="mt-2">
            {testResult 
              ? 'Property creation is working correctly!' 
              : 'Property creation has issues. Check the logs below for details.'
            }
          </p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Test Logs</h3>
          <div className="max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 font-mono text-sm ${
                  log.type === 'error' ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">What this test does:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Creates a test property with complete data</li>
          <li>Verifies the property is saved in the database</li>
          <li>Tests photo upload functionality</li>
          <li>Tests document upload functionality</li>
          <li>Checks if title and price are properly saved</li>
          <li>Tests different property creation scenarios</li>
        </ul>
      </div>
    </div>
  );
};

export default PropertyCreationTest;
