import { IApiAdvertisementItemItem } from "@/backend/api/api.interface";
import { AdType } from "@/interfaces/ads";
import { useEffect, useState } from "react";
import { AdvertisementItems } from "./Ads/MediaList";

export function AdvertisementComponent({
  items,
}: {
  items: IApiAdvertisementItemItem[];
}) {
  const [tempItems, setTempItems] = useState<IApiAdvertisementItemItem[]>([]);

  const handleCroppedImage = (croppedBlob: Blob) => {
    const newItem: IApiAdvertisementItemItem = {
      id: new Date().getTime().toString(),
      description: "example",
      seconds: 5,
      source: URL.createObjectURL(croppedBlob),
      title: "Novo anúncio",
      type: AdType.IMAGE,
    };

    setTempItems((prev) => [...prev, newItem]);
  };

  useEffect(() => {
    console.log({ tempItems });
  }, [tempItems]);

  return (
    <>
      <AdvertisementItems
        items={items}
        onUpdate={setTempItems}
        onCropComplete={handleCroppedImage}
      />
      <div className="grid place-items-center w-full">
        <div className="font-bold text-xl rounded text-white">2 Segundos</div>
      </div>
    </>
  );
}
