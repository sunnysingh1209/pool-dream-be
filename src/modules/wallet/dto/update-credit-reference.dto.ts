import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateCreditReferenceDto {
  @ApiProperty()
  @IsUUID()
  userId: string = '';

  @ApiProperty({ example: 100.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditReference: number = 0;
}
