import { ApiProperty } from '@nestjs/swagger';
import { AnderBaharPosition } from '../../../common/enums/ander-bahar-position.enum';

export class BetSelectionResponseDto {
  @ApiProperty()
  number: number = 0;

  @ApiProperty()
  amount: number = 0;

  @ApiProperty({ description: 'True if this row came from an Ander/Bahar (Haruf) pick' })
  isHaruf: boolean = false;

  @ApiProperty({ required: false, nullable: true, minimum: 0, maximum: 9 })
  anderBaharDigit?: number;

  @ApiProperty({ required: false, nullable: true, enum: AnderBaharPosition })
  anderBaharPosition?: AnderBaharPosition;
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
  gameSubType: string = '';

  @ApiProperty({ required: false })
  gameSubTypeName?: string;

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
