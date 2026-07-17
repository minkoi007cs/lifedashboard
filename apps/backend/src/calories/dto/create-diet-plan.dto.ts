import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateDietPlanDto {
  @IsNumber()
  @Min(0)
  targetCalories: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  proteinRatio?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  fatRatio?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  carbsRatio?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
