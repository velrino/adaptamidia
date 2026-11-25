import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsEnum } from './permissions.enum';
import { hasPermission } from './permissions.helper';
import { Authenticated } from '../auth/auth.interface';
import { Request } from 'express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly _reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this._reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!roles) {
      return true;
    }

    const request: any = context.switchToHttp().getRequest();

    const data: Authenticated = request.user;

    return hasPermission(data.user?.permissions || [], [
      ...new Set(roles),
    ] as PermissionsEnum[]);
  }
}
