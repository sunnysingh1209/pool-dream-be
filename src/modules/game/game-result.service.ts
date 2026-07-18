import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JODI_PAYOUT_MULTIPLIER } from '../../common/constants/payout-multiplier.constant';
import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { GameSubType } from '../../common/enums/game-sub-type.enum';
import { CreditTransactionEntity } from '../../entities/credit-transaction.entity';
import { GameBetEntity } from '../../entities/game-bet.entity';
import { GameResultEntity } from '../../entities/game-result.entity';
import { GameSubTypeEntity } from '../../entities/game-sub-type.entity';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletService } from '../wallet/wallet.service';
import { DeclareResultDto } from './dto/declare-result.dto';
import {
  GameResultResponseDto,
  GameResultSummaryDto,
  ResultWinnerDto,
} from './dto/game-result-response.dto';
import { UpdateResultDto } from './dto/update-result.dto';

const RESULT_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class GameResultService {
  constructor(
    @InjectRepository(GameResultEntity)
    private readonly gameResultRepository: Repository<GameResultEntity>,
    @InjectRepository(GameBetEntity)
    private readonly gameBetRepository: Repository<GameBetEntity>,
    @InjectRepository(GameSubTypeEntity)
    private readonly gameSubTypeRepository: Repository<GameSubTypeEntity>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  async declareResult(
    admin: CurrentUserPayload,
    dto: DeclareResultDto,
  ): Promise<GameResultResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const betRepo = manager.getRepository(GameBetEntity);
      const resultRepo = manager.getRepository(GameResultEntity);

      const pendingBets = await betRepo.find({
        where: {
          gameType: dto.gameType,
          gameSubType: dto.gameSubType,
          resultId: IsNull(),
        },
        select: ['id'],
      });

      const result = await resultRepo.save(
        resultRepo.create({
          gameType: dto.gameType,
          gameSubType: dto.gameSubType,
          winningNumber: dto.winningNumber,
          settledBetCount: pendingBets.length,
          createdBy: admin.email,
        }),
      );

      if (pendingBets.length > 0) {
        await betRepo
          .createQueryBuilder()
          .update(GameBetEntity)
          .set({ resultId: result.id })
          .where('"Id" IN (:...ids)', {
            ids: pendingBets.map((bet) => bet.id),
          })
          .execute();
      }

      const winners = await this.getWinners(result, manager);
      result.winners = winners;
      await resultRepo.save(result);

      for (const winner of winners) {
        if (winner.winningAmount <= 0) {
          continue;
        }
        await this.walletService.credit(
          winner.userId,
          winner.winningAmount,
          CreditTransactionType.CREDIT,
          result.id,
          admin.email,
          manager,
        );
      }

      return this.toResponse(result);
    });
  }

  /**
   * Superadmin-only correction, allowed within 24 hours of the original
   * declaration. Reverses the previous winners' payouts (wallet balance is
   * decremented without the usual insufficient-balance guard, since a
   * winner may have already spent/withdrawn it — this is a correction, not
   * a user-initiated spend) and soft-deletes their credit transactions so
   * they drop out of transaction history/summaries. Bet-to-result linkage
   * is untouched: the same settled bets are simply re-scored against the
   * new winning number.
   */
  async updateResult(
    admin: CurrentUserPayload,
    resultId: string,
    dto: UpdateResultDto,
  ): Promise<GameResultResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const resultRepo = manager.getRepository(GameResultEntity);
      const result = await resultRepo.findOne({ where: { id: resultId } });
      if (!result) {
        throw new NotFoundException('Result not found');
      }

      if (Date.now() - result.createdDate.getTime() > RESULT_EDIT_WINDOW_MS) {
        throw new BadRequestException(
          'Results can only be changed within 24 hours of declaration',
        );
      }
      if (dto.winningNumber === result.winningNumber) {
        throw new BadRequestException(
          'New winning number must differ from the current one',
        );
      }

      await this.reversePreviousWinners(result, admin.email, manager);

      result.winningNumber = dto.winningNumber;
      const winners = await this.getWinners(result, manager);
      result.winners = winners;
      result.updatedBy = admin.email;
      await resultRepo.save(result);

      for (const winner of winners) {
        if (winner.winningAmount <= 0) {
          continue;
        }
        await this.walletService.credit(
          winner.userId,
          winner.winningAmount,
          CreditTransactionType.CREDIT,
          result.id,
          admin.email,
          manager,
        );
      }

      return this.toResponse(result);
    });
  }

  private async reversePreviousWinners(
    result: GameResultEntity,
    performedBy: string,
    manager: EntityManager,
  ): Promise<void> {
    const txRepo = manager.getRepository(CreditTransactionEntity);
    const previousCredits = await txRepo.find({
      where: {
        referenceId: result.id,
        type: CreditTransactionType.CREDIT,
        isDeleted: false,
      },
    });

    for (const tx of previousCredits) {
      await this.walletService.reverseCredit(tx.userId, tx.amount, performedBy, manager);
      tx.isDeleted = true;
      tx.updatedBy = performedBy;
      await txRepo.save(tx);
    }
  }

  async listResults(pagination: PaginationQueryDto) {
    const [results, total] = await this.gameResultRepository.findAndCount({
      order: { createdDate: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    const subTypeNameByCode = await this.getSubTypeNameByCode(results);

    const items: GameResultSummaryDto[] = results.map((result) => ({
      id: result.id,
      gameType: result.gameType,
      gameSubType: result.gameSubType,
      gameSubTypeName: subTypeNameByCode.get(result.gameSubType) ?? '',
      winningNumber: result.winningNumber,
      declaredBy: result.createdBy,
      declaredAt: result.createdDate,
      settledBetCount: result.settledBetCount,
      winnerCount: result.winners.length,
      winners: result.winners,
    }));

    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  async getResultById(id: string): Promise<GameResultResponseDto> {
    const result = await this.gameResultRepository.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Result not found');
    }

    return this.toResponse(result);
  }

  private async getSubTypeNameByCode(
    results: GameResultEntity[],
  ): Promise<Map<string, string>> {
    const subTypeNames = [
      ...new Set(results.map((result) => result.gameSubType)),
    ] as GameSubType[];
    const subTypes = subTypeNames.length
      ? await this.gameSubTypeRepository.find({ where: { name: In(subTypeNames) } })
      : [];
    return new Map(subTypes.map((subType) => [subType.name, subType.displayName]));
  }

  private async getWinners(
    result: GameResultEntity,
    manager?: EntityManager,
  ): Promise<ResultWinnerDto[]> {
    const runner = manager ?? this.dataSource.manager;
    return runner.query(
      `SELECT u."Id" AS "userId", u."Name" AS "name", u."Email" AS "email",
              SUM(n."Amount" * $3::numeric)::int AS "winningAmount",
              ARRAY_AGG(DISTINCT b."Id") AS "betIds"
       FROM "GameBetNumberTbl" n
       JOIN "GameBetTbl" b ON b."Id" = n."BetId"
       JOIN "UserIdentityTbl" u ON u."Id" = b."UserId"
       WHERE b."ResultId" = $1 AND n."Number" = $2
       GROUP BY u."Id", u."Name", u."Email"
       ORDER BY "winningAmount" DESC`,
      [result.id, result.winningNumber, JODI_PAYOUT_MULTIPLIER],
    );
  }

  private async toResponse(
    result: GameResultEntity,
  ): Promise<GameResultResponseDto> {
    const subType = await this.gameSubTypeRepository.findOne({
      where: { name: result.gameSubType as GameSubType },
    });
    return {
      id: result.id,
      gameType: result.gameType,
      gameSubType: result.gameSubType,
      gameSubTypeName: subType?.displayName ?? '',
      winningNumber: result.winningNumber,
      declaredBy: result.createdBy,
      declaredAt: result.createdDate,
      settledBetCount: result.settledBetCount,
      winnerCount: result.winners.length,
      winners: result.winners,
    };
  }
}
