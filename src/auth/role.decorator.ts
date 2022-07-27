import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

export const ALLOWED_ROLES = 'allowedRole';

export type AllowedRoles = keyof typeof UserRole | 'Any';

export const Role = (roles: AllowedRoles[]) =>
  SetMetadata(ALLOWED_ROLES, roles);
