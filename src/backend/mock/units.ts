import { faker } from "@faker-js/faker";
import { IApiUnitItemResponse } from "../api/api.interface";
import { AdPeriod } from "@/interfaces/ads";

export const CompanyUnitsMockData: IApiUnitItemResponse[] = [
  {
    _id: "67d22b758e13c91d607fb700",
    company: "67d22b588e13c91d607fb6fb",
    name: "Restaurante Porto Caires",
    full_address:
      "Rua Coronel Oscar Porto, 19 - Paraíso, São Paulo - SP, 04003-000, Brazil",
    neighborhood: "Paraíso",
    address: "Rua Coronel Oscar Porto",
    city: "São Paulo",
    state: "São Paulo",
    country: "Brazil",
    street_number: "19",
    type: "RESTAURANT",
    status: "IN_REVIEW",
    max_capacity: 500,
    location: {
      type: "Point",
      coordinates: [-46.65015529999999, -23.5705101],
    },
    created_at: "2025-03-13T00:48:53.982Z",
    updated_at: "2025-03-13T00:48:53.982Z",
    devices: {
      smart_tv: 5,
    },
  },
  {
    _id: "67d22bfa8e13c91d607fb709",
    company: "67d22be98e13c91d607fb704",
    name: "Restaurante e Lanchonete Oliveira",
    full_address:
      "R. Manuel da Nóbrega, 151 - Paraíso, São Paulo - SP, 04001-080, Brazil",
    neighborhood: "Paraíso",
    address: "Rua Manuel da Nóbrega",
    city: "São Paulo",
    state: "São Paulo",
    country: "Brazil",
    street_number: "151",
    type: "RESTAURANT",
    status: "IN_REVIEW",
    max_capacity: 500,
    location: {
      type: "Point",
      coordinates: [-46.6491099, -23.5691049],
    },
    created_at: "2025-03-13T00:51:06.543Z",
    updated_at: "2025-03-13T00:51:06.543Z",
    devices: {
      smart_tv: 3,
    },
  },
  {
    _id: "67d22c8d8e13c91d607fb712",
    company: "67d22c748e13c91d607fb70d",
    name: "Embaixada Mineira Bela Vista SP",
    full_address:
      "R. Cincinato Braga, 540 - Bela Vista, São Paulo - SP, 01333-910, Brazil",
    neighborhood: "Bela Vista",
    address: "Rua Cincinato Braga",
    city: "São Paulo",
    state: "São Paulo",
    country: "Brazil",
    street_number: "540",
    type: "RESTAURANT",
    status: "IN_REVIEW",
    max_capacity: 500,
    location: {
      type: "Point",
      coordinates: [-46.647769, -23.5667589],
    },
    created_at: "2025-03-13T00:53:33.131Z",
    updated_at: "2025-03-13T00:53:33.131Z",
    devices: {
      smart_tv: 7,
    },
  },
  {
    _id: "67d2c2c4e52227535073b744",
    company: "67d228068e13c91d607fb6ed",
    name: "Quinta do Marquês- Conde",
    full_address:
      "Av. Sagitário, 555 - Alphaville Conde I, Barueri - SP, 06473-075, Brazil",
    neighborhood: "Alphaville",
    address: "Avenida Sagitário",
    city: "Barueri",
    state: "São Paulo",
    country: "Brazil",
    street_number: "555",
    type: "RESTAURANT",
    status: "IN_REVIEW",
    max_capacity: 500,
    location: {
      type: "Point",
      coordinates: [-46.8626257, -23.4846019],
    },
    created_at: "2025-03-13T11:34:28.992Z",
    updated_at: "2025-03-13T11:34:28.992Z",
    devices: {
      smart_tv: 7,
    },
  },
  {
    _id: "67d2c305e52227535073b749",
    company: "67d22695b502526b43e5d1e9",
    name: "La Ville",
    full_address:
      "Al. Rio Negro, 1286 - Alphaville Industrial, Barueri - SP, 06454-000, Brazil",
    neighborhood: "Alphaville",
    address: "Alameda Rio Negro",
    city: "Barueri",
    state: "São Paulo",
    country: "Brazil",
    street_number: "1286",
    type: "RESTAURANT",
    status: "IN_REVIEW",
    max_capacity: 500,
    location: {
      type: "Point",
      coordinates: [-46.8482573, -23.4940666],
    },
    created_at: "2025-03-13T11:35:33.208Z",
    updated_at: "2025-03-13T11:35:33.208Z",
    devices: {
      smart_tv: 7,
    },
  },
].map((item) => ({
  ...item,
  prices: [
    {
      period: AdPeriod.DAILY,
      display_times: faker.number.int({ min: 100, max: 500 }),
      price_total: faker.number.int({ min: 50, max: 100 }),
      average_visitors: faker.number.int({ min: 300, max: 1000 }),
    },
    {
      period: AdPeriod.WEEKLY,
      display_times: faker.number.int({ min: 1000, max: 5000 }),
      price_total: faker.number.int({ min: 100, max: 500 }),
      average_visitors: faker.number.int({ min: 3000, max: 10000 }),
    },
    {
      period: AdPeriod.MONTHLY,
      display_times: faker.number.int({ min: 10000, max: 50000 }),
      price_total: faker.number.int({ min: 1000, max: 5000 }),
      average_visitors: faker.number.int({ min: 10000, max: 100000 }),
    },
  ],
})) as IApiUnitItemResponse[];

export const CompanyUnitsMock = {
  pages: 1,
  total: 5,
  data: CompanyUnitsMockData,
  limit: 20,
  page: 0,
};

export const CompanyUnitsGroupdMock = {
  data: [
    {
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "São Paulo",
      country: "Brazil",
      count: 1,
    },
    {
      neighborhood: "Alphaville",
      city: "Barueri",
      state: "São Paulo",
      country: "Brazil",
      count: 2,
    },
    {
      neighborhood: "Paraíso",
      city: "São Paulo",
      state: "São Paulo",
      country: "Brazil",
      count: 2,
    },
  ],
};
