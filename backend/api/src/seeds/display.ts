import 'reflect-metadata';
import { createConnection, Types } from 'mongoose';
import {
  AdvertisementStatus,
  AdvertisementType,
} from 'src/modules/advertisement/advertisement.interface';
import {
  Advertisement,
  AdvertisementSchema,
} from 'src/modules/advertisement/advertisement.schema';
import AuthHelper from 'src/modules/auth/auth.helper';
import { CompanyUnitDeviceType } from 'src/modules/company-unit-devices/company-unit.interface';
import {
  CompanyUnitDevices,
  CompanyUnitDevicesSchema,
} from 'src/modules/company-unit-devices/company-unit-devices.schema';
import {
  COMPANY_UNIT_DEFAULT_PREFERENCES,
  CompanyUnitStatus,
  CompanyUnitType,
} from 'src/modules/company-unit/company-unit.interface';
import {
  CompanyUnit,
  CompanyUnitSchema,
} from 'src/modules/company-unit/company-unit.schema';
import { CompanyUnitPopularTimeDataDefault } from 'src/modules/company-unit/popular-times/company-unit-popular-times.interface';
import {
  CompanyUnitPopularTime,
  CompanyUnitPopularTimeSchema,
} from 'src/modules/company-unit/popular-times/company-unit-popular-times.schema';
import {
  CompanyDocumentType,
  CompanyType,
} from 'src/modules/company/company.interface';
import { Company, CompanySchema } from 'src/modules/company/company.schema';
import { DisplayLogStatus } from 'src/modules/display-logs/display-logs.interface';
import {
  DisplayLog,
  DisplayLogSchema,
} from 'src/modules/display-logs/display-logs.schema';
import { DisplayType } from 'src/modules/display/unit/unit.interface';
import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';
import { User, UserSchema } from 'src/modules/user/user.schema';

const displayLogId = new Types.ObjectId('000000000000000000ad0001');
const companyId = new Types.ObjectId('000000000000000000ad0002');
const unitId = new Types.ObjectId('000000000000000000ad0003');
const displayId = new Types.ObjectId('000000000000000000ad0004');
const adId = new Types.ObjectId('000000000000000000ad0005');
const adminId = new Types.ObjectId('000000000000000000ad0006');
const popularTimeId = new Types.ObjectId('000000000000000000ad0007');
const displayIdentifier = 'DEMO-DISPLAY-01';

async function seedDisplay() {
  const uri = process.env.MONGO_URI;
  if (
    process.env.APP_ENV !== 'development' ||
    !uri ||
    !/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/adaptamidia_local$/.test(uri)
  ) {
    throw new Error(
      'O seed requer o banco local adaptamidia_local em modo development.',
    );
  }

  const connection = createConnection(uri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await connection.asPromise();
    const companies = connection.model(Company.name, CompanySchema);
    const units = connection.model(CompanyUnit.name, CompanyUnitSchema);
    const popularTimes = connection.model(
      CompanyUnitPopularTime.name,
      CompanyUnitPopularTimeSchema,
    );
    const devices = connection.model(
      CompanyUnitDevices.name,
      CompanyUnitDevicesSchema,
    );
    const ads = connection.model(Advertisement.name, AdvertisementSchema);
    const logs = connection.model(DisplayLog.name, DisplayLogSchema);
    const users = connection.model(User.name, UserSchema);
    const upsert = { upsert: true, runValidators: true };

    await companies.updateOne(
      { _id: companyId },
      {
        $setOnInsert: {
          name: 'AdaptaMídia Demo',
          document: '00000000000000',
          document_type: CompanyDocumentType.CNPJ,
          type: CompanyType.LOCAL,
          status: CompanyUnitStatus.ACTIVE,
        },
      },
      upsert,
    );

    await units.updateOne(
      { _id: unitId },
      {
        $setOnInsert: {
          company: companyId,
          name: 'Unidade Demo',
          identifier: 'DEMOAA',
          full_address: 'Rua de Teste, 100, São Paulo - SP',
          address: 'Rua de Teste',
          street_number: '100',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR',
          type: CompanyUnitType.CAFE,
          status: CompanyUnitStatus.ACTIVE,
          devices: { smart_tv: 1 },
          max_capacity: 30,
          location: { type: 'Point', coordinates: [-46.6333, -23.5505] },
          preferences: COMPANY_UNIT_DEFAULT_PREFERENCES,
        },
      },
      upsert,
    );

    const unit = await units.findById(unitId).select('popular_time').lean();
    if (!unit?.popular_time) {
      await popularTimes.updateOne(
        { _id: popularTimeId },
        {
          $setOnInsert: {
            company_unit: unitId,
            days: CompanyUnitPopularTimeDataDefault,
          },
        },
        upsert,
      );
      await units.updateOne(
        { _id: unitId, popular_time: null },
        { $set: { popular_time: popularTimeId } },
      );
    }

    await devices.updateOne(
      { _id: displayId },
      {
        $setOnInsert: {
          local_unit: unitId,
          identifier: displayIdentifier,
          type: CompanyUnitDeviceType.DISPLAYER,
        },
      },
      upsert,
    );

    const now = new Date();
    const seconds = 8;
    const dayMs = 24 * 60 * 60 * 1000;
    await ads.updateOne(
      { _id: adId },
      {
        $setOnInsert: {
          company: companyId,
          units: [unitId],
          title: 'Anúncio Demo',
          description: 'Vídeo de exemplo para o display local.',
          type: AdvertisementType.VIDEO,
          status: AdvertisementStatus.ACTIVE,
          source_landscape: 'http://127.0.0.1:4001/videos/demo/0.mp4',
          seconds,
        },
        $set: {
          start_date: new Date(now.getTime() - dayMs),
          end_date: new Date(now.getTime() + 7 * dayMs),
        },
      },
      upsert,
    );

    await logs.updateOne(
      { _id: displayLogId },
      {
        $set: {
          advertisement: adId,
          advertiser: companyId,
          local: companyId,
          local_unit: unitId,
          identifier: displayIdentifier,
          device: displayIdentifier,
          orientation: 'landscape',
          type: DisplayType.ADVERTISEMENT,
          status: DisplayLogStatus.FINISHED,
          start_at: new Date(now.getTime() - seconds * 1000),
          end_at: now,
          seconds,
          yolo: { people: 3, confidence: 0.9, min: 2, max: 3 },
        },
        $setOnInsert: { data: { source: 'local-seed' } },
      },
      upsert,
    );

    const email = process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.LOCAL_ADMIN_PASSWORD;
    if (
      email?.endsWith('.test') &&
      password &&
      !(await users.exists({ email }))
    ) {
      await users.updateOne(
        { _id: adminId },
        {
          $setOnInsert: {
            email,
            password: await AuthHelper.hashPassword(password),
            permissions: [PermissionsEnum.SUDO],
          },
        },
        upsert,
      );
    }

    console.log(`Display ${displayIdentifier} pronto na Unidade Demo.`);
  } finally {
    await connection.close();
  }
}

seedDisplay().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
