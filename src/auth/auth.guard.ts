import { HeadersConstants } from '@app/constants/header.constant';
import { verifyToken } from '@app/core/jwt.core';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { KeyStoreService } from '@src/keyStore/keyStore.service';
import { UserRoles } from '@src/user/schemas/user.schema';
import { Request } from 'express';
import { UserJWT } from './auth.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly keyStoreService: KeyStoreService) {}

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

    // 3. Check refresh token
    if (request.headers[HeadersConstants.RefreshToken]) {
      try {
        const refreshToken =
          request.headers[HeadersConstants.RefreshToken].toString();

        const decode = await verifyToken<{ userId: string; role: UserRoles }>(
          refreshToken,
          keyStore.privateKey,
        );

        if (userId !== decode.userId)
          throw new UnauthorizedException({
            message: 'Invalid refresh token!',
            code: 9999,
          });

        request['keyStore'] = keyStore;
        request['user'] = decode;
        request['refreshToken'] = refreshToken;

        return true;
      } catch (error) {
        if (error.message === 'jwt expired') {
          await keyStore.deleteOne();

          throw new UnauthorizedException({
            message: error.message,
            code: 9999,
          });
        }

        throw new UnauthorizedException({
          message: error.message,
          code: 9999,
        });
      }
    }

    // 4. Check access token
    const accessToken = this.extractTokenFromHeader(request);
    if (!accessToken) {
      throw new UnauthorizedException({
        message: 'Missing token!',
        code: 4444,
      });
    }

    try {
      const decode = await verifyToken<UserJWT>(
        accessToken,
        keyStore.publicKey,
      );

      if (userId !== decode.userId)
        throw new UnauthorizedException({
          message: 'Invalid refresh token!',
          code: 9999,
        });

      request['keyStore'] = keyStore;
      request['user'] = decode;

      return true;
    } catch (error) {
      if (error.message === 'jwt expired') {
        throw new UnauthorizedException(error.message);
      }

      throw new UnauthorizedException({
        message: error.message,
        code: 9999,
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] =
      request.headers[HeadersConstants.Authorization]?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
