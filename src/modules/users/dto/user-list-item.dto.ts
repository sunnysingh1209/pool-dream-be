import { ApiProperty } from '@nestjs/swagger';

export class UserListItemDto {
  @ApiProperty()
  id: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  email: string = '';

  @ApiProperty({ required: false })
  phoneNumber?: string;

  @ApiProperty()
  isActive: boolean = true;

  @ApiProperty()
  isLocked: boolean = false;

  @ApiProperty({ type: [String] })
  roles: string[] = [];

  @ApiProperty()
  createdDate!: Date;
}
