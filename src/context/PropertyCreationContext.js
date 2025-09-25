import React, { createContext, useContext, useState } from "react";

const PropertyCreationContext = createContext();

export function PropertyCreationProvider({ children }) {
  const [propertyData, setPropertyData] = useState({
    localisation: null,
    propertyType: null,
    info: { guests: 1, rooms: 1, beds: 1, baths: 1 },
    equipments: [],
    stepsCompleted: {
      localisation: false,
      propertyType: false,
      info: false,
      equipments: false,
      photos: false,
      title: false,
      description: false,
      price: false,
      documents: false,
    },
  });

  // Function to clear/reset all property data
  const clearPropertyData = () => {
    console.log("🧹 Clearing property creation context...");
    setPropertyData({
      localisation: null,
      propertyType: null,
      info: { guests: 1, rooms: 1, beds: 1, baths: 1 },
      equipments: [],
      photos: [],
      title: "",
      description: "",
      price: { priceWeek: 0, priceWeekend: 0 },
      documents: [],
      propertyId: null,
      stepsCompleted: {
        localisation: false,
        propertyType: false,
        info: false,
        equipments: false,
        photos: false,
        title: false,
        description: false,
        price: false,
        documents: false,
      },
    });
  };

  return (
    <PropertyCreationContext.Provider value={{ propertyData, setPropertyData, clearPropertyData }}>
      {children}
    </PropertyCreationContext.Provider>
  );
}

export function usePropertyCreation() {
  return useContext(PropertyCreationContext);
}