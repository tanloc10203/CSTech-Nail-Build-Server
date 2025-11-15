import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty({ message: 'Name is required' })
  readonly name: string;

  @IsOptional()
  readonly description?: string;

  @IsOptional()
  readonly initTurn?: number;

  // @IsNotEmpty({ message: 'Order is required' })
  // @IsNumber({}, { message: 'Order must be a number' })
  // readonly order: number;
}
