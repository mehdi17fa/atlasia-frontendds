import React from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
const intermediaires = [
    {
        id: 1,
        name: "Ahmed Essaidi",
        rating: 3.5,
        phone: "+212 68 99 4457",
        properties: 7,
    },
    {
        id: 2,
        name: "Nassim ElAlaoui",
        rating: 3.1,
        phone: "+212 75 23 6964",
        properties: 5,
    },
    {
        id: 3,
        name: "Achraf Karimi",
        rating: 4.5,
        phone: "+212 77 72 5885",
        properties: 5,
    },
    {
        id: 4,
        name: "Ali Faraj",
        rating: 4.3,
        phone: "‪+212 666 33 9785‬",
        properties: 2,
    },
];

export default function ListeInter() {
    const navigate = useNavigate();
    const handleAssign = (name) => {
        navigate("/ListPropertyOwner", { state: { inter: name } });
    };

    return (

        <div className="max-w-md mx-auto min-h-screen bg-white p-4 pb-24">
            {/* Header with back arrow */}
            <div className="flex items-center justify-center mb-4 relative">

                <button
                    onClick={() => navigate("/list-property-owner")}

                    className="absolute left-0 text-2xl text-black">&lt;</button>

                <div className="text-center font-bold text-green-700 text-3xl m-6 ">
                    Atlasia
                </div>
            </div>

            {/* Title */}
            <div className="flex justify-between items-center mb-8  ">
                <h2 className="text-xl font-semibold">Choisir un Intermediaire</h2>
            </div>

            <div className="m-4">
                <SearchBar />
            </div>
            {/* Intermediaires List */}
            <div className="space-y-5">
                {intermediaires.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-full bg-gray-300" />
                            {/* Infos */}
                            <div className="text-sm">
                                <div className="font-semibold">{item.name}</div>
                                <div className="text-yellow-500 flex items-center text-xs">
                                    ⭐ {item.rating} <span className="text-gray-600 ml-1">{item.phone}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {item.properties} propriétés gérées
                                </div>
                            </div>
                        </div>
                        {/* Assigner Button */}
                        <button
                            className="bg-green-700 text-white text-sm px-3 py-1 rounded">
                            Assigner
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}