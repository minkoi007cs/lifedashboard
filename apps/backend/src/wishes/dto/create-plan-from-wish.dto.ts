import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class CreatePlanFromWishDto {
    @IsDate()
    @Type(() => Date)
    startDate: Date;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    endDate?: Date;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
