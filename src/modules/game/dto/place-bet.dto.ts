import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { GameSubType } from '../../../common/enums/game-sub-type.enum';
import { GameType } from '../../../common/enums/game-type.enum';

export class BetSelectionDto {
  @ApiProperty({ minimum: 1, maximum: 100, example: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  number: number = 0;

  @ApiProperty({ minimum: 1, maximum: 1_000_000, example: 25 })
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  amount: number = 1;
}

export class PlaceBetDto {
  @ApiProperty({ enum: GameType })
  @IsEnum(GameType)
  gameType!: GameType;

  @ApiProperty({ enum: GameSubType })
  @IsEnum(GameSubType)
  gameSubType!: GameSubType;

  @ApiProperty({ type: [BetSelectionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BetSelectionDto)
  selections!: BetSelectionDto[];
}
