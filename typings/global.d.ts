import { KeyStore } from '@src/keyStore/schemas/keyStore.schema';
import { UserRoles } from '@src/user/schemas/user.schema';

export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_PORT: number;
      DB_HOST: string;
      DB_NAME: string;

      JWT_EXPIRES_IN_REFRESH: string | number;
      JWT_EXPIRES_IN_ACCESS: string | number;

      CORS_ORIGIN_STAFF: string;
      CORS_ORIGIN_ADMIN: string;
    }
  }

  namespace Express {
    interface Request {
      keyStore?: KeyStore;
      user?: UserJWT;
      refreshToken?: string;
    }
  }
}
