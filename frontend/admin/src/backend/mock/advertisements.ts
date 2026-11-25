import {
  AdsAudience,
  AdStatus,
  AdType,
  BrandSegment,
  BrandSegmentTranslations,
} from "@/interfaces/ads";
import { IApiAdvertisementItem } from "../api/api.interface";
import { DateHelper } from "@/utils/date";
import { IReactSelectOption } from "@/interfaces/general";
import {
  ICompanyDocumentType,
  ICompanyStatus,
  ICompanyType,
} from "@/interfaces/company";
import { AdvertisementsPlans } from "@/utils/generic";

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

export const Default = {
  video: {
    landscape:
      "https://storage.googleapis.com/adapta-midia/default/landscape.mp4",
    portrait:
      "https://storage.googleapis.com/adapta-midia/default/portrait.mp4",
  },
};

export const AdsRecordDefault: IApiAdvertisementItem = {
  _id: String(),
  plan: AdvertisementsPlans.TWO_WEEKS,
  company: {
    _id: String(),
    document: String(),
    name: String(),
    type: ICompanyType.ADVERTISER,
    created_at: "2025-03-13T00:29:13.659Z",
    updated_at: "2025-03-13T00:29:13.659Z",
    document_type: ICompanyDocumentType.CNPJ,
    status: ICompanyStatus.TEST,
  },
  title: String(),
  description: String(),
  type: AdType.VIDEO,
  spotlight: false,
  source_landscape: Default.video.landscape,
  source_portrait: Default.video.portrait,
  seconds: 10,
  status: AdStatus.REVIEW,
  start_date: DateHelper.addDays(new Date(), 1, "days").toISOString(),
  end_date: DateHelper.addDays(new Date(), 1, "month").toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  neighborhood: [],
  audience: [],
  segments: [],
  units: [],
};
