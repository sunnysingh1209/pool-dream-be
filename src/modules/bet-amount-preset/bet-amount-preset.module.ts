import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetAmountPresetEntity } from '../../entities/bet-amount-preset.entity';
import { BetAmountPresetController } from './bet-amount-preset.controller';
import { BetAmountPresetService } from './bet-amount-preset.service';

@Module({
  imports: [TypeOrmModule.forFeature([BetAmountPresetEntity])],
  controllers: [BetAmountPresetController],
  providers: [BetAmountPresetService],
  exports: [BetAmountPresetService],
})
export class BetAmountPresetModule {}
