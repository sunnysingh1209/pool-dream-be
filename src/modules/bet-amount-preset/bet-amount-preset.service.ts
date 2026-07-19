import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DEFAULT_BET_AMOUNT_PRESETS } from '../../common/constants/bet-amount-preset.constant';
import { BetAmountPresetEntity } from '../../entities/bet-amount-preset.entity';

@Injectable()
export class BetAmountPresetService {
  constructor(
    @InjectRepository(BetAmountPresetEntity)
    private readonly betAmountPresetRepository: Repository<BetAmountPresetEntity>,
  ) {}

  async listForUser(userId: string): Promise<BetAmountPresetEntity[]> {
    return this.betAmountPresetRepository.find({
      where: { userId },
      order: { amount: 'ASC' },
    });
  }

  async addAmount(
    userId: string,
    amount: number,
    createdBy: string,
  ): Promise<BetAmountPresetEntity> {
    const existing = await this.betAmountPresetRepository.findOne({
      where: { userId, amount },
    });
    if (existing) {
      throw new ConflictException('This amount is already in your presets');
    }

    return this.betAmountPresetRepository.save(
      this.betAmountPresetRepository.create({ userId, amount, createdBy }),
    );
  }

  async deleteAmount(userId: string, id: string): Promise<{ message: string }> {
    const preset = await this.betAmountPresetRepository.findOne({
      where: { id, userId },
    });
    if (!preset) {
      throw new NotFoundException('Preset amount not found');
    }
    await this.betAmountPresetRepository.delete({ id });
    return { message: 'Preset amount deleted' };
  }

  /**
   * Seeds the default quick-bet amount presets for a newly created user.
   */
  async seedDefaultsForUser(
    userId: string,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(BetAmountPresetEntity)
      : this.betAmountPresetRepository;
    await repo.save(
      DEFAULT_BET_AMOUNT_PRESETS.map((amount) =>
        repo.create({ userId, amount, createdBy }),
      ),
    );
  }
}
