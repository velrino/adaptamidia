"use client";

import { AdType } from "@/interfaces/ads";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";

interface Ad {
  url: string;
  title: string;
  description: string;
  seconds: number;
  advertisement: boolean;
  type: AdType;
}

interface AdStat {
  index: number;
  //   views: number;
  count: number;
  timestamps: string[];
}

const fetchedAds: Ad[] = [
  {
    url: "/images/ads/1.jpg",
    title: "Example",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Sed at felis sit amet justo sodales malesuada vitae at erat. Curabitur dignissim, urna et sollicitudin venenatis, felis ligula varius nisl, vel facilisis lacus nunc a justo. Ut ultricies, magna ut laoreet fermentum, nulla sapien iaculis elit, sit amet facilisis nisi erat quis elit. Suspendisse potenti. Phasellus nec metus non elit luctus vehicula vel at orci.",
    seconds: 3,
    advertisement: true,
    type: AdType.IMAGE,
  },
  {
    url: "/images/ads/3.mp4",
    title: "Second Example",
    description:
      "Ad 1 Lorem Ipsum ad 1 test for title example remeber another test for title example remeber another test for title example remeber",
    seconds: 3,
    advertisement: false,
    type: AdType.VIDEO,
  },
  {
    url: "/images/ads/2.jpg",
    title: "Another Example",
    description: "Ad 3 teste short text for example how display",
    seconds: 3,
    advertisement: false,
    type: AdType.IMAGE,
  },
];

const sendAPI = () => {
  const storedData = JSON.parse(localStorage.getItem("adStats") || "[]");
  console.log("Sending data to API:", storedData);
};

const updateAdStats = (adIndex: number) => {
  const stats: AdStat[] = JSON.parse(
    localStorage.getItem("adStats") || "[]"
  ) as AdStat[];
  const adStatIndex = (stats || []).findIndex(
    (stat: AdStat) => stat.index === adIndex
  );

  if (adStatIndex > -1) {
    stats[adStatIndex].count += 1;
    stats[adStatIndex].timestamps.push(new Date().toISOString());
  } else {
    stats.push({
      index: adIndex,
      count: 1,
      timestamps: [new Date().toISOString()],
    });
  }
  localStorage.setItem("adStats", JSON.stringify(stats));
};

const AdDisplay: React.FC<{ ad: Ad; advertisement: boolean }> = ({
  ad,
  advertisement,
}) => {
  return (
    <div
      className={`relative h-full ${
        advertisement ? "w-9/12" : "w-full"
      } bg-black flex items-center justify-center overflow-hidden`}
    >
      <div className="absolute top-20 text-white text-2xl bg-orange-500 px-4 py-2 z-50 rounded-r-sm left-0">
        {ad.title}
      </div>
      {ad.type === AdType.VIDEO ? (
        <video
          src={ad.url}
          autoPlay
          loop
          muted
          className="h-full w-full object-cover"
        ></video>
      ) : (
        <img
          src={ad.url}
          alt={ad.title}
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute bottom-52 text-white text-2xl bg-black bg-opacity-75 px-4 py-2 rounded-sm mx-10">
        {ad.description}
      </div>
      <footer className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-between bg-black bg-opacity-75 text-white text-xl">
        <div className="bg-blue-500 px-4 py-2">Dolar Aqui</div>
        <div className="bg-orange-500 px-4 py-2">Tempo Aqui</div>
        <div className="bg-red-500 px-4 py-2">Horas Aqui</div>
      </footer>
    </div>
  );
};

export default function AdsComponent() {
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("access_token") || null;
  const preview = searchParams.get("preview") || null;
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [advertisement, setAdvertisement] = useState(true);

  useEffect(() => {
    console.log({ accessToken, preview });
  }, [accessToken, preview]);

  useEffect(() => {
    const currentAd = fetchedAds[currentAdIndex];
    updateAdStats(currentAdIndex);

    const timer = setTimeout(() => {
      const nextIndex = (currentAdIndex + 1) % fetchedAds.length;
      setAdvertisement(() => fetchedAds[nextIndex].advertisement);
      sendAPI();
      setCurrentAdIndex(nextIndex);
    }, currentAd.seconds * 1000);

    return () => clearTimeout(timer);
  }, [currentAdIndex]);

  return (
    <div className="h-screen w-screen flex">
      {advertisement && (
        <div className="relative h-full w-3/12 z-50 bg-red-600 flex items-center justify-center text-white text-3xl">
          Anuncio Aqui
        </div>
      )}
      <AdDisplay
        ad={fetchedAds[currentAdIndex]}
        advertisement={advertisement}
      />
    </div>
  );
}
