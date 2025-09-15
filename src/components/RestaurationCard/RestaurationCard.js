// components/Restauration/RestaurationCard.js
import React from 'react';
import Tag from '../shared/Tag';
import S3Image from '../S3Image';

export default function RestaurationCard({ data }) {
  return (
    <div className="w-[240px] border rounded-xl shadow-sm bg-white overflow-hidden">
      <div className="relative">
        <S3Image src={data.image} alt={data.title} className="h-36 w-full object-cover" fallbackSrc="/placeholder.jpg" />
        <Tag text={data.tag || 'Partenaire Atlasia'} />
      </div>
      <div className="p-3 space-y-1">
        <div className="flex flex-wrap justify-between text-xs text-gray-600">
          <p className="font-semibold text-black-500">{data.location}</p>
          {data.typelocation && (
            <p className="text-gray-500">{data.typelocation}</p>
          )}
        </div>

        <h3 className="font-bold text-lg text-black">{data.title}</h3>

        
      </div>
    </div>
  );
}
