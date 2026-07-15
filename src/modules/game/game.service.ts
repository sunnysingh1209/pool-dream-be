import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AnderBaharPosition } from '../../common/enums/ander-bahar-position.enum';
import { GameSubType } from '../../common/enums/game-sub-type.enum';
import { RoleName } from '../../common/enums/role.enum';
import {
  ANDER_BAHAR_GROUP_SIZE,
  getAnderBaharNumbers,
} from '../../common/utils/ander-bahar.util';
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
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive || user.isLocked) {
      throw new UnauthorizedException('Account is inactive or locked');
    }

    await this.gameSubTypeService.assertBettingOpen(dto.gameSubType);

    const resolvedSelections = this.resolveSelections(dto);
    const totalAmount = resolvedSelections.reduce((sum, s) => sum + s.amount, 0);

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
        resolvedSelections.map((s) =>
          numberRepo.create({
            betId: bet.id,
            number: s.number,
            amount: s.amount,
            isHaruf: s.isHaruf,
            anderBaharDigit: s.anderBaharDigit,
            anderBaharPosition: s.anderBaharPosition,
            createdBy: userEmail,
          }),
        ),
      );

      return this.toBetResponse(bet, selections);
    });
  }

  /**
   * Ander/Bahar (Haruf) picks are a shorthand for a whole digit-group of 10
   * Jodi numbers. The amount given per pick is the TOTAL stake for that
   * group, split evenly across its 10 numbers (so it must be a multiple of
   * 10). That per-number amount is then paid out at the same
   * JODI_PAYOUT_MULTIPLIER as a direct pick, which reproduces the same
   * result as the old "full amount x 9.5" scheme, e.g. amount=10 -> 1 per
   * number -> 1 x 95 = 95 on a hit, same as 10 x 9.5 previously.
   * Direct picks are merged (summed) across duplicate numbers. Haruf picks
   * are merged only within the same (digit, position) group — a number
   * covered by two different groups (e.g. Ander-2 and Bahar-3 both including
   * 23) is stored as two separate rows, each tagged with its own
   * anderBaharDigit/anderBaharPosition, so the response can show which
   * group each row came from.
   */
  private resolveSelections(dto: PlaceBetDto): {
    number: number;
    amount: number;
    isHaruf: boolean;
    anderBaharDigit?: number;
    anderBaharPosition?: AnderBaharPosition;
  }[] {
    const directAmountByNumber = new Map<number, number>();
    for (const selection of dto.selections ?? []) {
      directAmountByNumber.set(
        selection.number,
        (directAmountByNumber.get(selection.number) ?? 0) + selection.amount,
      );
    }

    const groupAmountByKey = new Map<
      string,
      { digit: number; position: AnderBaharPosition; amount: number }
    >();
    for (const selection of dto.anderBaharSelections ?? []) {
      if (selection.amount % ANDER_BAHAR_GROUP_SIZE !== 0) {
        throw new BadRequestException(
          `anderBaharSelections amount must be a multiple of ${ANDER_BAHAR_GROUP_SIZE}`,
        );
      }
      const key = `${selection.position}:${selection.digit}`;
      const existing = groupAmountByKey.get(key);
      groupAmountByKey.set(key, {
        digit: selection.digit,
        position: selection.position,
        amount: (existing?.amount ?? 0) + selection.amount,
      });
    }

    if (directAmountByNumber.size === 0 && groupAmountByKey.size === 0) {
      throw new BadRequestException(
        'At least one of selections or anderBaharSelections must be provided',
      );
    }

    const harufRows = [...groupAmountByKey.values()].flatMap(
      ({ digit, position, amount }) => {
        const perNumberAmount = amount / ANDER_BAHAR_GROUP_SIZE;
        return getAnderBaharNumbers(digit, position).map((number) => ({
          number,
          amount: perNumberAmount,
          isHaruf: true,
          anderBaharDigit: digit,
          anderBaharPosition: position,
        }));
      },
    );

    return [
      ...[...directAmountByNumber.entries()].map(([number, amount]) => ({
        number,
        amount,
        isHaruf: false,
      })),
      ...harufRows,
    ];
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
        isHaruf: s.isHaruf,
        anderBaharDigit: s.anderBaharDigit,
        anderBaharPosition: s.anderBaharPosition,
      })),
      createdDate: bet.createdDate,
    };
  }
}
