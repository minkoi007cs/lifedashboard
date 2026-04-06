import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWishCommentDto {
    @IsString()
    @IsNotEmpty()
    comment: string;
}
