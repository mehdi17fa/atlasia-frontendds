import React from 'react';
import { ReactComponent as BedIcon } from '../../assets/icons/bedroom.svg';
import { ReactComponent as GuestIcon } from '../../assets/icons/guests.svg';
import { ReactComponent as BathIcon } from '../../assets/icons/bathroom.svg';
import { ReactComponent as AreaIcon } from '../../assets/icons/superficie.svg';
import Tag from '../shared/Tag';
import S3Image from '../S3Image';

export default function ListingCard({ data }) {
  return (
    <div className="w-[240px] border rounded-xl shadow-sm bg-white overflow-hidden">
      <div className="relative">
        <S3Image src={data.image} alt={data.title} className="h-36 w-full object-cover" fallbackSrc="/placeholder.jpg" />
        <Tag text={`à partir ${data.price} MAD / nuit`} />
      </div>
      <div className="p-3 space-y-1">
        <div className="flex flex-wrap justify-between text-xs text-gray-600">
          <p className="font-semibold text-black-500">{data.location}</p>
          {data.typelocation && (
            <p className="text-gray-500">{data.typelocation}</p>
          )}
        </div>

        <h3 className="font-bold text-lg text-black">{data.title}</h3>

        <div className="flex flex-wrap gap-2 text-xs text-gray-600 items-center">
          <div className="flex items-center gap-1">
            <BedIcon className="w-4 h-4" />
            {data.bedrooms} chambres
          </div>
          <div className="flex items-center gap-1">
            <GuestIcon className="w-4 h-4" />
            {data.guests} invités
          </div>
          <div className="flex items-center gap-1">
            <BathIcon className="w-4 h-4" />
            {data.bathrooms} SDB
          </div>
          <div className="flex items-center gap-1">
            <AreaIcon className="w-4 h-4" />
            {data.area} m²
          </div>
        </div>
      </div>
    </div>
  );
}
