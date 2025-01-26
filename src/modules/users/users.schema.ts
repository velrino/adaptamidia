import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import AuthHelper from '../auth/auth.helper';
import { PermissionsEnum } from '../permissions/permissions.enum';
import { AuthenticationTypeEnum } from '../auth/auth.interface';
import { UserOTPEnum } from './user.interface';

@Schema({ ...SchemaDefault, collection: 'users' })
export class User {
  @Prop({ required: true, index: true, lowercase: true })
  email: string;

  @Prop({ required: false })
  password: string;

  @Prop({ required: false })
  permissions: PermissionsEnum[];

  @Prop({
    required: true,
    default: AuthenticationTypeEnum.DEFAULT,
    index: true,
  })
  auth_type: AuthenticationTypeEnum;

  //   @Prop({ required: false, default: null })
  //   authCode: string;

  //   @Prop({ required: false, default: null })
  //   authCodeExpiresAt: Date;

  @Prop({ required: true, default: UserOTPEnum.INACTIVE })
  otp: UserOTPEnum;

  @Prop({ required: false })
  otp_secret?: string;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);

/*
 * Classificando a ordem de prioridade dos indexes
 */
UserSchema.index({ email: 1, type: 1 });

/*
 * Hook antes de salvar/atualizar user
 */
UserSchema.pre('save', async function (next) {
  const user = this as UserDocument;

  // Verifique se a senha foi modificada ou se é uma nova
  if (user.isModified('password') || user.isNew) {
    if (user.password) {
      user.password = await AuthHelper.hashPassword(user.password);
    }
  }

  next();
});
