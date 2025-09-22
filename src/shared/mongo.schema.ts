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
import {
  DisplayLog,
  DisplayLogSchema,
} from 'src/modules/display-logs/display-logs.schema';
import {
  AdvertisementMetrics,
  AdvertisementMetricsSchema,
} from 'src/modules/advertisement-metrics/advertisement-metrics.schema';
import { Weather, WeatherSchema } from 'src/modules/weather/weather.schema';
import { Currency, CurrencySchema } from 'src/modules/currency/currency.schema';
import {
  DashboardDisplayLogsAggregation,
  DashboardDisplayLogsAggregationSchema,
} from 'src/modules/dashboard-display-logs/dashboard-display-logs.schema';
import {
  CompanyUnitDevices,
  CompanyUnitDevicesSchema,
} from 'src/modules/company-unit-devices/company-unit-devices.schema';

export const MongoCollection = {
  advertisement: { name: Advertisement.name, schema: AdvertisementSchema },
  advertisement_metrics: {
    name: AdvertisementMetrics.name,
    schema: AdvertisementMetricsSchema,
  },
  companies: { name: Company.name, schema: CompanySchema },
  company_units: { name: CompanyUnit.name, schema: CompanyUnitSchema },
  company_unit_devices: {
    name: CompanyUnitDevices.name,
    schema: CompanyUnitDevicesSchema,
  },
  company_units_popular_times: {
    name: CompanyUnitPopularTime.name,
    schema: CompanyUnitPopularTimeSchema,
  },
  currency: { name: Currency.name, schema: CurrencySchema },
  dashboard_display_logs_aggregations: {
    name: DashboardDisplayLogsAggregation.name,
    schema: DashboardDisplayLogsAggregationSchema,
  },
  display_logs: { name: DisplayLog.name, schema: DisplayLogSchema },
  files: { name: Files.name, schema: FilesSchema },
  news: { name: News.name, schema: NewsSchema },
  users: { name: User.name, schema: UserSchema },
  weather: { name: Weather.name, schema: WeatherSchema },
};

export type MongoDbDateQuery = Partial<Record<'$gte' | '$lte', Date>>;
