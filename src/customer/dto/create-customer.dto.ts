import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'First name is required' })
  readonly firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  readonly lastName: string;

  @IsOptional()
  phone: string;

  @IsOptional()
  email: string;

  @IsOptional()
  address: string;

  @IsOptional()
  dob: string;
}
