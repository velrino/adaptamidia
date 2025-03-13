"use client";

import React from "react";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { AdvertisementModalCommonProps } from "./interface";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { AdvertisementComponent } from "./AdvertisementModalItems";
import { Display } from "../Ads/Display";
import { AdsCurrentType, DisplayThemes } from "@/interfaces/ads";
import { Tabs } from "@/components/ui/tabs/Principal";
import AdvertisementModalLocal from "./AdvertisementModalLocal";

const AdvertisementModalTab = (params: AdvertisementModalCommonProps) => {
  const callback = (result: IApiAdvertisementItem) => {
    if (params.onCallback) {
      params.onCallback(result);
    }
  };

  // Defina as abas e seus conteúdos
  const tabs = [
    {
      id: "LOCAL",
      label: "Locais",
      content: (
        <AdvertisementModalLocal
          action={params.action}
          data={params.data}
          onCallback={callback}
        />
      ),
    },
    {
      id: "ABOUT",
      label: "Sobre",
      content: (
        <AdvertisementModalAbout
          action={params.action}
          data={params.data}
          onCallback={callback}
        />
      ),
    },
    {
      id: "ADS",
      label: "Anúncios",
      content: (
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="text-white text-center">
            <AdvertisementComponent
              items={[...params.data.items, ...params.data.items]}
            />
          </div>
          <div className="text-white flex justify-center text-center max-h-0">
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
      ),
    },
    {
      id: "CAMPAIGN",
      label: "Campanha",
      content: <div>Conteúdo da Campanha</div>, // Adicione o conteúdo da aba de Campanha aqui
    },
  ];

  return (
    <div>
      <Tabs
        tabs={tabs}
        defaultTabId="LOCAL"
        styles={{
          nav: "-6",
          navMenu: "mx-auto",
        }}
      />
    </div>
  );
};

export default AdvertisementModalTab;
