import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AnderBaharPosition } from '../../../common/enums/ander-bahar-position.enum';
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

export class AnderBaharSelectionDto {
  @ApiProperty({ minimum: 0, maximum: 9, example: 0, description: 'Digit 0-9' })
  @IsInt()
  @Min(0)
  @Max(9)
  digit: number = 0;

  @ApiProperty({ enum: AnderBaharPosition })
  @IsEnum(AnderBaharPosition)
  position!: AnderBaharPosition;

  @ApiProperty({
    minimum: 10,
    maximum: 1_000_000,
    example: 10,
    description:
      'Total stake for this digit/position group, split evenly across its 10 numbers. Must be a multiple of 10.',
  })
  @IsInt()
  @Min(10)
  @Max(1_000_000)
  amount: number = 10;
}

export class PlaceBetDto {
  @ApiProperty({ enum: GameType })
  @IsEnum(GameType)
  gameType!: GameType;

  @ApiProperty({ enum: GameSubType })
  @IsEnum(GameSubType)
  gameSubType!: GameSubType;

  @ApiProperty({
    type: [BetSelectionDto],
    required: false,
    description: 'Individually picked numbers. Provide this and/or anderBaharSelections.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BetSelectionDto)
  selections?: BetSelectionDto[];

  @ApiProperty({
    type: [AnderBaharSelectionDto],
    required: false,
    description:
      'Ander/Bahar quick-pick groups (Jodi only). Provide this and/or selections.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AnderBaharSelectionDto)
  anderBaharSelections?: AnderBaharSelectionDto[];
}
