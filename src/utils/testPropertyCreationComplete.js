// Complete Property Creation Test
// This script tests the entire property creation flow

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Test data
const testPropertyData = {
  localisation: {
    city: "Marrakech",
    address: "123 Avenue Mohammed V",
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

// Test functions
const testPropertyCreation = async (token) => {
  console.log("🧪 Starting Property Creation Test");
  console.log("=====================================");
  
  try {
    // Step 1: Create Property
    console.log("📝 Step 1: Creating property...");
    console.log("Payload:", JSON.stringify(testPropertyData, null, 2));
    
    const createResponse = await fetch(`${API_BASE}/api/property`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPropertyData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Create failed: ${createResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const createData = await createResponse.json();
    console.log("✅ Property created successfully:", createData.property._id);
    
    const propertyId = createData.property._id;

    // Step 2: Verify Property in Database
    console.log("\n🔍 Step 2: Verifying property in database...");
    const verifyResponse = await fetch(`${API_BASE}/api/property/my-properties`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!verifyResponse.ok) {
      throw new Error(`Verify failed: ${verifyResponse.status}`);
    }

    const verifyData = await verifyResponse.json();
    const createdProperty = verifyData.properties.find(p => p._id === propertyId);
    
    if (!createdProperty) {
      throw new Error("Property not found in database");
    }

    console.log("✅ Property found in database:");
    console.log("- Title:", createdProperty.title);
    console.log("- Price:", createdProperty.price);
    console.log("- Status:", createdProperty.status);
    console.log("- Location:", createdProperty.location);

    // Step 3: Test Photo Upload
    console.log("\n📸 Step 3: Testing photo upload...");
    const photoFormData = new FormData();
    
    // Create a dummy image file for testing
    const dummyImageData = new Blob(['dummy image data'], { type: 'image/jpeg' });
    const dummyImageFile = new File([dummyImageData], 'test-photo.jpg', { type: 'image/jpeg' });
    photoFormData.append('photos', dummyImageFile);

    const photoResponse = await fetch(`${API_BASE}/api/property/${propertyId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: photoFormData
    });

    if (!photoResponse.ok) {
      const errorData = await photoResponse.json();
      console.warn("⚠️ Photo upload failed:", errorData);
    } else {
      console.log("✅ Photo uploaded successfully");
    }

    // Step 4: Test Document Upload
    console.log("\n📄 Step 4: Testing document upload...");
    const docFormData = new FormData();
    
    // Create a dummy document file for testing
    const dummyDocData = new Blob(['dummy document data'], { type: 'application/pdf' });
    const dummyDocFile = new File([dummyDocData], 'test-document.pdf', { type: 'application/pdf' });
    docFormData.append('documents', dummyDocFile);

    const docResponse = await fetch(`${API_BASE}/api/property/${propertyId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: docFormData
    });

    if (!docResponse.ok) {
      const errorData = await docResponse.json();
      console.warn("⚠️ Document upload failed:", errorData);
    } else {
      console.log("✅ Document uploaded successfully");
    }

    // Step 5: Final Verification
    console.log("\n🔍 Step 5: Final verification...");
    const finalResponse = await fetch(`${API_BASE}/api/property/my-properties`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const finalData = await finalResponse.json();
    const finalProperty = finalData.properties.find(p => p._id === propertyId);
    
    console.log("📊 Final Property Data:");
    console.log("- ID:", finalProperty._id);
    console.log("- Title:", finalProperty.title);
    console.log("- Description:", finalProperty.description);
    console.log("- Price:", finalProperty.price);
    console.log("- Status:", finalProperty.status);
    console.log("- Photos Count:", finalProperty.photos?.length || 0);
    console.log("- Documents Count:", finalProperty.documents?.length || 0);
    console.log("- Location:", finalProperty.location);

    // Check if data is properly saved
    const issues = [];
    if (!finalProperty.title || finalProperty.title === "Propriété sans titre") {
      issues.push("Title is missing or showing fallback");
    }
    if (!finalProperty.price || finalProperty.price === "Prix sur demande / nuit") {
      issues.push("Price is missing or showing fallback");
    }
    if (finalProperty.status !== "draft") {
      issues.push("Status is incorrect");
    }

    if (issues.length > 0) {
      console.error("❌ Issues found:");
      issues.forEach(issue => console.error("-", issue));
      return false;
    } else {
      console.log("✅ All tests passed! Property creation is working correctly.");
      return true;
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return false;
  }
};

// Test with different scenarios
const testScenarios = async (token) => {
  console.log("🧪 Testing Different Scenarios");
  console.log("===============================");

  const scenarios = [
    {
      name: "Complete Property",
      data: testPropertyData
    },
    {
      name: "Minimal Property",
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
      }
    },
    {
      name: "Property with Empty Title",
      data: {
        ...testPropertyData,
        title: "",
        description: "Property with empty title"
      }
    },
    {
      name: "Property with Zero Price",
      data: {
        ...testPropertyData,
        title: "Zero Price Property",
        price: { weekdays: 0, weekend: 0 }
      }
    }
  ];

  for (const scenario of scenarios) {
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

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${scenario.name} created successfully:`, data.property._id);
      } else {
        const errorData = await response.json();
        console.error(`❌ ${scenario.name} failed:`, errorData);
      }
    } catch (error) {
      console.error(`❌ ${scenario.name} error:`, error.message);
    }
  }
};

// Main test function
export const runPropertyCreationTests = async (token) => {
  if (!token) {
    console.error("❌ No token provided. Please provide a valid authentication token.");
    return;
  }

  console.log("🚀 Starting Complete Property Creation Tests");
  console.log("=============================================");
  console.log("API Base URL:", API_BASE);
  console.log("Token:", token.substring(0, 20) + "...");

  // Run main test
  const mainTestResult = await testPropertyCreation(token);
  
  // Run scenario tests
  await testScenarios(token);

  console.log("\n📋 Test Summary");
  console.log("===============");
  console.log("Main Test:", mainTestResult ? "✅ PASSED" : "❌ FAILED");
  console.log("Check the console logs above for detailed results.");
  
  return mainTestResult;
};

// Export for use in other files
export default runPropertyCreationTests;
