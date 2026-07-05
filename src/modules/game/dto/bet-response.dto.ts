import { ApiProperty } from '@nestjs/swagger';

export class BetSelectionResponseDto {
  @ApiProperty()
  number: number = 0;

  @ApiProperty()
  amount: number = 0;
}

export class BetResponseDto {
  @ApiProperty()
  id: string = '';

  @ApiProperty()
  userId: string = '';

  @ApiProperty({ required: false })
  userName?: string;

  @ApiProperty({ required: false })
  userEmail?: string;

  @ApiProperty()
  gameType: string = '';

  @ApiProperty()
  totalAmount: number = 0;

  @ApiProperty({ required: false, nullable: true })
  resultId?: string;

  @ApiProperty({ required: false, nullable: true })
  winningNumber?: number;

  @ApiProperty({ type: [BetSelectionResponseDto] })
  selections: BetSelectionResponseDto[] = [];

  @ApiProperty()
  createdDate!: Date;
}
