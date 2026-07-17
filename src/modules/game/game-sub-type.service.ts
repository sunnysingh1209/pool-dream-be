import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { GameSubType } from '../../common/enums/game-sub-type.enum';
import { GameResultEntity } from '../../entities/game-result.entity';
import { GameSubTypeEntity } from '../../entities/game-sub-type.entity';
import { GameSubTypeResultBoardDto, UpdateGameSubTypeDto } from './dto/game-sub-type.dto';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

@Injectable()
export class GameSubTypeService {
  constructor(
    @InjectRepository(GameSubTypeEntity)
    private readonly gameSubTypeRepository: Repository<GameSubTypeEntity>,
    @InjectRepository(GameResultEntity)
    private readonly gameResultRepository: Repository<GameResultEntity>,
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

  async getSubTypeById(id: string): Promise<GameSubTypeEntity> {
    const subType = await this.gameSubTypeRepository.findOne({ where: { id } });
    if (!subType) {
      throw new NotFoundException('Game sub type not found');
    }
    return subType;
  }

  async updateSubType(
    id: string,
    dto: UpdateGameSubTypeDto,
    updatedBy: string,
  ): Promise<GameSubTypeEntity> {
    const subType = await this.getSubTypeById(id);
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

  /**
   * Returns, per active game sub type, the last declared result for "yesterday"
   * and "today" (IST calendar days). Either field is null until declared.
   */
  async getResultsBoard(): Promise<Record<string, GameSubTypeResultBoardDto>> {
    const subTypes = await this.gameSubTypeRepository.find({
      where: { isActive: true },
      order: { closeTime: 'ASC' },
    });

    const { yesterdayStart, todayStart, tomorrowStart } =
      GameSubTypeService.getIstDayBoundaries();

    const results = await this.gameResultRepository.find({
      where: {
        gameSubType: In(subTypes.map((subType) => subType.name)),
        createdDate: Between(yesterdayStart, tomorrowStart),
      },
      order: { createdDate: 'DESC' },
    });

    const displayNameByCode = new Map(
      subTypes.map((subType) => [subType.name, subType.displayName]),
    );

    const board: Record<string, GameSubTypeResultBoardDto> = {};
    for (const subType of subTypes) {
      board[subType.displayName] = { yest_res: null, today: null };
    }

    for (const result of results) {
      const displayName = displayNameByCode.get(result.gameSubType as GameSubType);
      const entry = displayName ? board[displayName] : undefined;
      if (!entry) {
        continue;
      }
      if (result.createdDate >= todayStart) {
        if (entry.today === null) {
          entry.today = result.winningNumber;
        }
      } else if (entry.yest_res === null) {
        entry.yest_res = result.winningNumber;
      }
    }

    return board;
  }

  private static getIstDayBoundaries(): {
    yesterdayStart: Date;
    todayStart: Date;
    tomorrowStart: Date;
  } {
    const nowIst = new Date(Date.now() + IST_OFFSET_MS);
    const year = nowIst.getUTCFullYear();
    const month = nowIst.getUTCMonth();
    const date = nowIst.getUTCDate();

    const istMidnightToUtc = (dayOffset: number) =>
      new Date(Date.UTC(year, month, date + dayOffset) - IST_OFFSET_MS);

    return {
      yesterdayStart: istMidnightToUtc(-1),
      todayStart: istMidnightToUtc(0),
      tomorrowStart: istMidnightToUtc(1),
    };
  }

  private static getCurrentIstTime(): string {
    const ist = new Date(Date.now() + IST_OFFSET_MS);
    const hh = String(ist.getUTCHours()).padStart(2, '0');
    const mm = String(ist.getUTCMinutes()).padStart(2, '0');
    const ss = String(ist.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
}
