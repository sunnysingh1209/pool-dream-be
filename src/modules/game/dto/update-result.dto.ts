import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateResultDto {
  @ApiProperty({
    minimum: 0,
    maximum: 100,
    example: 42,
    description: '0 represents the "00" pair',
  })
  @IsInt()
  @Min(0)
  @Max(100)
  winningNumber: number = 0;
}
