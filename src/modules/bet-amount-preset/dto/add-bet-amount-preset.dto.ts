import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AddBetAmountPresetDto {
  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  amount: number = 0;
}
