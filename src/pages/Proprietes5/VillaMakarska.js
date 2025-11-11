import React from 'react';
import PropertyLayout from '../Layout/PropertyLayout';
import { ReactComponent as BedIcon } from '../../assets/icons/bed.svg';
import { ReactComponent as GuestsIcon } from '../../assets/icons/invité.svg';
import { ReactComponent as AreaIcon } from '../../assets/icons/superficie.svg';
import { ReactComponent as BathIcon } from '../../assets/icons/bathroom.svg';
import { ReactComponent as WifiIcon } from '../../assets/icons/wifi.svg';
import { ReactComponent as KitchenIcon } from '../../assets/icons/cuisine.svg';
import { ReactComponent as AcIcon } from '../../assets/icons/ac.svg';

export default function VillaMakarska() {
  return (
    <>
      {/* Contenu principal avec padding en bas pour mobile (évite que le bouton cache le contenu) */}
      <div className="relative overflow-x-hidden pb-24 md:pb-0">
        <PropertyLayout
          title="Villa Makarska"
          location="Ifrane, Downtown"
          rating={5.0}
          reviewCount={3}
          mainImage="../../villamakarska.jpg"
          host={{
            name: "Ihab Kassimi",
            certified: true,
            photo: "../../profilepic.jpg",
            responseRate: 100,
          }}
          checkInTime="13h"
          features={[
            { icon: <BedIcon className="w-7 h-7 text-gray-600" />, label: "8 chambres" },
            { icon: <GuestsIcon className="w-7 h-7 text-gray-600" />, label: "8 invités" },
            { icon: <AreaIcon className="w-7 h-7 text-gray-600" />, label: "460 m²" },
            { icon: <BathIcon className="w-7 h-7 text-gray-600" />, label: "4 salles de bain" },
            { icon: <WifiIcon className="w-7 h-7 text-gray-600" />, label: "Wifi" },
            { icon: <KitchenIcon className="w-7 h-7 text-gray-600" />, label: "Cuisine" },
            { icon: <AcIcon className="w-7 h-7 text-gray-600" />, label: "Climatisation" },
          ]}
          associatedPacks={[
            { name: "Quad Atlasia", location: "Ifrane - Farah Inn · 1h", image: "../../quad.jpg" },
            { name: "Foodie Restaurants", location: "Ifrane - Downtown", image: "../../foodie.jpg" },
          ]}
          mapImage="../../localisation.jpg"
          reviews={[
            {
              name: "Rhimo Elmaeefoni",
              date: "2 semaines",
              comment:
                "Great location! This private room in Yonkers near the bus and train station made my trip a breeze. Cozy, clean, and a welcoming host!",
            },
          ]}
        />

        {/* Bouton normal desktop */}
        <div className="hidden md:flex justify-center mt-8">
          <div className="w-full max-w-screen-xl px-4">
            <button className="bg-green-700 text-white py-4 mb-4 w-full text-lg font-semibold rounded-lg shadow-md">
              Réserver maintenant
            </button>
          </div>
        </div>
      </div>

      {/* Bouton sticky mobile (bien visible, toujours en bas) */}
      <div className="fixed bottom-0 left-0 w-full z-50 md:hidden pb-16 bg-white shadow-md">
        <button className="bg-green-700 text-white py-4 text-center w-full font-semibold text-lg">
          Réserver maintenant
        </button>
      </div>
    </>
  );
}
