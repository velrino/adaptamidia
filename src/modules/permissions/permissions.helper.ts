import { HttpException, HttpStatus } from '@nestjs/common';
import { PermissionsEnum } from './permissions.enum';
import { RESULT } from 'src/shared/result.enum';
import { AuthenticatedRequest } from 'src/shared/request';
import { Types } from 'mongoose';

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

export interface IVerifyUserCanProced {
  user_permissions: PermissionsEnum[];
  user_companies: Types.ObjectId[];
  need_permissions: PermissionsEnum[];
  need_company: string;
}

export function VerifyUserCanProced(parameters: IVerifyUserCanProced) {
  try {
    let can = (parameters.user_permissions || []).includes(
      PermissionsEnum.SUDO,
    );

    if (
      parameters.user_companies?.includes(
        new Types.ObjectId(parameters.need_company),
      ) &&
      !can
    ) {
      can = true;
    }

    if (!can) {
      throw new HttpException(RESULT.USER_NOT_AUTHORIZED, HttpStatus.FORBIDDEN);
    }
  } catch (error) {
    throw new HttpException(
      error?.message || RESULT.USER_CANNOT_PROCEED,
      error?.status || HttpStatus.FORBIDDEN,
    );
  }
}
