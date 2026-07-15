import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { GameSubType } from '../../../common/enums/game-sub-type.enum';
import { GameType } from '../../../common/enums/game-type.enum';

export class DeclareResultDto {
  @ApiProperty({ enum: GameType })
  @IsEnum(GameType)
  gameType!: GameType;

  @ApiProperty({ enum: GameSubType })
  @IsEnum(GameSubType)
  gameSubType!: GameSubType;

  @ApiProperty({
    minimum: 0,
    maximum: 100,
    example: 42,
    description: '0 represents the "00" pair',
  })
  @IsInt()
  @Min(0)
  @Max(100)
  winningNumber: number = 0;
}
