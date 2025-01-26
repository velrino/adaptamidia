import { Global, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AuthModule } from 'src/modules/auth/auth.module';

import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';

@Global()
@Module({
  imports: [AuthModule, MongooseModule.forFeature([MongoCollection.users])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
