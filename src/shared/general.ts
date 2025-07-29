import { join, resolve } from 'path';
import { readdirSync, statSync, existsSync } from 'fs';
import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';
import { AuthenticatedRequest } from './request';
import { Types } from 'mongoose';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RESULT } from './result.enum';
import { DateTime } from 'luxon';

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
export function GetUserCompany(currentRequest: AuthenticatedRequest): {
  company: Types.ObjectId | null;
  sudo: boolean;
} {
  const { companies, permissions } = currentRequest.user.user;

  const sudo: boolean = permissions.includes(PermissionsEnum.SUDO);

  // If the user does not have SUDO permissions, return the first company ID.
  if (!permissions.includes(PermissionsEnum.SUDO)) {
    return { company: companies[0] || null, sudo };
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

    return { company: new Types.ObjectId(companyId), sudo };
  }

  // If no company_id is provided and the user has SUDO permissions, return null.
  return { company: null, sudo: true };
}

export function NormalizeToArray(value: any): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value;
  return [];
}

export const ShuffleArray = (array = []) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export function CalculateTimeDifferenceInSeconds(
  startAt: DateTime,
  endAt: DateTime,
) {
  const differenceInSeconds = endAt.diff(startAt, 'seconds').as('seconds');

  return isNaN(differenceInSeconds) ? 0 : differenceInSeconds;
}

export function Milliseconds({
  minutes = 0,
  seconds = 0,
  hours = 0,
}: {
  minutes?: number;
  seconds?: number;
  hours?: number;
}): number {
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

export function RemoveAccents(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function CalculateTimeBetweenDates(start: DateTime, end: DateTime) {
  const diff = end.diff(start, [
    'years',
    'months',
    'days',
    'hours',
    'minutes',
    'seconds',
  ]);

  return {
    start,
    end,
    years: Math.floor(diff.years),
    months: Math.floor(diff.months),
    days: Math.floor(diff.days),
    hours: Math.floor(diff.hours),
    minutes: Math.floor(diff.minutes),
    seconds: Math.floor(diff.seconds),
  };
}

export function FindFileInDirs(
  dirs: string[],
  fileName: string,
): string | null {
  for (const dir of dirs) {
    const basePath = resolve(process.cwd(), dir);
    if (!existsSync(basePath)) continue;

    const foundPath = FindFileRecursively(basePath, fileName);
    if (foundPath) return foundPath;
  }

  return null;
}

export function FindFileRecursively(
  basePath: string,
  fileName: string,
): string | null {
  const entries = readdirSync(basePath);

  for (const entry of entries) {
    const fullPath = join(basePath, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      const result = FindFileRecursively(fullPath, fileName);
      if (result) return result;
    } else if (entry === fileName) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Tenta converter um valor para ObjectId. Lança HttpException se inválido.
 * @param value Valor a ser convertido
 * @param fieldName Nome do campo para mensagem de erro (opcional)
 * @returns Types.ObjectId
 */
export function ConvertToObjectId(
  value: string,
  fieldName = 'id',
): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpException(
      `${fieldName} deve ser um ObjectId válido do MongoDB`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return new Types.ObjectId(value);
}
