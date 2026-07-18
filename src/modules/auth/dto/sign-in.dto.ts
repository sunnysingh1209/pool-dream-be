import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Registered email address or username',
  })
  @IsString()
  @IsNotEmpty()
  email: string = "";

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  password: string = "";
}
