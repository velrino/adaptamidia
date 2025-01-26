import { Company, CompanySchema } from 'src/modules/company/company.schema';
import { User, UserSchema } from 'src/modules/user/user.schema';

export const MongoCollection = {
  companies: { name: Company.name, schema: CompanySchema },
  users: { name: User.name, schema: UserSchema },
};
