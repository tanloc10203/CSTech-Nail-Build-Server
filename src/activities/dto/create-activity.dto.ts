import { IsNotEmpty } from 'class-validator';

export class CreateActivityDto {
  @IsNotEmpty({ message: 'User is required' })
  user: string;
}
