import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreateHabitDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['daily', 'weekly'])
  frequencyType: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  frequencyDays?: number[];

  @IsOptional()
  @IsNumber()
  targetCount?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'reminderTime must be in HH:mm format',
  })
  reminderTime?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
