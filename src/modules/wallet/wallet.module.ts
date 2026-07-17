import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditTransactionEntity } from '../../entities/credit-transaction.entity';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { WalletEntity } from '../../entities/wallet.entity';
import { WithdrawRequestEntity } from '../../entities/withdraw-request.entity';
import { RoleModule } from '../role/role.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WithdrawRequestController } from './withdraw-request.controller';
import { WithdrawRequestService } from './withdraw-request.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletEntity,
      CreditTransactionEntity,
      UserIdentityEntity,
      WithdrawRequestEntity,
    ]),
    RoleModule,
  ],
  controllers: [WalletController, WithdrawRequestController],
  providers: [WalletService, WithdrawRequestService],
  exports: [WalletService],
})
export class WalletModule {}
