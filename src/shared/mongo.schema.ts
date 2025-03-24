import {
  AdvertisementCampaign,
  AdvertisementCampaignSchema,
} from 'src/modules/advertisement-campaign/advertisement-campaign.schema';
import {
  Advertisement,
  AdvertisementSchema,
} from 'src/modules/advertisement/advertisement.schema';
import {
  CompanyUnitPopularTime,
  CompanyUnitPopularTimeSchema,
} from 'src/modules/company-unit/popular-times/company-unit-popular-times.schema';
import {
  CompanyUnit,
  CompanyUnitSchema,
} from 'src/modules/company-unit/company-unit.schema';
import { Company, CompanySchema } from 'src/modules/company/company.schema';
import { Files, FilesSchema } from 'src/modules/files/files.schema';
import { News, NewsSchema } from 'src/modules/news/news.schema';
import { User, UserSchema } from 'src/modules/user/user.schema';

export const MongoCollection = {
  advertisement: { name: Advertisement.name, schema: AdvertisementSchema },
  advertisement_campaign: {
    name: AdvertisementCampaign.name,
    schema: AdvertisementCampaignSchema,
  },
  companies: { name: Company.name, schema: CompanySchema },
  company_units: { name: CompanyUnit.name, schema: CompanyUnitSchema },
  company_units_popular_times: {
    name: CompanyUnitPopularTime.name,
    schema: CompanyUnitPopularTimeSchema,
  },
  files: { name: Files.name, schema: FilesSchema },
  news: { name: News.name, schema: NewsSchema },
  users: { name: User.name, schema: UserSchema },
};

export type MongoDbDateQuery = Partial<Record<'$gte' | '$lte', Date>>;
