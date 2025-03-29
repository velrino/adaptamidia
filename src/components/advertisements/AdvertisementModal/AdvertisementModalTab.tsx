import { Tabs } from "@/components/ui/tabs/Principal";
import React from "react";
import AdvertisementModalLocal from "./AdvertisementModalLocal";
import AdvertisementModalAbout from "./AdvertisementModalAbout";
import { IAdvertisementModalCommonProps } from "./interface";
import { Display } from "../Ads/Display";
import { AdsCurrentType, DisplayThemes } from "@/interfaces/ads";
import { AdvertisementComponent } from "./AdvertisementModalItems";
import { useSession } from "next-auth/react";

const AdvertisementModalTab: React.FC<IAdvertisementModalCommonProps> = ({
  data,
  onUpdate,
}: IAdvertisementModalCommonProps) => {
  const { data: session } = useSession();

  const openPreview = () => {
    if (!session?.api_session || !data._id) {
      return;
    }

    window.open(`/display?id=${data._id}`, "_blank");
  };

  const tabs = [
    {
      id: "ABOUT",
      label: "Sobre",
      content: <AdvertisementModalAbout data={data} onUpdate={onUpdate} />,
    },
    {
      id: "LOCAL",
      label: "Locais",
      content: <AdvertisementModalLocal data={data} onUpdate={onUpdate} />,
    },
    {
      id: "ADS",
      label: "Anúncio",
      content: (
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="text-black dark:text-white text-center">
            {data._id && (
              <div className="cursor-pointer">
                <div className="h-10" onClick={openPreview}>
                  Abrir no Display
                </div>
              </div>
            )}
            {!data._id && (
              <div>
                <div className="h-10">Salve para ver no Display</div>
              </div>
            )}
            <div className="flex justify-center max-h-0">
              <div className="scale-45">
                <Display
                  list={[data].map((item) => ({
                    data: item,
                    type: AdsCurrentType.ADVERTISEMENT,
                  }))}
                  theme={DisplayThemes.brand}
                  preview={true}
                />
              </div>
            </div>
          </div>
          <div className="aspect-video">
            <AdvertisementComponent data={data} onUpdate={onUpdate} />
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
        defaultTabId="ABOUT"
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
