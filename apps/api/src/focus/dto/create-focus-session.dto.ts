import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateFocusSessionDto {
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsString()
  @IsOptional()
  label?: string;
}
