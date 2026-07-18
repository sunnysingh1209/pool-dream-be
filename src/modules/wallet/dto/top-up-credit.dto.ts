import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
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

  @ApiProperty({
    required: false,
    example: 100.5,
    description: 'External credit reference number, updated alongside the top-up if sent',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditReference?: number;
}
