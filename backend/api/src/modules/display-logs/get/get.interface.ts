import { News } from 'src/modules/news/news.schema';
import { DisplayLogDocument } from '../display-logs.schema';
import { Advertisement } from 'src/modules/advertisement/advertisement.schema';
import { CompanyUnit } from 'src/modules/company-unit/company-unit.schema';

export interface IPopulatedDisplayLog
  extends Omit<DisplayLogDocument, 'news' | 'advertisement' | 'local_unit'> {
  news?: Pick<
    News,
    '_id' | 'description' | 'title' | 'source_name' | 'author'
  > & {
    _id: string;
  };
  advertisement?: Pick<Advertisement, 'description' | 'title'> & {
    _id: string;
  };
  local_unit: Pick<CompanyUnit, 'full_address' | 'type' | 'name'> & {
    _id: string;
  };
}
