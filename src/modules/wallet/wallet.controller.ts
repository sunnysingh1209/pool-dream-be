import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TopUpCreditDto } from './dto/top-up-credit.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@ApiBearerAuth('access-token')
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  async getMyWallet(@CurrentUser() user: CurrentUserPayload) {
    const balance = await this.walletService.getBalance(user.id);
    return { userId: user.id, balance };
  }

  @Get('me/transactions')
  getMyTransactions(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.walletService.getTransactions(user.id, pagination);
  }

  @Post('topup')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  async topUp(
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: TopUpCreditDto,
  ) {
    const balance = await this.walletService.topUp(
      dto.userId,
      dto.amount,
      admin.email,
      dto.remarks,
    );
    return { userId: dto.userId, balance };
  }

  @Get(':userId/transactions')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  getUserTransactions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.walletService.getTransactions(userId, pagination);
  }

  @Get(':userId')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  async getUserWallet(@Param('userId', ParseUUIDPipe) userId: string) {
    const balance = await this.walletService.getBalance(userId);
    return { userId, balance };
  }
}
