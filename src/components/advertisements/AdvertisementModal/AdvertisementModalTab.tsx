import { Tabs } from "@/components/ui/tabs/Principal";
import React from "react";
import AdvertisementModalLocal from "./AdvertisementModalLocal";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { IAdvertisementModalCommonProps } from "./interface";
import { Display } from "../Ads/Display";
import { AdsCurrentType, DisplayThemes } from "@/interfaces/ads";
import { AdvertisementComponent } from "./AdvertisementModalItems";

const AdvertisementModalTab: React.FC<IAdvertisementModalCommonProps> = ({
  data,
  onUpdate,
}: IAdvertisementModalCommonProps) => {
  const tabs = [
    {
      id: "LOCAL",
      label: "Locais",
      content: <AdvertisementModalLocal data={data} onUpdate={onUpdate} />,
    },
    {
      id: "ABOUT",
      label: "Sobre",
      content: <AdvertisementModalAbout data={data} onUpdate={onUpdate} />,
    },
    {
      id: "ADS",
      label: "Anúncio",
      content: (
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="text-white text-center">
            <AdvertisementComponent items={data.items} onUpdate={onUpdate} />
          </div>
          <div className="text-white flex justify-center text-center max-h-0">
            <div className="scale-47">
              <Display
                list={[data].map((item) => ({
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
    // {
    //   id: "Three",
    //   label: "Three",
    //   content: <TabTwo data={data} onUpdate={onUpdate} />,
    // },
  ];

  return (
    <div>
      <Tabs
        tabs={tabs}
        defaultTabId="ADS"
        styles={{
          nav: "p-0",
          navMenu: "mx-auto",
        }}
      />
    </div>
  );
};

// const TabTwo: React.FC<{
//   data: IApiAdvertisementItem;
//   onUpdate: (data: Partial<IApiAdvertisementItem>) => void;
// }> = ({ data, onUpdate }) => {
//   return (
//     <div className="space-y-2">
//       <p>title: {data.title}</p>
//       <p>end_date: {data.end_date}</p>
//       <Input
//         type="text"
//         value={data.title}
//         onChange={(e) => onUpdate({ title: e.target.value })}
//         placeholder="Edit Name"
//       />
//     </div>
//   );
// };

export default AdvertisementModalTab;
