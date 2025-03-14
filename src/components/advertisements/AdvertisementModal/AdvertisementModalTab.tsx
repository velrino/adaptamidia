import { Tabs } from "@/components/ui/tabs/Principal";
import React from "react";
import AdvertisementModalLocal from "./AdvertisementModalLocal";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { IAdvertisementModalCommonProps } from "./interface";

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
        defaultTabId="LOCAL"
        styles={{
          nav: "p-6",
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
