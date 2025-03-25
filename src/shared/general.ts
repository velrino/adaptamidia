import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';
import { AuthenticatedRequest } from './request';
import { Types } from 'mongoose';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RESULT } from './result.enum';

/**
 * Validates if a given string is a valid MongoDB ObjectId.
 * @param id - The string to validate.
 * @returns {boolean} - True if the string is a valid ObjectId, otherwise false.
 */
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id;
}

/**
 * Retrieves the user's company ID based on permissions and request body.
 * @param currentRequest - The authenticated request object.
 */
export function GetUserCompany(currentRequest: AuthenticatedRequest) {
  const { companies, permissions } = currentRequest.user.user;

  const sudo: boolean = permissions.includes(PermissionsEnum.SUDO);

  // If the user does not have SUDO permissions, return the first company ID.
  if (!permissions.includes(PermissionsEnum.SUDO)) {
    return { comapny: companies[0] || null, sudo };
  }

  // If the user has SUDO permissions and a company_id is provided in the request body.
  if (currentRequest.body?.company_id) {
    const companyId = currentRequest.body.company_id;

    // Validate the company_id as a MongoDB ObjectId.
    if (!isValidObjectId(companyId)) {
      throw new HttpException(
        RESULT.INVALID_COMPANY_ID,
        HttpStatus.BAD_REQUEST,
      );
    }

    return companyId;
  }

  // If no company_id is provided and the user has SUDO permissions, return null.
  return null;
}
