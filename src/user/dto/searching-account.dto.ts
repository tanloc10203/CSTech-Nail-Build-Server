import { IsNotEmpty } from 'class-validator';

export class SearchingAccountDto {
  @IsNotEmpty({ message: 'Value is required' })
  value: string;
}
