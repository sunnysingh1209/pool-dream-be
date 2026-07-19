import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Optional when the refreshToken httpOnly cookie is present (browser clients); required otherwise (e.g. Swagger, non-browser clients).',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
