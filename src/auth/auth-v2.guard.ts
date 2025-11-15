import { HeadersConstants } from '@app/constants/header.constant';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { KeyStoreService } from '@src/keyStore/keyStore.service';
import { UserRoles } from '@src/user/schemas/user.schema';
import { Request } from 'express';

@Injectable()
export class AuthV2Guard implements CanActivate {
  constructor(private readonly keyStoreService: KeyStoreService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Check X-Client-Id
    const userId = request.headers[HeadersConstants.XClientId]?.toString();
    if (!userId)
      throw new UnauthorizedException({
        message: `Missing X-Client-Id!`,
        code: 4444,
      });

    // 2. Found key store
    const keyStore = await this.keyStoreService.findByUserId(userId);
    if (!keyStore)
      throw new UnauthorizedException({
        message: `Not found Key Store!`,
        code: 8888,
      });

    // 3. Set user
    request['user'] = {
      userId,
      role: UserRoles.ADMIN,
    };

    // Check if exist headers logout
    if (request.headers[HeadersConstants.Logout]?.toString()) {
      const logoutClientId =
        request.headers[HeadersConstants.Logout]?.toString();

      if (logoutClientId !== userId) {
        throw new UnauthorizedException({
          message: 'Invalid logout client id!',
          code: 9999,
        });
      }

      request['keyStore'] = keyStore;
      return true;
    }

    request['keyStore'] = keyStore;
    return true;
  }
}
