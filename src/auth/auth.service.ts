import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@src/user/user.service';
import { getInfo, unSelect } from '@app/utils/object';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { UserRoles, UserStatus } from '@src/user/schemas/user.schema';
import CryptoCore from '@app/core/crypto.core';
import { createTokenPair } from '@app/core/jwt.core';
import { KeyStoreService } from '@src/keyStore/keyStore.service';
import { UserJWT } from './auth.interface';
import { KeyStore } from '@src/keyStore/schemas/keyStore.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private keyStoreService: KeyStoreService,
  ) {}

  async signup(signupDto: SignupDto) {
    const user = await this.userService.create(signupDto);
    return getInfo(user, ['_id', 'firstName', 'lastName', 'username']);
  }

  async login(loginDto: LoginDto) {
    // 1. Check username
    const foundUser = await this.userService.findByUsername(loginDto.username);

    if (!foundUser) {
      throw new UnauthorizedException('Username not found!');
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      foundUser.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Password not valid!');
    }

    // 3. Check status
    if (foundUser.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not active!');
    }

    if (foundUser.role !== UserRoles.ADMIN) {
      throw new UnauthorizedException('Permission denied!');
    }

    // 4. Generate public and private key
    const privateKey = CryptoCore.generateKey();
    const publicKey = CryptoCore.generateKey();

    // 5. Generate token pair
    const tokens = await createTokenPair({
      payload: {
        userId: foundUser._id.toString(),
        role: foundUser.role,
      },
      privateKey,
      publicKey,
    });

    // 6. Create token in db
    await this.keyStoreService.createKeyToken({
      privateKey,
      publicKey,
      refreshToken: tokens.refreshToken,
      userId: foundUser._id.toString(),
    });

    return {
      user: getInfo(foundUser, [
        '_id',
        'firstName',
        'lastName',
        'username',
        'role',
      ]),
      tokens,
    };
  }

  async profile(userId: string) {
    const user = await this.userService.findById(userId);
    return unSelect(user, ['password', 'id', 'salt']);
  }

  async refreshToken(refreshToken: string, user: UserJWT, keyStore: KeyStore) {
    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      // Xóa tất cả token trong keyStore
      await this.keyStoreService.deleteKeyByUserId(user.userId);
      throw new ForbiddenException({
        message: `Something wrong happened !! Please re login`,
        code: 5555,
      });
    }

    // If refreshToken in db !=  refreshToken of user
    if (keyStore.refreshToken !== refreshToken)
      throw new ForbiddenException({
        message: `Invalid refreshToken!`,
        code: 9999,
      });

    // create new tokens
    const tokens = await createTokenPair({
      payload: user,
      privateKey: keyStore.privateKey,
      publicKey: keyStore.publicKey,
    });

    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, // đã được sử dụng để lấy token mới
      },
    });

    return tokens;
  }

  async logout(keyStore: KeyStore) {
    const delKey = await keyStore.deleteOne();
    return delKey;
  }
}
