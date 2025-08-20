import { IsNotEmpty, IsString } from 'class-validator';

export class DoneHistoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Employee is required' })
  employee: string;

  @IsString()
  @IsNotEmpty({ message: 'History id is required' })
  historyId: string;
}
