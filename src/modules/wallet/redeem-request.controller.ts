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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RedeemRequestStatus } from '../../common/enums/redeem-request-status.enum';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRedeemRequestDto } from './dto/create-redeem-request.dto';
import { RejectRedeemRequestDto } from './dto/reject-redeem-request.dto';
import { RedeemRequestService } from './redeem-request.service';

@ApiTags('Redeem Requests')
@ApiBearerAuth('access-token')
@Controller('wallet/redeem-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RedeemRequestController {
  constructor(private readonly redeemRequestService: RedeemRequestService) {}

  @Post()
  createRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRedeemRequestDto,
  ) {
    return this.redeemRequestService.createRequest(user.id, user.email, dto);
  }

  @Get('me')
  listMyRequests(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.redeemRequestService.listMyRequests(user.id, pagination);
  }

  @Get()
  @Roles(RoleName.SUPER_ADMIN)
  @ApiQuery({ name: 'status', enum: RedeemRequestStatus, required: false })
  listAllRequests(
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: RedeemRequestStatus,
  ) {
    return this.redeemRequestService.listAllRequests(pagination, status);
  }

  @Patch(':id/approve')
  @Roles(RoleName.SUPER_ADMIN)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.redeemRequestService.approve(id, admin.email);
  }

  @Patch(':id/reject')
  @Roles(RoleName.SUPER_ADMIN)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: RejectRedeemRequestDto,
  ) {
    return this.redeemRequestService.reject(id, admin.email, dto.remarks);
  }
}
