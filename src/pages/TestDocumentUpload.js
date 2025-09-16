import React, { useState } from 'react';
import { testDocumentUpload } from '../utils/testDocumentUpload';

const TestDocumentUpload = () => {
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async () => {
    setIsRunning(true);
    setTestResult(null);
    
    try {
      const result = await testDocumentUpload();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Document Upload Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Document Upload Endpoint</h2>
          <p className="text-gray-600 mb-4">
            This test will verify the document upload functionality by testing:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
            <li>Backend server connectivity</li>
            <li>Authentication token validity</li>
            <li>CORS configuration</li>
            <li>Document upload endpoint functionality</li>
          </ul>
          
          <button
            onClick={runTest}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium ${
              isRunning
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? 'Running Test...' : 'Run Upload Test'}
          </button>
        </div>

        {testResult && (
          <div className={`rounded-lg p-6 ${
            testResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {testResult.success ? '✅ Test Passed' : '❌ Test Failed'}
            </h3>
            
            {testResult.success ? (
              <div className="text-green-700">
                <p>Document upload functionality is working correctly!</p>
                {testResult.data && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">View Response Data</summary>
                    <pre className="mt-2 p-4 bg-green-100 rounded text-sm overflow-auto">
                      {JSON.stringify(JSON.parse(testResult.data), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                <p className="font-medium">Error: {testResult.error}</p>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Troubleshooting Steps:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Make sure you are logged in with a partner or owner account</li>
                    <li>Check that the backend server is running on port 4000</li>
                    <li>Verify your authentication token is valid</li>
                    <li>Check the browser console for detailed error messages</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            💡 Additional Debugging
          </h3>
          <p className="text-yellow-700 mb-4">
            For more detailed debugging information, open the browser console and run:
          </p>
          <code className="bg-yellow-100 px-3 py-2 rounded text-sm font-mono block">
            testDocumentUpload()
          </code>
          <p className="text-yellow-700 mt-2 text-sm">
            This will provide comprehensive logging of the upload process.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestDocumentUpload;
