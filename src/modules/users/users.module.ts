import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { RoleModule } from '../role/role.module';
import { WalletModule } from '../wallet/wallet.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserIdentityEntity]),
    RoleModule,
    WalletModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
