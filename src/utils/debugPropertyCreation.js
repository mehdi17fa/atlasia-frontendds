// Frontend Property Creation Debug
// This will help us see exactly what's being sent to the backend

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export const debugPropertyCreation = async (token) => {
  console.log("🔍 FRONTEND PROPERTY CREATION DEBUG");
  console.log("====================================");

  if (!token) {
    console.error("❌ No token provided");
    return;
  }

  // Test data that matches what the form should send
  const testFormData = {
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
    title: "Debug Test Villa",
    description: "This is a debug test property",
    price: 150, // This is what the form sends
    inventory: [],
    status: "draft"
  };

  console.log("📝 Test Form Data:");
  console.log(JSON.stringify(testFormData, null, 2));

  // Transform the data exactly like the frontend does
  console.log("\n🔧 Transforming data like frontend...");
  
  // Map equipment labels to backend enum values (like in handleSaveDraft)
  const equipmentMapping = {
    'Wifi': 'wifi',
    'TV': 'tv', 
    'Lave-linge': 'washer',
    'Climatisation': 'ac',
    'Chauffage': 'heater',
    'Cuisine': 'kitchen',
    'Parking': 'parking',
    'Piscine': 'pool',
  };

  const mappedEquipments = testFormData.equipments.map(eq => equipmentMapping[eq] || eq);
  console.log("Mapped equipments:", mappedEquipments);

  // Transform price structure to match backend schema (like in handleSaveDraft)
  const priceValue = testFormData.price || 0;
  console.log("Price value:", priceValue, "(type:", typeof priceValue, ")");
  
  const payload = { 
    localisation: testFormData.localisation,
    propertyType: testFormData.propertyType,
    info: testFormData.info,
    equipments: mappedEquipments,
    title: testFormData.title,
    description: testFormData.description,
    price: {
      weekdays: priceValue,
      weekend: priceValue
    },
    inventory: testFormData.inventory || [],
    status: 'draft'
  };

  console.log("\n📦 Final Payload:");
  console.log(JSON.stringify(payload, null, 2));

  try {
    console.log("\n🚀 Sending request to backend...");
    console.log("URL:", `${API_BASE}/api/property`);
    console.log("Method: POST");
    console.log("Headers:", {
      'Authorization': `Bearer ${token.substring(0, 20)}...`,
      'Content-Type': 'application/json'
    });

    const response = await fetch(`${API_BASE}/api/property`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log("\n📡 Response received:");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success! Response data:");
      console.log(JSON.stringify(data, null, 2));
      
      if (data.property) {
        console.log("\n🏠 Created Property Details:");
        console.log("- ID:", data.property._id);
        console.log("- Title:", data.property.title);
        console.log("- Description:", data.property.description);
        console.log("- Price:", data.property.price);
        console.log("- Status:", data.property.status);
        console.log("- Location:", data.property.localisation);
      }
    } else {
      const errorData = await response.json();
      console.error("❌ Request failed:");
      console.error("Status:", response.status);
      console.error("Error:", JSON.stringify(errorData, null, 2));
    }

  } catch (error) {
    console.error("❌ Network error:", error);
  }
};

// Test different scenarios
export const testPropertyScenarios = async (token) => {
  console.log("\n🧪 TESTING DIFFERENT SCENARIOS");
  console.log("===============================");

  const scenarios = [
    {
      name: "Complete Data",
      data: {
        localisation: { city: "Rabat", address: "123 Avenue Hassan II", postalCode: "10000" },
        propertyType: "Appartement",
        info: { guests: 2, bedrooms: 1, beds: 1, bathrooms: 1 },
        equipments: ["wifi", "tv"],
        title: "Complete Test Property",
        description: "This property has all fields filled",
        price: 200,
        inventory: [],
        status: "draft"
      }
    },
    {
      name: "Empty Title",
      data: {
        localisation: { city: "Fes", address: "456 Rue Mohammed V", postalCode: "30000" },
        propertyType: "Studio",
        info: { guests: 1, bedrooms: 0, beds: 1, bathrooms: 1 },
        equipments: [],
        title: "",
        description: "Property with empty title",
        price: 100,
        inventory: [],
        status: "draft"
      }
    },
    {
      name: "Zero Price",
      data: {
        localisation: { city: "Agadir", address: "789 Boulevard 20 Août", postalCode: "80000" },
        propertyType: "Villa",
        info: { guests: 6, bedrooms: 3, beds: 3, bathrooms: 2 },
        equipments: ["wifi", "pool"],
        title: "Zero Price Property",
        description: "Property with zero price",
        price: 0,
        inventory: [],
        status: "draft"
      }
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n🔬 Testing: ${scenario.name}`);
    
    // Transform data like the frontend does
    const priceValue = scenario.data.price || 0;
    const payload = {
      localisation: scenario.data.localisation,
      propertyType: scenario.data.propertyType,
      info: scenario.data.info,
      equipments: scenario.data.equipments,
      title: scenario.data.title,
      description: scenario.data.description,
      price: { weekdays: priceValue, weekend: priceValue },
      inventory: scenario.data.inventory || [],
      status: 'draft'
    };

    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${API_BASE}/api/property`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${scenario.name} - Success:`, data.property._id);
        console.log("  Title:", data.property.title);
        console.log("  Price:", data.property.price);
      } else {
        const errorData = await response.json();
        console.error(`❌ ${scenario.name} - Failed:`, errorData);
      }
    } catch (error) {
      console.error(`❌ ${scenario.name} - Error:`, error.message);
    }
  }
};

export default debugPropertyCreation;
