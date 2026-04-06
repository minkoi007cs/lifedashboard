import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { WishResponseStatus } from '../wish.entity';

export class RespondToWishDto {
    @IsEnum(WishResponseStatus)
    status: WishResponseStatus;

    @IsString()
    @IsOptional()
    comment?: string;

    @IsBoolean()
    @IsOptional()
    addToPlan?: boolean;
}
