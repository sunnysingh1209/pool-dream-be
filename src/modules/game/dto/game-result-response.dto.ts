import { ApiProperty } from '@nestjs/swagger';

export class ResultWinnerDto {
  @ApiProperty()
  userId: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  email: string = '';

  @ApiProperty()
  winningAmount: number = 0;

  @ApiProperty({ type: [String] })
  betIds: string[] = [];
}

export class GameResultResponseDto {
  @ApiProperty()
  id: string = '';

  @ApiProperty()
  gameType: string = '';

  @ApiProperty()
  winningNumber: number = 0;

  @ApiProperty()
  declaredBy: string = '';

  @ApiProperty()
  declaredAt!: Date;

  @ApiProperty()
  settledBetCount: number = 0;

  @ApiProperty()
  winnerCount: number = 0;

  @ApiProperty({ type: [ResultWinnerDto] })
  winners: ResultWinnerDto[] = [];
}

export class GameResultSummaryDto {
  @ApiProperty()
  id: string = '';

  @ApiProperty()
  gameType: string = '';

  @ApiProperty()
  winningNumber: number = 0;

  @ApiProperty()
  declaredBy: string = '';

  @ApiProperty()
  declaredAt!: Date;

  @ApiProperty()
  settledBetCount: number = 0;

  @ApiProperty()
  winnerCount: number = 0;

  @ApiProperty({ type: [ResultWinnerDto] })
  winners: ResultWinnerDto[] = [];
}
