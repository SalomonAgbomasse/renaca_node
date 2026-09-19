import { SetMetadata } from '@nestjs/common';
import { ContractPermission } from '../enum/contract-permission.enum';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: ContractPermission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
