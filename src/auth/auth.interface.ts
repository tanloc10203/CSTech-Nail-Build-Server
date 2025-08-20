import { UserRoles } from '@src/user/schemas/user.schema';

export interface UserJWT {
  userId: string;
  role: UserRoles;
}
