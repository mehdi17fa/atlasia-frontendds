// pages/Restauration/Restauration.js
import React from 'react';
import RestaurationCardGrid from '../../components/RestaurationCard/RestaurationCardGrid';

export default function Restauration() {
  const partenaires = [
    {
      image: '../../Foodie.jpg',
      title: 'Foodie',
      location: 'Ifrane, Downtown',
      typelocation: '• City',
      fastfood: true,
      delivery: true,
    },
    {
      image: '../../Bonzai.jpeg',
      title: 'Bonsai',
      location: 'Ifrane, Downtown',
      typelocation: '• City',
      fastfood: false,
      delivery: true,
    },
  ];

  const matins = [
    {
      image: '../../LaPaix.jpg',
      title: 'La Paix',
      location: 'Ifrane, Centre',
      typelocation: '• Café',
      fastfood: false,
      delivery: true,
    },
    {
      image: '../../Frosty.jpeg',
      title: 'Fruity Bar',
      location: 'Ifrane, Avenue Atlas',
      typelocation: '• Bar à jus',
      fastfood: true,
      delivery: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      <RestaurationCardGrid title="Partenaire Atlasia:" listings={partenaires} />
      <RestaurationCardGrid title="Pour vos bon matins:" listings={matins} />
    </div>
  );
}
