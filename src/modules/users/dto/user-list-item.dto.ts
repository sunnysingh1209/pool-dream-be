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
  creditBalance: number = 0;

  @ApiProperty({ required: false, nullable: true, example: 100.5 })
  creditReference?: number | null;

  @ApiProperty({ required: false, nullable: true })
  lastCreditRefUpdate?: Date | null;

  @ApiProperty()
  createdDate!: Date;
}
