import { HttpException, HttpStatus } from '@nestjs/common';
import { PermissionsEnum } from './permissions.enum';
import { RESULT } from 'src/shared/result.enum';

export function hidePermissions(
  hidePermissionsInformed: PermissionsEnum[] = [PermissionsEnum.SUDO],
) {
  return Object.values(PermissionsEnum).filter(
    (item: PermissionsEnum) => !hidePermissionsInformed.includes(item),
  );
}
export function checkPermissions(
  requiredPermissions: PermissionsEnum[],
  userPermissions: PermissionsEnum[],
) {
  requiredPermissions.push(PermissionsEnum.SUDO);

  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );
}

export function checkUserIsAdmin(userPermissions: PermissionsEnum[]) {
  return userPermissions.includes(PermissionsEnum.SUDO);
}

export function hasPermission(
  userPermissions: PermissionsEnum[],
  requiredPermissions: PermissionsEnum[] = [],
) {
  if (!checkPermissions(requiredPermissions, userPermissions)) {
    throw new HttpException(
      RESULT.USER_DOES_NOT_HAVE_PERMISSION,
      HttpStatus.FORBIDDEN,
    );
  }

  return true;
}
