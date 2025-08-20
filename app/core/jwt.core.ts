import * as JWT from 'jsonwebtoken';

type CreateTokenPairPayload = {
  payload: any;
  publicKey: string;
  privateKey: string;
  expiresInAccessToken?: number | string;
  expiresInRefreshToken?: number | string;
};

export const createTokenPair = async ({
  payload,
  privateKey,
  publicKey,
  expiresInAccessToken = process.env.JWT_EXPIRES_IN_ACCESS || '1d',
  expiresInRefreshToken = process.env.JWT_EXPIRES_IN_REFRESH || '7d',
}: CreateTokenPairPayload) => {
  const [refreshToken, accessToken] = await Promise.all([
    JWT.sign({ payload }, privateKey, {
      expiresIn: expiresInRefreshToken,
    }),

    JWT.sign({ payload }, publicKey, {
      expiresIn: expiresInAccessToken,
    }),
  ]);

  return { accessToken, refreshToken };
};

export const verifyToken = async <T extends Record<string, any>>(
  token: string,
  keySecret: string,
) => {
  return (await JWT.verify(token, keySecret))?.['payload'] as T;
};
