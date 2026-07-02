import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConfigModule } from './common/configuration/db/config.module';
import { TypeOrmPostgresConnectionService } from './common/configuration/db/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { GameModule } from './modules/game/game.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.dev.env'],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [PostgresConfigModule],
      useClass: TypeOrmPostgresConnectionService,
      inject: [TypeOrmPostgresConnectionService],
    }),
    AuthModule,
    WalletModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
