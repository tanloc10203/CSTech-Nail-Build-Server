import { Created, OK } from '@app/utils/success-response.util';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto, @Res() res: Response) {
    const response = await this.authService.signup(signupDto);

    return new Created({
      message: 'User created successfully',
      metadata: response,
    }).send(res);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const response = await this.authService.login(loginDto);

    return new OK({
      message: 'User Logging successfully',
      metadata: response,
    }).send(res);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const response = await this.authService.profile(req.user.userId);

    return new OK({
      message: 'Get current user logging successfully',
      metadata: response,
    }).send(res);
  }

  @UseGuards(AuthGuard)
  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const response = await this.authService.refreshToken(
      req.refreshToken,
      req.user,
      req.keyStore,
    );

    return new OK({
      message: 'RefreshToken successfully.',
      metadata: response,
    }).send(res);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    await this.authService.logout(req.keyStore);
    return new OK({
      message: 'Logout successfully.',
    }).send(res);
  }
}
