import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty()
  userId: string = '';

  @ApiProperty()
  balance: number = 0;

  @ApiProperty({ required: false, nullable: true, example: 100.5 })
  creditReference?: number | null;

  @ApiProperty({ required: false, nullable: true })
  lastCreditRefUpdate?: Date | null;
}

export class CreditTransactionResponseDto {
  @ApiProperty()
  id: string = '';

  @ApiProperty()
  userId: string = '';

  @ApiProperty()
  type: string = '';

  @ApiProperty()
  amount: number = 0;

  @ApiProperty()
  balanceAfter: number = 0;

  @ApiProperty({ required: false })
  referenceId?: string;

  @ApiProperty({ required: false })
  remarks?: string;

  @ApiProperty()
  createdDate!: Date;
}
