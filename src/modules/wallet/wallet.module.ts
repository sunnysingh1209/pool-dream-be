import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditTransactionEntity } from '../../entities/credit-transaction.entity';
import { RedeemRequestEntity } from '../../entities/redeem-request.entity';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { WalletEntity } from '../../entities/wallet.entity';
import { RoleModule } from '../role/role.module';
import { RedeemRequestController } from './redeem-request.controller';
import { RedeemRequestService } from './redeem-request.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletEntity,
      CreditTransactionEntity,
      UserIdentityEntity,
      RedeemRequestEntity,
    ]),
    RoleModule,
  ],
  controllers: [WalletController, RedeemRequestController],
  providers: [WalletService, RedeemRequestService],
  exports: [WalletService],
})
export class WalletModule {}
