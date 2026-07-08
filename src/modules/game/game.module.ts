import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameBetNumberEntity } from '../../entities/game-bet-number.entity';
import { GameBetEntity } from '../../entities/game-bet.entity';
import { GameResultEntity } from '../../entities/game-result.entity';
import { GameSubTypeEntity } from '../../entities/game-sub-type.entity';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { WalletModule } from '../wallet/wallet.module';
import { GameResultController } from './game-result.controller';
import { GameResultService } from './game-result.service';
import { GameSubTypeController } from './game-sub-type.controller';
import { GameSubTypeService } from './game-sub-type.service';
import { GameController } from './game.controller';
import { GameService } from './game.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameBetEntity,
      GameBetNumberEntity,
      GameResultEntity,
      GameSubTypeEntity,
      UserIdentityEntity,
    ]),
    WalletModule,
  ],
  controllers: [GameController, GameResultController, GameSubTypeController],
  providers: [GameService, GameResultService, GameSubTypeService],
})
export class GameModule {}
