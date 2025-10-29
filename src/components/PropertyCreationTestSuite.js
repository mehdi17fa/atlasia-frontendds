import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { testPropertyCreation, quickPropertyTest } from '../utils/propertyCreationTest';

const PropertyCreationTestSuite = () => {
  const { token } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isQuickTest, setIsQuickTest] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [logs, setLogs] = useState([]);

  const runFullTest = async () => {
    if (!token) {
      alert('Please log in first to run the test');
      return;
    }

    setIsRunning(true);
    setIsQuickTest(false);
    setTestResults(null);
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
      const results = await testPropertyCreation(token);
      setTestResults(results);
    } catch (error) {
      console.error('Test suite error:', error);
      setTestResults({ success: false, message: error.message });
    } finally {
      // Restore original console functions
      console.log = originalLog;
      console.error = originalError;
      
      setLogs(capturedLogs);
      setIsRunning(false);
    }
  };

  const runQuickTest = async () => {
    if (!token) {
      alert('Please log in first to run the test');
      return;
    }

    setIsRunning(true);
    setIsQuickTest(true);
    setTestResults(null);
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
      const success = await quickPropertyTest(token);
      setTestResults({ success, message: success ? 'Quick test passed!' : 'Quick test failed!' });
    } catch (error) {
      console.error('Quick test error:', error);
      setTestResults({ success: false, message: error.message });
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🧪 Property Creation Test Suite</h2>
      
      <div className="mb-6 space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={runQuickTest}
            disabled={isRunning || !token}
            className={`px-6 py-3 rounded-lg font-semibold ${
              isRunning || !token
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning && isQuickTest ? 'Running Quick Test...' : 'Run Quick Test'}
          </button>
          
          <button
            onClick={runFullTest}
            disabled={isRunning || !token}
            className={`px-6 py-3 rounded-lg font-semibold ${
              isRunning || !token
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning && !isQuickTest ? 'Running Full Test...' : 'Run Full Test Suite'}
          </button>
        </div>
        
        {!token && (
          <p className="text-red-600">Please log in to run the tests</p>
        )}
      </div>

      {testResults && (
        <div className={`p-4 rounded-lg mb-6 ${
          testResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <h3 className="font-semibold text-lg">
            Test Result: {testResults.success ? '✅ PASSED' : '❌ FAILED'}
          </h3>
          <p className="mt-2">{testResults.message}</p>
          
          {testResults.results && (
            <div className="mt-4">
              <h4 className="font-semibold">Test Summary:</h4>
              <p>Total: {testResults.results.total} | Passed: {testResults.results.passed} | Failed: {testResults.results.failed}</p>
              <p>Success Rate: {((testResults.results.passed / testResults.results.total) * 100).toFixed(1)}%</p>
            </div>
          )}
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
                <span className="text-gray-500 text-xs">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">What these tests do:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li><strong>Quick Test:</strong> Creates a simple property and verifies it's saved correctly</li>
          <li><strong>Full Test Suite:</strong> Tests multiple scenarios including complete data, minimal data, empty fields, and validation errors</li>
          <li><strong>Property Listing:</strong> Verifies that created properties appear in the property list with correct data</li>
          <li><strong>Data Validation:</strong> Checks that title, price, and description are properly saved (not showing fallback values)</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Expected Results:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li><strong>✅ Success:</strong> Properties created with actual titles and prices</li>
          <li><strong>✅ Success:</strong> Property list shows correct data (not "Propriété sans titre" or "Prix sur demande")</li>
          <li><strong>❌ Failure:</strong> Properties show fallback values or empty fields</li>
          <li><strong>❌ Failure:</strong> Test errors or validation failures</li>
        </ul>
      </div>
    </div>
  );
};

export default PropertyCreationTestSuite;
