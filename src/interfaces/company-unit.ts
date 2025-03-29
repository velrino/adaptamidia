import { IApiUnitPopularTimeItem } from "@/backend/api/api.interface";
import { IDay, IReactSelectOption } from "./general";
import { EnumApiCompanyUnitType } from "@/backend/api/api.enum";

export enum CompanyUnitSortKey {
  name = "name",
  type = "type",
  status = "status",
  company = "company",
  full_address = "full_address",
  neighborhood = "neighborhood",
  address = "address",
  country = "country",
  street_number = "street_number",
  city = "city",
  state = "state",
  max_capacity = "max_capacity",
  created_at = "created_at",
  updated_at = "updated_at",
}

export enum CompanyUnitPriceSortKey {
  period = "period",
  display_times = "display_times",
  price_total = "price_total",
  seconds = "seconds",
  average_visitors = "average_visitors",
}

export function GenerateWeekData(): Record<IDay, IApiUnitPopularTimeItem[]> {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    count: 0,
  }));

  const result: Record<IDay, IApiUnitPopularTimeItem[]> = {} as Record<
    IDay,
    IApiUnitPopularTimeItem[]
  >;

  for (const day of Object.values(IDay)) {
    result[day] = [...hours];
  }

  return result;
}

export const CompanyUnitTypeLabels: Record<EnumApiCompanyUnitType, string> = {
  [EnumApiCompanyUnitType.AIRPORT]: "Aeroporto",
  [EnumApiCompanyUnitType.AESTHETIC_CLINIC]: "Clínica de Estética",
  [EnumApiCompanyUnitType.DENTAL_OFFICE]: "Consultório Odontológico",
  [EnumApiCompanyUnitType.INSURANCE_COMPANY]: "Seguradora",
  [EnumApiCompanyUnitType.LAW_OFFICE]: "Escritório de Advocacia",
  [EnumApiCompanyUnitType.MOBILE_ACCESSORY_STORE]:
    "Loja de Acessórios para Celulares",
  [EnumApiCompanyUnitType.COMMERCIAL_BUILDING]: "Prédio comercial",
  [EnumApiCompanyUnitType.RESIDENTIAL_BUILDING]: "Prédio residencial",

  // Food & Beverage
  [EnumApiCompanyUnitType.RESTAURANT]: "Restaurante",
  [EnumApiCompanyUnitType.BAR]: "Bar",
  [EnumApiCompanyUnitType.CAFE]: "Cafeteria",
  [EnumApiCompanyUnitType.BAKERY]: "Padaria",
  [EnumApiCompanyUnitType.ICE_CREAM_SHOP]: "Sorveteria",
  [EnumApiCompanyUnitType.PIZZERIA]: "Pizzaria",
  [EnumApiCompanyUnitType.BUTCHER_SHOP]: "Açougue",
  [EnumApiCompanyUnitType.FISH_MARKET]: "Peixaria",
  [EnumApiCompanyUnitType.JUICE_BAR]: "Lanchonete/Suco",
  [EnumApiCompanyUnitType.FAST_FOOD]: "Fast-food",

  // Retail
  [EnumApiCompanyUnitType.SUPERMARKET]: "Supermercado",
  [EnumApiCompanyUnitType.CONVENIENCE_STORE]: "Loja de Conveniência",
  [EnumApiCompanyUnitType.PHARMACY]: "Farmácia",
  [EnumApiCompanyUnitType.BOOKSTORE]: "Livraria",
  [EnumApiCompanyUnitType.CLOTHING_STORE]: "Loja de Roupas",
  [EnumApiCompanyUnitType.SHOE_STORE]: "Sapataria",
  [EnumApiCompanyUnitType.ELECTRONICS_STORE]: "Loja de Eletrônicos",
  [EnumApiCompanyUnitType.HARDWARE_STORE]: "Loja de Materiais de Construção",
  [EnumApiCompanyUnitType.FURNITURE_STORE]: "Loja de Móveis",
  [EnumApiCompanyUnitType.TOY_STORE]: "Loja de Brinquedos",

  // Services
  [EnumApiCompanyUnitType.BANK]: "Banco",
  [EnumApiCompanyUnitType.CAR_WASH]: "Lava-jato",
  [EnumApiCompanyUnitType.LAUNDRY]: "Lavanderia",
  [EnumApiCompanyUnitType.HAIR_SALON]: "Salão de Beleza",
  [EnumApiCompanyUnitType.BARBER_SHOP]: "Barbearia",
  [EnumApiCompanyUnitType.GYM]: "Academia",
  [EnumApiCompanyUnitType.SPA]: "Spa",
  [EnumApiCompanyUnitType.PET_SHOP]: "Pet Shop",
  [EnumApiCompanyUnitType.VETERINARY_CLINIC]: "Clínica Veterinária",

  // Healthcare
  [EnumApiCompanyUnitType.HOSPITAL]: "Hospital",
  [EnumApiCompanyUnitType.MEDICAL_CLINIC]: "Clínica Médica",
  [EnumApiCompanyUnitType.DENTAL_CLINIC]: "Clínica Odontológica",
  [EnumApiCompanyUnitType.PSYCHOLOGY_CLINIC]: "Clínica Psicológica",
  [EnumApiCompanyUnitType.LABORATORY]: "Laboratório de Análises",

  // Accommodation & Travel
  [EnumApiCompanyUnitType.HOTEL]: "Hotel",
  [EnumApiCompanyUnitType.HOSTEL]: "Hostel",
  [EnumApiCompanyUnitType.GAS_STATION]: "Posto de Gasolina",
  [EnumApiCompanyUnitType.BUS_STATION]: "Rodoviária",
  [EnumApiCompanyUnitType.PARKING_LOT]: "Estacionamento",

  // Entertainment
  [EnumApiCompanyUnitType.CINEMA]: "Cinema",
  [EnumApiCompanyUnitType.THEATER]: "Teatro",
  [EnumApiCompanyUnitType.NIGHTCLUB]: "Boate",
  [EnumApiCompanyUnitType.BOWLING_ALLEY]: "Boliche",
  [EnumApiCompanyUnitType.GAMING_HOUSE]: "Casa de Jogos",

  // Education & Public
  [EnumApiCompanyUnitType.SCHOOL]: "Escola",
  [EnumApiCompanyUnitType.UNIVERSITY]: "Universidade",
  [EnumApiCompanyUnitType.LIBRARY]: "Biblioteca",
  [EnumApiCompanyUnitType.MUSEUM]: "Museu",
  [EnumApiCompanyUnitType.GOVERNMENT_OFFICE]: "Repartição Pública",

  // Others
  [EnumApiCompanyUnitType.CHURCH]: "Igreja",
  [EnumApiCompanyUnitType.FUNERAL_HOME]: "Funerária",
  [EnumApiCompanyUnitType.PRINT_SHOP]: "Gráfica",
};

export const CompanyUnitTypeOptions: IReactSelectOption[] = Object.entries(
  CompanyUnitTypeLabels
)
  .map(([value, label]) => ({
    value: value as EnumApiCompanyUnitType,
    label,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
