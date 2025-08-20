import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'First name is required' })
  readonly firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  readonly lastName: string;

  @IsOptional()
  @IsString()
  readonly username?: string;

  @IsOptional()
  @IsString()
  readonly password?: string;

  @IsOptional()
  readonly userSkills?: string[];

  @IsOptional()
  @IsString()
  readonly address?: string;
}
