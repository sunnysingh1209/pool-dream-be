import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id: string = "";

  @ApiProperty()
  name: string = "";

  @ApiProperty()
  email: string = "";

  @ApiProperty({ required: false })
  phoneNumber?: string;

  @ApiProperty({ type: [String] })
  roles: string[] = [];
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty()
  accessToken: string = "";

  @ApiProperty()
  refreshToken: string = "";

  @ApiProperty({ description: 'True if this is the user\'s first ever login' })
  isFirstLogin: boolean = false;
}
