// Property Creation Test Suite
// This test verifies that property creation is working correctly

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Test data for property creation
const testPropertyData = {
  localisation: {
    city: "Marrakech",
    address: "123 Test Street",
    postalCode: "40000"
  },
  propertyType: "Villa",
  info: {
    guests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1
  },
  equipments: ["wifi", "tv", "kitchen"],
  title: "Test Villa Marrakech",
  description: "Beautiful villa in the heart of Marrakech with modern amenities",
  price: {
    weekdays: 150,
    weekend: 200
  },
  inventory: [
    {
      meuble: "Sofa",
      nombre: 1,
      etatEntree: "TB",
      etatSortie: "TB",
      commentaires: "Excellent condition"
    }
  ],
  availability: {
    start: "2024-01-01T00:00:00.000Z",
    end: "2024-12-31T23:59:59.000Z"
  },
  instantBooking: true,
  status: "draft"
};

// Test scenarios
const testScenarios = [
  {
    name: "Complete Property Data",
    data: testPropertyData,
    expectedResult: "success"
  },
  {
    name: "Minimal Property Data",
    data: {
      localisation: {
        city: "Casablanca",
        address: "456 Boulevard Zerktouni",
        postalCode: "20000"
      },
      title: "Minimal Test Property",
      description: "Basic property for testing",
      price: { weekdays: 100, weekend: 100 },
      status: "draft"
    },
    expectedResult: "success"
  },
  {
    name: "Property with Empty Title",
    data: {
      ...testPropertyData,
      title: "",
      description: "Property with empty title"
    },
    expectedResult: "success" // Should still work but with empty title
  },
  {
    name: "Property with Zero Price",
    data: {
      ...testPropertyData,
      title: "Zero Price Property",
      price: { weekdays: 0, weekend: 0 }
    },
    expectedResult: "success"
  },
  {
    name: "Property with Missing Location",
    data: {
      ...testPropertyData,
      localisation: {
        city: "",
        address: "",
        postalCode: ""
      }
    },
    expectedResult: "error" // Should fail validation
  }
];

// Test functions
export const testPropertyCreation = async (token) => {
  console.log("🧪 PROPERTY CREATION TEST SUITE");
  console.log("=================================");
  
  if (!token) {
    console.error("❌ No authentication token provided");
    return { success: false, message: "No token provided" };
  }

  const results = {
    total: testScenarios.length,
    passed: 0,
    failed: 0,
    details: []
  };

  for (const scenario of testScenarios) {
    console.log(`\n🔬 Testing: ${scenario.name}`);
    console.log("Data:", JSON.stringify(scenario.data, null, 2));
    
    try {
      const response = await fetch(`${API_BASE}/api/property`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scenario.data)
      });

      const data = await response.json();
      
      if (scenario.expectedResult === "success") {
        if (response.ok && data.success) {
          console.log(`✅ ${scenario.name} - PASSED`);
          console.log("Property created:", data.property._id);
          console.log("Title:", data.property.title);
          console.log("Price:", data.property.price ? (typeof data.property.price === 'object' ? `${data.property.price.weekdays || 0} MAD/nuit` : `${data.property.price} MAD/nuit`) : "No price");
          console.log("Status:", data.property.status);
          
          results.passed++;
          results.details.push({
            scenario: scenario.name,
            status: "PASSED",
            propertyId: data.property._id,
            title: data.property.title,
            price: data.property.price
          });
        } else {
          console.error(`❌ ${scenario.name} - FAILED`);
          console.error("Response:", data);
          results.failed++;
          results.details.push({
            scenario: scenario.name,
            status: "FAILED",
            error: data.message || "Unknown error"
          });
        }
      } else if (scenario.expectedResult === "error") {
        if (!response.ok) {
          console.log(`✅ ${scenario.name} - PASSED (Expected error)`);
          console.log("Error message:", data.message);
          results.passed++;
          results.details.push({
            scenario: scenario.name,
            status: "PASSED (Expected error)",
            error: data.message
          });
        } else {
          console.error(`❌ ${scenario.name} - FAILED (Should have errored)`);
          results.failed++;
          results.details.push({
            scenario: scenario.name,
            status: "FAILED (Should have errored)",
            error: "Expected error but got success"
          });
        }
      }
    } catch (error) {
      console.error(`❌ ${scenario.name} - ERROR:`, error.message);
      results.failed++;
      results.details.push({
        scenario: scenario.name,
        status: "ERROR",
        error: error.message
      });
    }
  }

  // Test property listing
  console.log("\n🔍 Testing Property Listing...");
  try {
    const listResponse = await fetch(`${API_BASE}/api/property/my-properties`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log("✅ Property listing works");
      console.log("Properties found:", listData.properties?.length || 0);
      
      if (listData.properties && listData.properties.length > 0) {
        const latestProperty = listData.properties[0];
        console.log("Latest property:");
        console.log("- Title:", latestProperty.title);
        console.log("- Price:", latestProperty.price);
        console.log("- Status:", latestProperty.status);
        
        // Check if data is properly saved
        if (latestProperty.title && latestProperty.title !== "Propriété sans titre") {
          console.log("✅ Title is properly saved");
        } else {
          console.log("❌ Title is not properly saved");
        }
        
        if (latestProperty.price && latestProperty.price !== "Prix sur demande / nuit") {
          console.log("✅ Price is properly saved");
        } else {
          console.log("❌ Price is not properly saved");
        }
      }
    } else {
      console.error("❌ Property listing failed:", listResponse.status);
    }
  } catch (error) {
    console.error("❌ Property listing error:", error.message);
  }

  // Summary
  console.log("\n📊 TEST SUMMARY");
  console.log("===============");
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log("🎉 ALL TESTS PASSED! Property creation is working correctly.");
  } else {
    console.log("⚠️ Some tests failed. Check the details above.");
  }

  return {
    success: results.failed === 0,
    results,
    message: results.failed === 0 ? "All tests passed!" : `${results.failed} tests failed`
  };
};

// Quick test function
export const quickPropertyTest = async (token) => {
  console.log("🚀 QUICK PROPERTY CREATION TEST");
  console.log("================================");
  
  if (!token) {
    console.error("❌ No authentication token provided");
    return false;
  }

  const quickData = {
    localisation: {
      city: "Rabat",
      address: "123 Avenue Hassan II",
      postalCode: "10000"
    },
    title: "Quick Test Property",
    description: "This is a quick test property",
    price: { weekdays: 100, weekend: 120 },
    status: "draft"
  };

  try {
    console.log("📤 Sending request...");
    const response = await fetch(`${API_BASE}/api/property`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quickData)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log("✅ Quick test PASSED!");
      console.log("Property ID:", data.property._id);
      console.log("Title:", data.property.title);
      console.log("Price:", data.property.price ? (typeof data.property.price === 'object' ? `${data.property.price.weekdays || 0} MAD/nuit` : `${data.property.price} MAD/nuit`) : "No price");
      return true;
    } else {
      console.error("❌ Quick test FAILED!");
      console.error("Response:", data);
      return false;
    }
  } catch (error) {
    console.error("❌ Quick test ERROR:", error.message);
    return false;
  }
};

export default testPropertyCreation;
