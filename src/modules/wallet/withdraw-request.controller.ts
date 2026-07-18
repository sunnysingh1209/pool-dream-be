import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateWithdrawRequestDto } from './dto/create-withdraw-request.dto';
import { ListWithdrawRequestsQueryDto } from './dto/list-withdraw-requests-query.dto';
import { WithdrawRequestService } from './withdraw-request.service';

@ApiTags('Withdraw Requests')
@ApiBearerAuth('access-token')
@Controller('wallet/withdraw-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WithdrawRequestController {
  constructor(private readonly withdrawRequestService: WithdrawRequestService) {}

  @Roles(RoleName.SUPER_ADMIN)
  @Post()
  create(
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: CreateWithdrawRequestDto,
  ) {
    return this.withdrawRequestService.create(admin.email, dto);
  }

  @Get()
  @ApiQuery({ name: 'userId', required: false })
  listAll(
    @Query() query: ListWithdrawRequestsQueryDto,
    @Query('userId') userId?: string,
  ) {
    return this.withdrawRequestService.listAll(query, userId);
  }
}
