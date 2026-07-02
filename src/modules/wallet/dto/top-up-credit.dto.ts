import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class TopUpCreditDto {
  @ApiProperty()
  @IsUUID()
  userId: string = '';

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  amount: number = 0;

  @ApiProperty({ required: false, example: 'Welcome bonus' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
