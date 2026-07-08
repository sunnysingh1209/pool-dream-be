import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { GameSubType } from '../../../common/enums/game-sub-type.enum';

const CLOSE_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export class GameSubTypeResponseDto {
  @ApiProperty()
  id: string = '';

  @ApiProperty({ enum: GameSubType })
  name: GameSubType = GameSubType.DELHI_BAZAR;

  @ApiProperty()
  displayName: string = '';

  @ApiProperty({ example: '14:40:00', description: 'Betting cutoff time (IST, 24h)' })
  closeTime: string = '';

  @ApiProperty()
  isActive: boolean = true;
}

export class UpdateGameSubTypeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiProperty({
    required: false,
    example: '14:40',
    description: 'Betting cutoff time (IST, 24h) as HH:mm or HH:mm:ss',
  })
  @IsOptional()
  @Matches(CLOSE_TIME_PATTERN, {
    message: 'closeTime must be in HH:mm or HH:mm:ss format',
  })
  closeTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
