/* eslint-disable @typescript-eslint/no-explicit-any */

import { faker } from "@faker-js/faker";
import {
  AdsAudience,
  AdStatus,
  AdType,
  BrandSegment,
  BrandSegmentTranslations,
} from "@/interfaces/ads";
import {
  IApiAdvertisementItem,
  IApiAdvertisementResponse,
} from "../api/api.interface";
import { DateHelper } from "@/utils/date";
import { IReactSelectOption } from "@/interfaces/general";
import { CompanyUnitsGroupdMock } from "./units";

const neighborhoodsMock = [
  CompanyUnitsGroupdMock.data.map((item) => item.neighborhood)[0],
];

const getRandom = (list: any[], min = 2, max = 5): AdsAudience[] => {
  return Array.from({ length: faker.number.int({ min, max }) }, () =>
    faker.helpers.arrayElement(list)
  );
};

export const AdvertisementsMock = ({
  page,
}: {
  page: number;
}): IApiAdvertisementResponse => {
  const advertisementsMockRandom = Array.from(
    { length: faker.number.int({ min: 20, max: 30 }) },
    () => {
      const items = Array.from({ length: 3 }, () => ({
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        seconds: faker.number.int({ min: 20, max: 50 }),
        source: `/images/ads/${faker.number.int({ min: 1, max: 9 })}.jpg`,
        type: AdType.IMAGE,
      }));

      // const totalSeconds = items.reduce((sum, item) => sum + item.seconds, 0);

      const start_date = DateHelper.dayjs()
        .add(1, "day")
        .toDate()
        .toISOString();
      return {
        company: "67d226d9b502526b43e5d1ed",
        title: faker.company.catchPhrase(),
        description: faker.word.words({ count: { min: 10, max: 30 } }),
        type: AdType.IMAGE,
        spotlight: Boolean(Math.random() < 0.5),
        items,
        seconds: 20,
        status: faker.helpers.arrayElement([
          AdStatus.ACTIVE,
          AdStatus.INACTIVE,
          AdStatus.REVIEW,
        ]),
        // start_date: faker.date.past().toISOString(),
        start_date,
        end_date: faker.date.future().toISOString(),
        _id: faker.string.uuid(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        neighborhood: neighborhoodsMock,
        audience: getRandom(Object.values(AdsAudience)),
        segments: getRandom(Object.values(BrandSegment)),
      };
    }
  );

  const limit = 10;
  const total = advertisementsMockRandom.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = advertisementsMockRandom.slice(startIndex, endIndex);

  return {
    total,
    page,
    pages,
    limit,
    data: paginatedData,
  };
};

export const AdvertisementsMockData: IApiAdvertisementResponse = {
  total: 30,
  page: 10,
  pages: 10,
  limit: 10,
  data: [
    {
      company: "67d226d9b502526b43e5d1ed",
      title: "Example Advertisement video 1",
      type: AdType.VIDEO,
      items: [
        {
          title: "Item 1",
          description: "Description for Item 1",
          seconds: 5,
          source: "/images/ads/clients/1.mp4",
          type: AdType.VIDEO,
        },
      ],
      description: faker.word.words({ count: { min: 10, max: 30 } }),
      spotlight: false,
      seconds: 15,
      status: AdStatus.ACTIVE,
      start_date: "2021-01-01T00:00:00.000Z",
      end_date: "2021-12-31T23:59:59.000Z",
      _id: "67a1150e9f1be9d226e7cae0",
      created_at: "2025-02-03T19:12:14.377Z",
      updated_at: "2025-02-03T19:12:14.377Z",
      neighborhood: neighborhoodsMock,
      audience: getRandom(Object.values(AdsAudience)),
      segments: getRandom(Object.values(BrandSegment)),
    },
    {
      company: "67d226d9b502526b43e5d1ed",
      title: "Example Advertisement video 1",
      type: AdType.IMAGE,
      items: [
        {
          title: "Item 1",
          description: "Description for Item 1",
          seconds: 5,
          source: "/images/ads/clients/4.jpg",
          type: AdType.IMAGE,
        },
      ],
      description: faker.word.words({ count: { min: 10, max: 30 } }),
      spotlight: false,
      seconds: 15,
      status: AdStatus.ACTIVE,
      start_date: "2021-01-01T00:00:00.000Z",
      end_date: "2021-12-31T23:59:59.000Z",
      _id: "67a1150e9f1be9d226e7cae0",
      created_at: "2025-02-03T19:12:14.377Z",
      updated_at: "2025-02-03T19:12:14.377Z",
      neighborhood: neighborhoodsMock,
      audience: getRandom(Object.values(AdsAudience)),
      segments: getRandom(Object.values(BrandSegment)),
    },
    {
      company: "67d226d9b502526b43e5d1ed",
      title: "Example Advertisement video 1",
      type: AdType.VIDEO,
      items: [
        {
          title: "Item 1",
          description: "Description for Item 1",
          seconds: 5,
          source: "/images/ads/clients/2.mp4",
          type: AdType.VIDEO,
        },
      ],
      description: faker.word.words({ count: { min: 10, max: 30 } }),
      spotlight: false,
      seconds: 15,
      status: AdStatus.ACTIVE,
      start_date: "2021-01-01T00:00:00.000Z",
      end_date: "2021-12-31T23:59:59.000Z",
      _id: "67a1150e9f1be9d226e7cae0",
      created_at: "2025-02-03T19:12:14.377Z",
      updated_at: "2025-02-03T19:12:14.377Z",
      neighborhood: neighborhoodsMock,
      audience: getRandom(Object.values(AdsAudience)),
      segments: getRandom(Object.values(BrandSegment)),
    },
    {
      company: "67d226d9b502526b43e5d1ed",
      title: "Example Advertisement video 1",
      type: AdType.IMAGE,
      items: [
        {
          title: "Item 1",
          description: "Description for Item 1",
          seconds: 5,
          source: "/images/ads/clients/2.png",
          type: AdType.IMAGE,
        },
      ],
      description: faker.word.words({ count: { min: 10, max: 30 } }),
      spotlight: false,
      seconds: 15,
      status: AdStatus.ACTIVE,
      start_date: "2021-01-01T00:00:00.000Z",
      end_date: "2021-12-31T23:59:59.000Z",
      _id: "67a1150e9f1be9d226e7cae0",
      created_at: "2025-02-03T19:12:14.377Z",
      updated_at: "2025-02-03T19:12:14.377Z",
      neighborhood: neighborhoodsMock,
      audience: getRandom(Object.values(AdsAudience)),
      segments: getRandom(Object.values(BrandSegment)),
    },
    {
      company: "67d226d9b502526b43e5d1ed",
      title: "Example Advertisement video 1",
      type: AdType.IMAGE,
      items: [
        {
          title: "Item 1",
          description: "Description for Item 1",
          seconds: 5,
          source: "/images/ads/clients/1.png",
          type: AdType.IMAGE,
        },
      ],
      description: faker.word.words({ count: { min: 10, max: 30 } }),
      spotlight: false,
      seconds: 15,
      status: AdStatus.ACTIVE,
      start_date: "2021-01-01T00:00:00.000Z",
      end_date: "2021-12-31T23:59:59.000Z",
      _id: "67a1150e9f1be9d226e7cae0",
      created_at: "2025-02-03T19:12:14.377Z",
      updated_at: "2025-02-03T19:12:14.377Z",
      neighborhood: neighborhoodsMock,
      audience: getRandom(Object.values(AdsAudience)),
      segments: getRandom(Object.values(BrandSegment)),
    },
  ],
};

export const AudienceOptionsMock: IReactSelectOption[] = [
  { value: AdsAudience.EXECUTIVES, label: "Executivos" },
  { value: AdsAudience.TOURISTS, label: "Turistas" },
  { value: AdsAudience.PASSENGERS, label: "Passageiros" },
  { value: AdsAudience.DRIVERS, label: "Motoristas" },
  { value: AdsAudience.STUDENTS, label: "Estudantes" },
  { value: AdsAudience.CONSUMERS, label: "Consumidores" },
  { value: AdsAudience.FANS, label: "Torcedores" },
  { value: AdsAudience.PARTYGOERS, label: "Festeiros" },
  { value: AdsAudience.SHOPPERS, label: "Compradores" },
  { value: AdsAudience.ATHLETES, label: "Atletas" },
].sort((a, b) => a.label.localeCompare(b.label));

export const SegmentOptionsMock: IReactSelectOption[] = Object.entries(
  BrandSegmentTranslations
)
  .map(([value, label]) => ({ value: value as BrandSegment, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const AdsRecordDefault: IApiAdvertisementItem = {
  _id: String(),
  company: String(),
  title: String(),
  description: String(),
  type: AdType.IMAGE,
  spotlight: false,
  items: [
    {
      title: "Item 1",
      description: "Description for Item 1",
      seconds: 5,
      source: "/images/ads/clients/1.png",
      type: AdType.IMAGE,
    },
  ],
  seconds: 20,
  status: AdStatus.REVIEW,
  start_date: DateHelper.addDays(new Date(), 1, "days").toISOString(),
  end_date: DateHelper.addDays(new Date(), 1, "month").toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  neighborhood: [],
  audience: [],
  segments: [],
};
