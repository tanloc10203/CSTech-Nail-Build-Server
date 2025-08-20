import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Username is required' })
  @MaxLength(50, { message: 'Username must be less than 50 characters' })
  readonly username: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(4, { message: 'Password must be at least 4 characters' })
  @MaxLength(50, { message: 'Password must be less than 50 characters' })
  readonly password: string;
}
