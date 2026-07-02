import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ALLOWED_COIN_AMOUNTS } from '../../../common/constants/coin-amount.constant';
import { GameType } from '../../../common/enums/game-type.enum';

export class BetSelectionDto {
  @ApiProperty({ minimum: 1, maximum: 100, example: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  number: number = 0;

  @ApiProperty({ enum: ALLOWED_COIN_AMOUNTS, example: 25 })
  @IsInt()
  @IsIn(ALLOWED_COIN_AMOUNTS)
  amount: number = ALLOWED_COIN_AMOUNTS[0];
}

export class PlaceBetDto {
  @ApiProperty({ enum: GameType })
  @IsEnum(GameType)
  gameType!: GameType;

  @ApiProperty({ type: [BetSelectionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BetSelectionDto)
  selections!: BetSelectionDto[];
}
