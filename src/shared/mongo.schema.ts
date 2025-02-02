import {
  CompanyUnit,
  CompanyUnitSchema,
} from 'src/modules/company-unit/company-unit.schema';
import { Company, CompanySchema } from 'src/modules/company/company.schema';
import { User, UserSchema } from 'src/modules/user/user.schema';

export const MongoCollection = {
  companies: { name: Company.name, schema: CompanySchema },
  company_units: { name: CompanyUnit.name, schema: CompanyUnitSchema },
  users: { name: User.name, schema: UserSchema },
};

export type MongoDbDateQuery = Partial<Record<'$gte' | '$lte', Date>>;
