import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CreditTransactionType } from '../../../common/enums/credit-transaction-type.enum';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class TransactionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by user name or email (partial match), minimum 4 characters' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: CreditTransactionType })
  @IsOptional()
  @IsEnum(CreditTransactionType)
  type?: CreditTransactionType;

  @ApiPropertyOptional({ example: '2026-07-01', description: 'Filter from this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-07-18', description: 'Filter up to this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
