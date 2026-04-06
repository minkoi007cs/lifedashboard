import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { WishTimeTag, WishType } from '../wish.entity';

export class CreateWishDto {
    @IsEnum(WishType)
    type: WishType;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(WishTimeTag)
    timeTag: WishTimeTag;
}
