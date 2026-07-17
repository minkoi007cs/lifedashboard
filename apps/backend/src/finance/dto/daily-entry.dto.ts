import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class DailyEntryExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  category?: string;
}

export class CreateDailyEntryDto {
  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  serviceSales: number;

  @IsNumber()
  @Min(0)
  cashTips: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  originalDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyEntryExpenseDto)
  expenses: DailyEntryExpenseDto[];
}
