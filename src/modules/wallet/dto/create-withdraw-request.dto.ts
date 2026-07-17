import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateWithdrawRequestDto {
  @ApiProperty({ description: 'Id of the user whose wallet is being withdrawn from' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ minimum: 1, maximum: 1_000_000, example: 500 })
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  amount: number = 1;

  @ApiProperty({ required: false, example: 'UPI: user@upi' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
