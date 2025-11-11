// components/Restauration/RestaurationCard.js
import React from 'react';
import Tag from '../shared/Tag';
import S3Image from '../S3Image';

const priceUnitLabels = {
  per_hour: '/heure',
  per_day: '/jour',
  per_person: '/personne',
  per_event: '/événement',
  fixed: '',
  other: ''
};

export default function RestaurationCard({ data }) {
  const priceDisplay = data.price && data.price > 0 
    ? `${data.price} MAD${priceUnitLabels[data.priceUnit] || ''}`
    : null;

  return (
    <div className="w-[240px] border rounded-xl shadow-sm bg-white overflow-hidden">
      <div className="relative">
        <S3Image src={data.image} alt={data.title} className="h-36 w-full object-cover" fallbackSrc="/placeholder.jpg" />
        <Tag text={data.isB2BService ? 'Service B2B' : (data.tag || 'Partenaire Atlasia')} />
      </div>
      <div className="p-3 space-y-1">
        <div className="flex flex-wrap justify-between text-xs text-gray-600">
          <p className="font-semibold text-black-500">{data.location}</p>
          {data.typelocation && (
            <p className="text-gray-500">{data.typelocation}</p>
          )}
        </div>

        <h3 className="font-bold text-lg text-black">{data.title}</h3>
        
        {priceDisplay && (
          <p className="text-sm font-semibold text-green-700 mt-1">{priceDisplay}</p>
        )}
      </div>
    </div>
  );
}
