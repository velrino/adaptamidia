import { faker } from "@faker-js/faker";
import { AdsAudience, AdStatus, AdType } from "@/interfaces/ads";
import { IApiAdvertisementResponse } from "../api/api.interface";

const getRandomAudiences = (min = 2, max = 5): AdsAudience[] => {
  return Array.from({ length: faker.number.int({ min, max }) }, () =>
    faker.helpers.arrayElement(Object.values(AdsAudience))
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
        seconds: faker.number.int({ min: 5, max: 10 }),
        source: `/images/ads/${faker.number.int({ min: 1, max: 9 })}.jpg`,
        type: AdType.IMAGE,
      }));

      const totalSeconds = items.reduce((sum, item) => sum + item.seconds, 0);

      return {
        company: faker.company.name(),
        title: faker.company.catchPhrase(), //faker.word.words({ count: { min: 5, max: 10 } })
        type: AdType.IMAGE,
        items: Array.from({ length: 2 }, () => ({
          title: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          seconds: faker.number.int({ min: 20, max: 50 }),
          source: `/images/ads/${faker.number.int({ min: 1, max: 9 })}.jpg`,
          type: AdType.IMAGE,
        })),
        seconds: totalSeconds,
        status: faker.helpers.arrayElement([
          AdStatus.ACTIVE,
          AdStatus.INACTIVE,
          AdStatus.REVIEW,
        ]),
        start_date: faker.date.past().toISOString(),
        end_date: faker.date.future().toISOString(),
        _id: faker.string.uuid(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        audience: getRandomAudiences(),
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
      company: "5f7932c1a123456789012345",
      title: "Example Advertisement",
      type: AdType.IMAGE,
      items: [
        {
          title: "Item 1",
          description: "Description for Item 1",
          seconds: 5,
          source: "/images/ads/1.jpg",
          type: AdType.IMAGE,
        },
        {
          title: "Item 2",
          description: "Description for Item 2",
          seconds: 10,
          source: "/images/ads/2.jpg",
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
      audience: getRandomAudiences(),
    },
  ],
};

export const AudienceOptionsMock = [
  { value: AdsAudience.EXECUTIVES, text: "Executivos", selected: false },
  { value: AdsAudience.TOURISTS, text: "Turistas", selected: false },
  { value: AdsAudience.PASSENGERS, text: "Passageiros", selected: false },
  { value: AdsAudience.DRIVERS, text: "Motoristas", selected: false },
  { value: AdsAudience.STUDENTS, text: "Estudantes", selected: false },
  { value: AdsAudience.CONSUMERS, text: "Consumidores", selected: false },
  { value: AdsAudience.FANS, text: "Torcedores", selected: false },
  { value: AdsAudience.PARTYGOERS, text: "Festeiros", selected: false },
  { value: AdsAudience.SHOPPERS, text: "Compradores", selected: false },
  { value: AdsAudience.ATHLETES, text: "Atletas", selected: false },
];
