import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RoleName } from '../../common/enums/role.enum';
import { GameBetNumberEntity } from '../../entities/game-bet-number.entity';
import { GameBetEntity } from '../../entities/game-bet.entity';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletService } from '../wallet/wallet.service';
import { BetResponseDto } from './dto/bet-response.dto';
import { PlaceBetDto } from './dto/place-bet.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameBetEntity)
    private readonly gameBetRepository: Repository<GameBetEntity>,
    @InjectRepository(GameBetNumberEntity)
    private readonly gameBetNumberRepository: Repository<GameBetNumberEntity>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  async placeBet(
    userId: string,
    userEmail: string,
    dto: PlaceBetDto,
  ): Promise<BetResponseDto> {
    const totalAmount = dto.selections.reduce((sum, s) => sum + s.amount, 0);

    return this.dataSource.transaction(async (manager) => {
      const betRepo = manager.getRepository(GameBetEntity);
      const numberRepo = manager.getRepository(GameBetNumberEntity);

      const bet = await betRepo.save(
        betRepo.create({
          userId,
          gameType: dto.gameType,
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

    return {
      items: bets.map((bet) =>
        this.toBetResponse(bet, selectionsByBet.get(bet.id) ?? []),
      ),
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
    return this.toBetResponse(bet, selections);
  }

  private toBetResponse(
    bet: GameBetEntity,
    selections: GameBetNumberEntity[],
  ): BetResponseDto {
    return {
      id: bet.id,
      userId: bet.userId,
      gameType: bet.gameType,
      totalAmount: bet.totalAmount,
      selections: selections.map((s) => ({
        number: s.number,
        amount: s.amount,
      })),
      createdDate: bet.createdDate,
    };
  }
}
