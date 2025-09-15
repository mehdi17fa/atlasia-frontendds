import React, { createContext, useContext, useState } from "react";

const PackageContext = createContext();

export function PackageProvider({ children }) {
  const [packageData, setPackageData] = useState({
    propertyId: null,
    items: [], // services, activities, restaurants
    date: null,
    name: "",
    description: "",
    price: null,
    status: "draft", // default draft until published
  });

  return (
    <PackageContext.Provider value={{ packageData, setPackageData }}>
      {children}
    </PackageContext.Provider>
  );
}

export function usePackageContext() {
  return useContext(PackageContext);
}
