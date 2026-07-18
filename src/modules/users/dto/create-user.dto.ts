import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ADMIN_CREATABLE_ROLES } from '../../../common/constants/creatable-roles.constant';
import { RoleName } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe', description: 'Unique username, no whitespace, minimum 4 characters' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(150)
  @Matches(/^\S+$/, { message: 'Name must not contain whitespace characters' })
  name: string = '';

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string = '';

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string = '';

  @ApiProperty({ example: '+11234567890', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({ enum: ADMIN_CREATABLE_ROLES })
  @IsIn(ADMIN_CREATABLE_ROLES)
  role!: RoleName;
}
