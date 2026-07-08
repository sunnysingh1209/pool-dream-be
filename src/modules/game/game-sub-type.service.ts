import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSubType } from '../../common/enums/game-sub-type.enum';
import { GameSubTypeEntity } from '../../entities/game-sub-type.entity';
import { UpdateGameSubTypeDto } from './dto/game-sub-type.dto';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

@Injectable()
export class GameSubTypeService {
  constructor(
    @InjectRepository(GameSubTypeEntity)
    private readonly gameSubTypeRepository: Repository<GameSubTypeEntity>,
  ) {}

  async listSubTypes(): Promise<GameSubTypeEntity[]> {
    return this.gameSubTypeRepository.find({ order: { closeTime: 'ASC' } });
  }

  async getSubType(name: GameSubType): Promise<GameSubTypeEntity> {
    const subType = await this.gameSubTypeRepository.findOne({ where: { name } });
    if (!subType) {
      throw new NotFoundException('Game sub type not found');
    }
    return subType;
  }

  async updateSubType(
    name: GameSubType,
    dto: UpdateGameSubTypeDto,
    updatedBy: string,
  ): Promise<GameSubTypeEntity> {
    const subType = await this.getSubType(name);
    if (dto.displayName !== undefined) {
      subType.displayName = dto.displayName;
    }
    if (dto.closeTime !== undefined) {
      subType.closeTime = dto.closeTime;
    }
    if (dto.isActive !== undefined) {
      subType.isActive = dto.isActive;
    }
    subType.updatedBy = updatedBy;
    return this.gameSubTypeRepository.save(subType);
  }

  /**
   * Throws if the sub type is inactive or its daily betting cutoff (IST) has passed.
   */
  async assertBettingOpen(name: GameSubType): Promise<GameSubTypeEntity> {
    const subType = await this.getSubType(name);
    if (!subType.isActive) {
      throw new BadRequestException(
        `${subType.displayName} is not currently accepting bets`,
      );
    }
    if (GameSubTypeService.getCurrentIstTime() >= subType.closeTime) {
      throw new BadRequestException(
        `Betting for ${subType.displayName} closed at ${subType.closeTime} IST`,
      );
    }
    return subType;
  }

  private static getCurrentIstTime(): string {
    const ist = new Date(Date.now() + IST_OFFSET_MS);
    const hh = String(ist.getUTCHours()).padStart(2, '0');
    const mm = String(ist.getUTCMinutes()).padStart(2, '0');
    const ss = String(ist.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
}
