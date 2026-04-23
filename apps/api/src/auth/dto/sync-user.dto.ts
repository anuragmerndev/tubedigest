import { IsEmail } from 'class-validator';

export class SyncUserDto {
  @IsEmail()
  email: string;
}
