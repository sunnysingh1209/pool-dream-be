import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameBetNumberEntity } from '../../entities/game-bet-number.entity';
import { GameBetEntity } from '../../entities/game-bet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameBetEntity, GameBetNumberEntity]),
    WalletModule,
  ],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
