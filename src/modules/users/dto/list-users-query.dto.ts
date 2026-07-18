import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or email (partial match), minimum 4 characters' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(255)
  search?: string;
}
