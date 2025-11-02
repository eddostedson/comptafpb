import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class CreatePasswordResetRequestDto {
  @ApiProperty({ example: 'chef@centre.cg', description: 'Email du chef de centre' })
  @IsEmail()
  email: string;
}

