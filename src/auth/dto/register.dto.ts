import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ale@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MiPassword123!', minLength: 8 })
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Alexis' })
  @IsString()
  name: string;
}
