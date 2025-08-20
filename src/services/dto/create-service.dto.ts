import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty({ message: 'Name is required' })
  readonly name: string;

  @IsOptional()
  readonly description?: string;

  @IsOptional()
  readonly initTurn?: number;
}
