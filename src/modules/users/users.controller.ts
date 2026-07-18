import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-password.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers(
    @CurrentUser() actor: CurrentUserPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.usersService.listUsers(pagination, actor.id);
  }

  @Post()
  createUser(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createUser(actor.email, dto);
  }

  @Patch(':id/lock')
  @Roles(RoleName.SUPER_ADMIN)
  lockUser(
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.setLockStatus(actor.email, id, true);
  }

  @Patch(':id/unlock')
  @Roles(RoleName.SUPER_ADMIN)
  unlockUser(
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.setLockStatus(actor.email, id, false);
  }

  @Patch(':id/password')
  @Roles(RoleName.SUPER_ADMIN)
  resetPassword(
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.usersService.resetPassword(actor.email, id, dto);
  }
}
