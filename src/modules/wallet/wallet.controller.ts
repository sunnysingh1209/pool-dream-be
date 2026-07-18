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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TopUpCreditDto } from './dto/top-up-credit.dto';
import { TransactionsQueryDto } from './dto/transactions-query.dto';
import { UpdateCreditReferenceDto } from './dto/update-credit-reference.dto';
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
    @Query() query: TransactionsQueryDto,
  ) {
    return this.walletService.getTransactions(user.id, query);
  }

  @Get('me/transactions/summary')
  getMyTransactionsSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: TransactionsQueryDto,
  ) {
    return this.walletService.getTransactionsSummary([user.id], query);
  }

  @Post('topup')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  async topUp(
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: TopUpCreditDto,
  ) {
    const wallet = await this.walletService.topUp(
      dto.userId,
      dto.amount,
      admin.email,
      dto.remarks,
      dto.creditReference,
    );
    return {
      userId: dto.userId,
      balance: wallet.balance,
      creditReference: wallet.creditReference,
      lastCreditRefUpdate: wallet.lastCreditRefUpdate,
    };
  }

  @Post('credit-reference')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  async updateCreditReference(
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: UpdateCreditReferenceDto,
  ) {
    const wallet = await this.walletService.updateCreditReference(
      dto.userId,
      dto.creditReference,
      admin.email,
    );
    return {
      userId: dto.userId,
      balance: wallet.balance,
      creditReference: wallet.creditReference,
      lastCreditRefUpdate: wallet.lastCreditRefUpdate,
    };
  }

  @Get('transactions')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  getAllTransactions(
    @CurrentUser() actor: CurrentUserPayload,
    @Query() query: TransactionsQueryDto,
  ) {
    return this.walletService.getTransactionsForActor(actor, query);
  }

  @Get('transactions/summary')
  @UseGuards(RolesGuard)
  getAllTransactionsSummary(
    @CurrentUser() actor: CurrentUserPayload,
    @Query() query: TransactionsQueryDto,
  ) {
    return this.walletService.getTransactionsSummaryForActor(actor, query);
  }

  @Get(':userId/transactions')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  getUserTransactions(
    @CurrentUser() actor: CurrentUserPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: TransactionsQueryDto,
  ) {
    return this.walletService.getTransactionsForActor(actor, query, userId);
  }

  @Get(':userId/transactions/summary')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  getUserTransactionsSummary(
    @CurrentUser() actor: CurrentUserPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: TransactionsQueryDto,
  ) {
    return this.walletService.getTransactionsSummaryForActor(actor, query, userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  getAllWallets(@CurrentUser() actor: CurrentUserPayload) {
    return this.walletService.getWalletForActor(actor);
  }

  @Get(':userId')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  getUserWallet(
    @CurrentUser() actor: CurrentUserPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.walletService.getWalletForActor(actor, userId);
  }
}
