import { IsEmail, IsIn } from 'class-validator';

export class InviteShareDto {
  @IsEmail()
  email: string;

  @IsIn(['view', 'edit'])
  permission: 'view' | 'edit';
}
