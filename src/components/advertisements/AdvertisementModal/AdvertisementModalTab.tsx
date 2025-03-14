"use client";

import React from "react";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { AdvertisementModalCommonProps } from "./interface";
import { Tabs } from "@/components/ui/tabs/Principal";
import AdvertisementModalLocal from "./AdvertisementModalLocal";

const AdvertisementModalTab = (params: AdvertisementModalCommonProps) => {
  // Defina as abas e seus conteúdos
  const tabs = [
    {
      id: "LOCAL",
      label: "Locais",
      content: <AdvertisementModalLocal action={params.action} />,
    },
    {
      id: "ABOUT",
      label: "Sobre",
      content: <AdvertisementModalAbout action={params.action} />,
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
