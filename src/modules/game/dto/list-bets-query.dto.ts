import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { GameSubType } from '../../../common/enums/game-sub-type.enum';

export class ListBetsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Search by user name or email (partial match), minimum 4 characters. Superadmin-only; ignored for other roles.',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: GameSubType, example: GameSubType.DELHI_BAZAR })
  @IsOptional()
  @IsEnum(GameSubType)
  gameSubType?: GameSubType;

  @ApiPropertyOptional({ example: '2026-07-01', description: 'Filter from this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-07-18', description: 'Filter up to this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
