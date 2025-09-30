import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const SimplePropertyTest = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testPropertyCreation = async () => {
    if (!token) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    setResult(null);

    // Simple test data
    const testData = {
      localisation: {
        city: "Marrakech",
        address: "123 Test Street",
        postalCode: "40000"
      },
      propertyType: "Villa",
      info: {
        guests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1
      },
      equipments: ["wifi"],
      title: "Simple Test Property",
      description: "This is a simple test property",
      price: {
        weekdays: 100,
        weekend: 120
      },
      inventory: [],
      status: "draft"
    };

    console.log("🧪 Testing property creation with simple data:");
    console.log(JSON.stringify(testData, null, 2));

    try {
      console.log("🚀 Sending request to:", `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/property`);
      console.log("📦 Request body:", JSON.stringify(testData, null, 2));
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/property`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const data = await response.json();
      
      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (response.ok) {
        setResult({
          success: true,
          property: data.property,
          message: "Property created successfully!"
        });
      } else {
        setResult({
          success: false,
          error: data.message || 'Unknown error',
          message: "Property creation failed!"
        });
      }
    } catch (error) {
      console.error("Test error:", error);
      setResult({
        success: false,
        error: error.message,
        message: "Network error occurred!"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Simple Property Creation Test</h2>
      
      <div className="mb-6">
        <button
          onClick={testPropertyCreation}
          disabled={isLoading || !token}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isLoading || !token
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isLoading ? 'Testing...' : 'Test Property Creation'}
        </button>
        
        {!token && (
          <p className="text-red-600 mt-2">Please log in to run the test</p>
        )}
      </div>

      {result && (
        <div className={`p-4 rounded-lg ${
          result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <h3 className="font-semibold text-lg">{result.message}</h3>
          {result.success && result.property && (
            <div className="mt-2">
              <p><strong>Property ID:</strong> {result.property._id}</p>
              <p><strong>Title:</strong> {result.property.title || 'No title'}</p>
              <p><strong>Description:</strong> {result.property.description || 'No description'}</p>
              <p><strong>Price:</strong> {result.property.price ? JSON.stringify(result.property.price) : 'No price'}</p>
              <p><strong>Status:</strong> {result.property.status || 'No status'}</p>
            </div>
          )}
          {!result.success && (
            <div className="mt-2">
              <p><strong>Error:</strong> {result.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">What this test does:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Sends a simple property creation request directly to the backend</li>
          <li>Bypasses the complex form logic</li>
          <li>Shows exactly what the backend receives and returns</li>
          <li>Helps identify if the issue is in the frontend form or backend</li>
        </ul>
      </div>
    </div>
  );
};

export default SimplePropertyTest;
