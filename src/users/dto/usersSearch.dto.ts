import { IsEmail } from "class-validator";

export class UsersSearchDto {
  @IsEmail()
  email?: string;
}