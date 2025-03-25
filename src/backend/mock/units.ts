/* eslint-disable @typescript-eslint/no-explicit-any */

import { faker } from "@faker-js/faker";
import {
  IApiUnitItemResponse,
  IApiUnitPopularTimeRecordResponse,
} from "../api/api.interface";
import { AdPeriod } from "@/interfaces/ads";
import { GenerateNumberRange } from "@/utils/generic";

import { GenerateWeekData } from "@/interfaces/company-unit";
import {
  ICompanyDocumentType,
  ICompanyStatus,
  ICompanyType,
} from "@/interfaces/company";

export const CompanyUnitRecordDefault: IApiUnitItemResponse = {
  _id: String(),
  company: {
    _id: String(),
    created_at: String(),
    updated_at: String(),
    document: String(),
    document_type: ICompanyDocumentType.CNPJ,
    name: String(),
    type: ICompanyType.LOCAL,
    status: ICompanyStatus.IN_REVIEW,
  },
  name: String(),
  full_address: String(),
  neighborhood: String(),
  complement: String(),
  address: String(),
  city: String(),
  state: String(),
  country: String(),
  street_number: String(),
  type: String(),
  status: String(),
  max_capacity: 0,
  location: {
    type: "Point",
    coordinates: [0, 0],
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  devices: {
    smart_tv: 0,
  },
  image: `/images/local/${faker.number.int({ min: 1, max: 5 })}.jpg`,
  prices: [],
  popular_time: {
    _id: faker.string.uuid(),
    company_unit: faker.string.uuid(),
    days: GenerateWeekData(),
  },
};

export const CompanyUnitsMockData: IApiUnitItemResponse[] = (
  [
    {
      _id: "67d22b758e13c91d607fb700",
      company: {
        _id: "67d22b588e13c91d607fb6fb",
        document: "20992958000113",
        name: "LANCHONETE E RESTAURANTE PORTO CAIRES LTDA",
        type: "LOCAL",
        created_at: "2025-03-13T00:48:24.263Z",
        updated_at: "2025-03-13T00:48:24.263Z",
        document_type: "CNPJ",
        status: "IN_REVIEW",
      },
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
      average_visitors: {
        daily: 100,
        weekly: 700,
        monthly: 3000,
      },
      max_capacity: 500,
      location: {
        type: "Point",
        coordinates: [-46.65015529999999, -23.5705101],
      },
      created_at: "2025-03-13T00:48:53.982Z",
      updated_at: "2025-03-13T00:48:53.982Z",
    },
    {
      _id: "67d22bfa8e13c91d607fb709",
      company: {
        _id: "67d22be98e13c91d607fb704",
        document: "26193150000152",
        name: "Oliveira Restaurante e Emporio LTDA",
        type: "LOCAL",
        created_at: "2025-03-13T00:50:49.357Z",
        updated_at: "2025-03-13T00:50:49.357Z",
        document_type: "CNPJ",
        status: "IN_REVIEW",
      },
      name: "Restaurante Porto Caires",
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
      average_visitors: {
        daily: 100,
        weekly: 700,
        monthly: 3000,
      },
      max_capacity: 500,
      location: {
        type: "Point",
        coordinates: [-46.6491099, -23.5691049],
      },
      created_at: "2025-03-13T00:51:06.543Z",
      updated_at: "2025-03-13T00:51:06.543Z",
    },
    {
      _id: "67d22c8d8e13c91d607fb712",
      company: {
        _id: "67d22c748e13c91d607fb70d",
        document: "32291672000190",
        name: "EMBAIXADA MINEIRA BAR E RESTAURANTE LTDA",
        type: "LOCAL",
        created_at: "2025-03-13T00:53:08.713Z",
        updated_at: "2025-03-13T00:53:08.713Z",
        document_type: "CNPJ",
        status: "IN_REVIEW",
      },
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
      average_visitors: {
        daily: 100,
        weekly: 700,
        monthly: 3000,
      },
      max_capacity: 500,
      location: {
        type: "Point",
        coordinates: [-46.647769, -23.5667589],
      },
      created_at: "2025-03-13T00:53:33.131Z",
      updated_at: "2025-03-13T00:53:33.131Z",
    },
    {
      _id: "67d2c2c4e52227535073b744",
      company: {
        _id: "67d228068e13c91d607fb6ed",
        document: "21206201000110",
        name: "Quinta do Conde",
        type: "LOCAL",
        created_at: "2025-03-13T00:34:15.002Z",
        updated_at: "2025-03-13T00:34:15.002Z",
        document_type: "CNPJ",
        status: "IN_REVIEW",
      },
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
      average_visitors: {
        daily: 100,
        weekly: 700,
        monthly: 3000,
      },
      max_capacity: 500,
      location: {
        type: "Point",
        coordinates: [-46.8626257, -23.4846019],
      },
      created_at: "2025-03-13T11:34:28.992Z",
      updated_at: "2025-03-13T11:34:28.992Z",
    },
    {
      _id: "67d2c305e52227535073b749",
      company: {
        _id: "67d22695b502526b43e5d1e9",
        document: "53735288000109",
        name: "Le Ville Paes e Doces LTDA",
        type: "LOCAL",
        created_at: "2025-03-13T00:28:05.129Z",
        updated_at: "2025-03-13T00:28:05.129Z",
        document_type: "CNPJ",
        status: "IN_REVIEW",
      },
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
      average_visitors: {
        daily: 100,
        weekly: 700,
        monthly: 3000,
      },
      max_capacity: 500,
      location: {
        type: "Point",
        coordinates: [-46.8482573, -23.4940666],
      },
      created_at: "2025-03-13T11:35:33.208Z",
      updated_at: "2025-03-13T11:35:33.208Z",
    },
  ] as any
).map((item: any) => {
  const uniquePrices = new Map();

  const prices = GenerateNumberRange(15, 40)
    .flatMap((seconds) => [
      {
        period: AdPeriod.DAILY,
        display_times: faker.number.int({ min: 100, max: 500 }),
        price_total: faker.number.int({ min: 50, max: 100 }),
        seconds,
        average_visitors: faker.number.int({ min: 300, max: 1000 }),
      },
      {
        period: AdPeriod.WEEKLY,
        display_times: faker.number.int({ min: 1000, max: 5000 }),
        price_total: faker.number.int({ min: 100, max: 500 }),
        average_visitors: faker.number.int({ min: 3000, max: 10000 }),
        seconds,
      },
      {
        period: AdPeriod.MONTHLY,
        display_times: faker.number.int({ min: 10000, max: 50000 }),
        price_total: faker.number.int({ min: 1000, max: 5000 }),
        average_visitors: faker.number.int({ min: 10000, max: 100000 }),
        seconds,
      },
      {
        period: AdPeriod.YEARLY,
        display_times: faker.number.int({ min: 10000, max: 50000 }),
        price_total: faker.number.int({ min: 1000, max: 5000 }),
        average_visitors: faker.number.int({ min: 10000, max: 100000 }),
        seconds,
      },
    ])
    .filter((ad) => {
      const key = `${ad.period}-${ad.seconds}`;

      if (uniquePrices.has(key)) {
        return false;
      }

      uniquePrices.set(key, true);
      return true;
    });

  const popular_time: IApiUnitPopularTimeRecordResponse = {
    _id: faker.string.uuid(),
    company_unit: faker.string.uuid(),
    days: GenerateWeekData(),
  };

  return {
    ...item,
    devices: {
      smart_tv: faker.number.int({ min: 3, max: 10 }),
    },
    image: `/images/local/${faker.number.int({ min: 1, max: 5 })}.jpg`,
    prices,
    popular_time,
  };
}) as IApiUnitItemResponse[];

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
