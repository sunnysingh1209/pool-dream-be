import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PostgresConfigModule } from './common/configuration/db/config.module';
import { TypeOrmPostgresConnectionService } from './common/configuration/db/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { BetAmountPresetModule } from './modules/bet-amount-preset/bet-amount-preset.module';
import { GameModule } from './modules/game/game.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.dev.env'],
      expandVariables: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [PostgresConfigModule],
      useClass: TypeOrmPostgresConnectionService,
      inject: [TypeOrmPostgresConnectionService],
    }),
    AuthModule,
    WalletModule,
    GameModule,
    UsersModule,
    BetAmountPresetModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
