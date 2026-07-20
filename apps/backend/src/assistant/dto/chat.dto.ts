import {
  IsArray,
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { AssistantMessage, ConfirmedAction } from '@life-dashboard/shared';

export class AssistantMessageDto implements AssistantMessage {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ConfirmedActionDto implements ConfirmedAction {
  @IsString()
  id: string;

  @IsString()
  toolName: string;

  @IsObject()
  params: Record<string, unknown>;
}

export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssistantMessageDto)
  messages: AssistantMessageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmedActionDto)
  confirmedActions?: ConfirmedActionDto[];
}
