import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class LogFoodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  calories?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  protein?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fat?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  carbs?: number;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  mealType?: string;
}
