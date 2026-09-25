import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const RECEIPT_MAX_LEN = 2_097_152;
const RECEIPT_FORMAT_RE =
  /^(data:image\/(jpeg|jpg|png|webp|gif);base64,|https?:\/\/)/;

export class SaveExpenseDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(RECEIPT_MAX_LEN, { message: 'receiptImage must not exceed 2 MB' })
  @Matches(RECEIPT_FORMAT_RE, {
    message: 'receiptImage must be a base64 image data URI or an HTTP(S) URL',
  })
  receiptImage?: string;
}
