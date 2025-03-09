"use client";

import React, { useState } from "react";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { AdvertisementModalCommonProps } from "./interface";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { AdvertisementComponent } from "./AdvertisementModalItems";
import { Display } from "../Ads/Display";
import { AdsCurrentType, DisplayThemes } from "@/interfaces/ads";

interface TabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      className={`inline-flex items-center border-b-2 px-2.5 py-2 text-sm font-medium transition-colors duration-200 ease-in-out ${
        isActive
          ? "text-brand-500 dark:text-brand-400 border-brand-500 dark:border-brand-400"
          : "bg-transparent text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

enum TabsIds {
  ABOUT = "ABOUT",
  ADS = "ADS",
  CAMPAIGN = "CAMPAIGN",
}

const tabs = [
  { id: TabsIds.ABOUT, label: "Sobre" },
  { id: TabsIds.ADS, label: "Anúncios" },
  { id: TabsIds.CAMPAIGN, label: "Campanha" },
];

const AdvertisementModalTab = (params: AdvertisementModalCommonProps) => {
  const [currentTab, setCurrentTab] = useState<TabsIds>(TabsIds.ABOUT);

  const callback = (result: IApiAdvertisementItem) => {
    if (params.onCallback) {
      params.onCallback(result);
    }
  };

  return (
    <div>
      <nav className="-mb-px flex space-x-2 overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 dark:[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            isActive={currentTab === tab.id}
            onClick={() => setCurrentTab(tab.id)}
          />
        ))}
      </nav>

      <div className="pt-4 dark:border-gray-800">
        {currentTab === TabsIds.ABOUT && (
          <AdvertisementModalAbout
            action={params.action}
            data={params.data}
            onCallback={callback}
          />
        )}
        {currentTab === TabsIds.ADS && (
          <>
            <div className="grid grid-cols-2 gap-4 p-4">
              <div className=" text-white text-center">
                <AdvertisementComponent
                  items={[...params.data.items, ...params.data.items]}
                />
              </div>
              <div className=" text-white flex justify-center text-center max-h-0">
                <div className="scale-47">
                  <Display
                    list={[params.data].map((item) => ({
                      data: item,
                      type: AdsCurrentType.ADVERTISEMENT,
                    }))}
                    theme={DisplayThemes.brand}
                    preview={false}
                  />
                </div>
              </div>
            </div>
          </>
        )}
        {/* {tabs.map((tab) => (
          <TabContent
            key={tab.id}
            id={tab.id}
            title={tab.label}
            isActive={activeTab === tab.id}
          />
        ))} */}
      </div>
    </div>
  );
};

export default AdvertisementModalTab;
