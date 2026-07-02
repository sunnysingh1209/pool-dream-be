import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { GameType } from '../../../common/enums/game-type.enum';

export class DeclareResultDto {
  @ApiProperty({ enum: GameType })
  @IsEnum(GameType)
  gameType!: GameType;

  @ApiProperty({ minimum: 1, maximum: 100, example: 42 })
  @IsInt()
  @Min(1)
  @Max(100)
  winningNumber: number = 0;
}
