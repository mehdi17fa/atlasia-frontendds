import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ListeInter from "./ListeInter";
import React, { useState } from "react";
import SearchBar from "./SearchBar";
import S3Image from "../../components/S3Image";

const properties = [
  {
    id: 1,
    title: "Villa Makarska",
    location: "Ifrane - Downtown",
    price: "380 MAD",
    image:
      "https://i.pinimg.com/1200x/ea/ee/93/eaee933522569d31c2e1d1550d4b5853.jpg",
    inter: "null"
  },
  {
    id: 2,
    title: "Villa Makarska",
    location: "Ifrane - Downtown",
    price: "340 MAD",
    image:
      "https://i.pinimg.com/1200x/c9/4a/dd/c94addff5ed5c6f7997cc1ed8b8e5d31.jpg",
    inter: "null"

  },
];


export default function ListPropertyOwner() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white p-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-center py-4 bg-white shadow-sm">
            <span className="text-2xl font-bold text-green-700">ATLASIA</span>
            <button
                    onClick={() => navigate("/welcome-owner")}

                    className="absolute left-0 ml-4 text-2xl text-black">&lt;</button>
          </div>
          

      {/* Title + Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold mt-4">Mes Propriétés</h2>
        <button 
        onClick={() => navigate("/create-property")}
        className="text-green-700 text-3xl leading-none">+</button>
      </div>

      <div className="m-4">
      <SearchBar />
    </div>

      {/* Property List */}
      <div className="space-y-4">
        {properties.map((property) => (
          <div key={property.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <S3Image
                src={property.photos?.[0] || property.image}
                alt="property"
                className="w-16 h-16 rounded-lg object-cover"
                fallbackSrc="/placeholder.jpg"
              />
              <div className="m-3">
                <h3 className="font-medium text-md">{property.title}</h3>
                <p className="text-xs text-gray-500">{property.location}</p>

                <p className="text-xs text-gray-700">
                  Intermédiaire: {property.inter}
                </p>


              </div>
            </div>
            <div className="text-sm font-bold text-gray-600">{property.price}
              <div className="text-right ">

                <button
                  onClick={() => navigate('/liste-inter')}
                > &gt; </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}