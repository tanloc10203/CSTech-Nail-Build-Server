import { PartialType } from '@nestjs/mapped-types';
import { CreateHistoryDto } from './create-history.dto';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateHistoryDto extends PartialType(CreateHistoryDto) {
  @IsString()
  @IsNotEmpty({ message: 'History id is required' })
  historyId: string;

  @IsNumber()
  oldTurn: number;

  @IsString()
  @IsNotEmpty({ message: 'Activity id is required' })
  activityId: string;
}
