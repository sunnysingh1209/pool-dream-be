import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectRedeemRequestDto {
  @ApiProperty({ required: false, example: 'Suspicious activity on account' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
