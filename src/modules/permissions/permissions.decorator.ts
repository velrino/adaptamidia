import { SetMetadata } from '@nestjs/common';

import { PermissionsEnum } from './permissions.enum';

export const PermissionsAllowed = (permissions: PermissionsEnum[] = []) =>
  SetMetadata('permissions', [...permissions, PermissionsEnum.SUDO]);
