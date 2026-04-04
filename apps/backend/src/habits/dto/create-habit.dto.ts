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
  frequency_type: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  frequency_days?: number[];

  @IsOptional()
  @IsNumber()
  target_count?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'reminder_time must be in HH:mm format',
  })
  reminder_time?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;
}
