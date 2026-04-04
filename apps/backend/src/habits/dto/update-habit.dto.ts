import { PartialType } from '@nestjs/mapped-types';
import { CreateHabitDto } from './create-habit.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateHabitDto extends PartialType(CreateHabitDto) {
  @IsOptional()
  @IsBoolean()
  is_archived?: boolean;
}
