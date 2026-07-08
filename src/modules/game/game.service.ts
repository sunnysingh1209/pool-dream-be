import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { GameSubType } from '../../common/enums/game-sub-type.enum';
import { RoleName } from '../../common/enums/role.enum';
import { GameBetNumberEntity } from '../../entities/game-bet-number.entity';
import { GameBetEntity } from '../../entities/game-bet.entity';
import { GameResultEntity } from '../../entities/game-result.entity';
import { GameSubTypeEntity } from '../../entities/game-sub-type.entity';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletService } from '../wallet/wallet.service';
import { BetResponseDto } from './dto/bet-response.dto';
import { PlaceBetDto } from './dto/place-bet.dto';
import { GameSubTypeService } from './game-sub-type.service';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameBetEntity)
    private readonly gameBetRepository: Repository<GameBetEntity>,
    @InjectRepository(GameBetNumberEntity)
    private readonly gameBetNumberRepository: Repository<GameBetNumberEntity>,
    @InjectRepository(UserIdentityEntity)
    private readonly userRepository: Repository<UserIdentityEntity>,
    @InjectRepository(GameResultEntity)
    private readonly gameResultRepository: Repository<GameResultEntity>,
    @InjectRepository(GameSubTypeEntity)
    private readonly gameSubTypeRepository: Repository<GameSubTypeEntity>,
    private readonly gameSubTypeService: GameSubTypeService,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  async placeBet(
    userId: string,
    userEmail: string,
    dto: PlaceBetDto,
  ): Promise<BetResponseDto> {
    await this.gameSubTypeService.assertBettingOpen(dto.gameSubType);

    const totalAmount = dto.selections.reduce((sum, s) => sum + s.amount, 0);

    return this.dataSource.transaction(async (manager) => {
      const betRepo = manager.getRepository(GameBetEntity);
      const numberRepo = manager.getRepository(GameBetNumberEntity);

      const bet = await betRepo.save(
        betRepo.create({
          userId,
          gameType: dto.gameType,
          gameSubType: dto.gameSubType,
          totalAmount,
          createdBy: userEmail,
        }),
      );

      await this.walletService.debit(
        userId,
        totalAmount,
        bet.id,
        userEmail,
        manager,
      );

      const selections = await numberRepo.save(
        dto.selections.map((s) =>
          numberRepo.create({
            betId: bet.id,
            number: s.number,
            amount: s.amount,
            createdBy: userEmail,
          }),
        ),
      );

      return this.toBetResponse(bet, selections);
    });
  }

  async listBets(
    currentUser: CurrentUserPayload,
    pagination: PaginationQueryDto,
    filterUserId?: string,
  ) {
    const isSuperAdmin = currentUser.roles.includes(RoleName.SUPER_ADMIN);
    const targetUserId = isSuperAdmin ? filterUserId : currentUser.id;

    const [bets, total] = await this.gameBetRepository.findAndCount({
      where: targetUserId ? { userId: targetUserId } : {},
      order: { createdDate: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    const betIds = bets.map((bet) => bet.id);
    const selections = betIds.length
      ? await this.gameBetNumberRepository.find({
          where: { betId: In(betIds) },
        })
      : [];

    const selectionsByBet = new Map<string, GameBetNumberEntity[]>();
    for (const selection of selections) {
      const list = selectionsByBet.get(selection.betId) ?? [];
      list.push(selection);
      selectionsByBet.set(selection.betId, list);
    }

    const userIds = [...new Set(bets.map((bet) => bet.userId))];
    const users = userIds.length
      ? await this.userRepository.find({ where: { id: In(userIds) } })
      : [];
    const userById = new Map(users.map((user) => [user.id, user]));

    const winningNumberByResult = await this.getWinningNumberByResult(bets);
    const subTypeNameById = await this.getSubTypeNameById(bets);

    return {
      items: bets.map((bet) => ({
        ...this.toBetResponse(bet, selectionsByBet.get(bet.id) ?? []),
        userName: userById.get(bet.userId)?.name ?? '',
        userEmail: userById.get(bet.userId)?.email ?? '',
        gameSubTypeName: subTypeNameById.get(bet.gameSubType) ?? '',
        winningNumber: bet.resultId
          ? winningNumberByResult.get(bet.resultId)
          : undefined,
      })),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async getBetById(
    id: string,
    currentUser: CurrentUserPayload,
  ): Promise<BetResponseDto> {
    const bet = await this.gameBetRepository.findOne({ where: { id } });
    const isSuperAdmin = currentUser.roles.includes(RoleName.SUPER_ADMIN);
    if (!bet || (!isSuperAdmin && bet.userId !== currentUser.id)) {
      throw new NotFoundException('Bet not found');
    }

    const selections = await this.gameBetNumberRepository.find({
      where: { betId: bet.id },
    });

    let winningNumber: number | undefined;
    if (bet.resultId) {
      const result = await this.gameResultRepository.findOne({
        where: { id: bet.resultId },
      });
      winningNumber = result?.winningNumber;
    }

    const subType = await this.gameSubTypeRepository.findOne({
      where: { name: bet.gameSubType as GameSubType },
    });

    return {
      ...this.toBetResponse(bet, selections),
      winningNumber,
      gameSubTypeName: subType?.displayName ?? '',
    };
  }

  private async getWinningNumberByResult(
    bets: GameBetEntity[],
  ): Promise<Map<string, number>> {
    const resultIds = [
      ...new Set(bets.map((bet) => bet.resultId).filter((id): id is string => !!id)),
    ];
    const results = resultIds.length
      ? await this.gameResultRepository.find({ where: { id: In(resultIds) } })
      : [];
    return new Map(results.map((result) => [result.id, result.winningNumber]));
  }

  private async getSubTypeNameById(
    bets: GameBetEntity[],
  ): Promise<Map<string, string>> {
    const subTypeNames = [...new Set(bets.map((bet) => bet.gameSubType))] as GameSubType[];
    const subTypes = subTypeNames.length
      ? await this.gameSubTypeRepository.find({ where: { name: In(subTypeNames) } })
      : [];
    return new Map(subTypes.map((subType) => [subType.name, subType.displayName]));
  }

  private toBetResponse(
    bet: GameBetEntity,
    selections: GameBetNumberEntity[],
  ): BetResponseDto {
    return {
      id: bet.id,
      userId: bet.userId,
      gameType: bet.gameType,
      gameSubType: bet.gameSubType,
      totalAmount: bet.totalAmount,
      resultId: bet.resultId,
      selections: selections.map((s) => ({
        number: s.number,
        amount: s.amount,
      })),
      createdDate: bet.createdDate,
    };
  }
}
