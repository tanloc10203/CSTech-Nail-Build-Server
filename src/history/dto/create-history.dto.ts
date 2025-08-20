import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHistoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Employee is required' })
  employee: string;

  @IsString()
  @IsOptional()
  customer: string;

  @IsNotEmpty({ message: 'Services is required' })
  service: string;

  @IsNotEmpty({ message: 'Turn is required' })
  @IsNumber()
  turn: number;
}
