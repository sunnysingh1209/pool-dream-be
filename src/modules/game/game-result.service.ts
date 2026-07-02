import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { GameBetEntity } from '../../entities/game-bet.entity';
import { GameResultEntity } from '../../entities/game-result.entity';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { DeclareResultDto } from './dto/declare-result.dto';
import {
  GameResultResponseDto,
  GameResultSummaryDto,
  ResultWinnerDto,
} from './dto/game-result-response.dto';

@Injectable()
export class GameResultService {
  constructor(
    @InjectRepository(GameResultEntity)
    private readonly gameResultRepository: Repository<GameResultEntity>,
    @InjectRepository(GameBetEntity)
    private readonly gameBetRepository: Repository<GameBetEntity>,
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
        where: { gameType: dto.gameType, resultId: IsNull() },
        select: ['id'],
      });

      const result = await resultRepo.save(
        resultRepo.create({
          gameType: dto.gameType,
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
      return this.toResponse(result, winners);
    });
  }

  async listResults(pagination: PaginationQueryDto) {
    const [results, total] = await this.gameResultRepository.findAndCount({
      order: { createdDate: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    const resultIds = results.map((r) => r.id);
    const counts: Array<{ resultId: string; winnerCount: number }> =
      resultIds.length
        ? await this.dataSource.query(
            `SELECT b."ResultId" AS "resultId", COUNT(DISTINCT b."UserId")::int AS "winnerCount"
             FROM "GameBetTbl" b
             JOIN "GameBetNumberTbl" n ON n."BetId" = b."Id"
             JOIN "GameResultTbl" gr ON gr."Id" = b."ResultId"
             WHERE b."ResultId" = ANY($1) AND n."Number" = gr."WinningNumber"
             GROUP BY b."ResultId"`,
            [resultIds],
          )
        : [];
    const winnerCountByResult = new Map(
      counts.map((c) => [c.resultId, c.winnerCount]),
    );

    const items: GameResultSummaryDto[] = results.map((result) => ({
      id: result.id,
      gameType: result.gameType,
      winningNumber: result.winningNumber,
      declaredBy: result.createdBy,
      declaredAt: result.createdDate,
      settledBetCount: result.settledBetCount,
      winnerCount: winnerCountByResult.get(result.id) ?? 0,
    }));

    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  async getResultById(id: string): Promise<GameResultResponseDto> {
    const result = await this.gameResultRepository.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Result not found');
    }

    const winners = await this.getWinners(result);
    return this.toResponse(result, winners);
  }

  private async getWinners(
    result: GameResultEntity,
    manager?: EntityManager,
  ): Promise<ResultWinnerDto[]> {
    const runner = manager ?? this.dataSource.manager;
    return runner.query(
      `SELECT u."Id" AS "userId", u."Name" AS "name", u."Email" AS "email",
              SUM(n."Amount")::int AS "winningAmount",
              ARRAY_AGG(DISTINCT b."Id") AS "betIds"
       FROM "GameBetNumberTbl" n
       JOIN "GameBetTbl" b ON b."Id" = n."BetId"
       JOIN "UserIdentityTbl" u ON u."Id" = b."UserId"
       WHERE b."ResultId" = $1 AND n."Number" = $2
       GROUP BY u."Id", u."Name", u."Email"
       ORDER BY "winningAmount" DESC`,
      [result.id, result.winningNumber],
    );
  }

  private toResponse(
    result: GameResultEntity,
    winners: ResultWinnerDto[],
  ): GameResultResponseDto {
    return {
      id: result.id,
      gameType: result.gameType,
      winningNumber: result.winningNumber,
      declaredBy: result.createdBy,
      declaredAt: result.createdDate,
      settledBetCount: result.settledBetCount,
      winners,
    };
  }
}
