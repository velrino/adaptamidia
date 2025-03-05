import { AdStatus, AdType } from "@/interfaces/ads";
import { IApiAdvertisementResponse } from "../api/api.interface";

export const Advertisements: IApiAdvertisementResponse = {
  total: 30,
  page: 10,
  pages: 10,
  data: [
    {
      company: "5f7932c1a123456789012345",
      title: "Example Advertisement",
      type: AdType.IMAGE,
      items: [
        {
          title: "Item 1",
          description: "Description for Item 1",
          seconds: 5,
          source: "/ads/1.jpg",
          type: AdType.IMAGE,
        },
        {
          title: "Item 2",
          description: "Description for Item 2",
          seconds: 10,
          source: "/ads/1.jpg",
          type: AdType.IMAGE,
        },
      ],
      seconds: 15,
      status: AdStatus.ACTIVE,
      start_date: "2021-01-01T00:00:00.000Z",
      end_date: "2021-12-31T23:59:59.000Z",
      _id: "67a1150e9f1be9d226e7cae0",
      created_at: "2025-02-03T19:12:14.377Z",
      updated_at: "2025-02-03T19:12:14.377Z",
    },
  ],
};
