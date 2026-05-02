import { IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../../../database/entities';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}
