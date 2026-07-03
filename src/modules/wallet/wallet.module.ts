import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditTransactionEntity } from '../../entities/credit-transaction.entity';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { WalletEntity } from '../../entities/wallet.entity';
import { RoleModule } from '../role/role.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletEntity,
      CreditTransactionEntity,
      UserIdentityEntity,
    ]),
    RoleModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
