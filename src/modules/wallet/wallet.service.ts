import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { RoleName } from '../../common/enums/role.enum';
import { buildDateRangeFilter } from '../../common/utils/date-range.util';
import { CreditTransactionEntity } from '../../entities/credit-transaction.entity';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { WalletEntity } from '../../entities/wallet.entity';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RoleService } from '../role/role.service';
import { TransactionsQueryDto } from './dto/transactions-query.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(CreditTransactionEntity)
    private readonly creditTransactionRepository: Repository<CreditTransactionEntity>,
    @InjectRepository(UserIdentityEntity)
    private readonly userRepository: Repository<UserIdentityEntity>,
    private readonly roleService: RoleService,
    private readonly dataSource: DataSource,
  ) {}

  async createWalletForUser(
    userId: string,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<WalletEntity> {
    const repo = manager
      ? manager.getRepository(WalletEntity)
      : this.walletRepository;
    const existing = await repo.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    const wallet = repo.create({ userId, balance: 0, createdBy });
    return repo.save(wallet);
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    return wallet?.balance ?? 0;
  }

  async getBalances(userIds: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (userIds.length === 0) {
      return result;
    }

    const wallets = await this.walletRepository.find({
      where: { userId: In(userIds) },
    });
    for (const wallet of wallets) {
      result.set(wallet.userId, wallet.balance);
    }
    return result;
  }

  async getWallet(userId: string): Promise<WalletEntity | null> {
    return this.walletRepository.findOne({ where: { userId } });
  }

  async getWallets(userIds: string[]): Promise<Map<string, WalletEntity>> {
    const result = new Map<string, WalletEntity>();
    if (userIds.length === 0) {
      return result;
    }

    const wallets = await this.walletRepository.find({
      where: { userId: In(userIds) },
    });
    for (const wallet of wallets) {
      result.set(wallet.userId, wallet);
    }
    return result;
  }

  async topUp(
    userId: string,
    amount: number,
    performedBy: string,
    remarks?: string,
    creditReference?: number,
  ): Promise<WalletEntity> {
    return this.dataSource.transaction(async (manager) => {
      await this.createWalletForUser(userId, performedBy, manager);

      const walletRepo = manager.getRepository(WalletEntity);
      await walletRepo.increment({ userId }, 'balance', amount);
      if (creditReference !== undefined) {
        await walletRepo.update(
          { userId },
          {
            creditReference,
            lastCreditRefUpdate: new Date(),
            updatedBy: performedBy,
          },
        );
      }
      const wallet = await walletRepo.findOneOrFail({ where: { userId } });

      const txRepo = manager.getRepository(CreditTransactionEntity);
      await txRepo.save(
        txRepo.create({
          userId,
          type: CreditTransactionType.TOPUP,
          amount,
          balanceAfter: wallet.balance,
          remarks,
          createdBy: performedBy,
        }),
      );

      return wallet;
    });
  }

  async updateCreditReference(
    userId: string,
    creditReference: number,
    performedBy: string,
  ): Promise<WalletEntity> {
    await this.createWalletForUser(userId, performedBy);
    await this.walletRepository.update(
      { userId },
      { creditReference, lastCreditRefUpdate: new Date(), updatedBy: performedBy },
    );
    return this.walletRepository.findOneOrFail({ where: { userId } });
  }

  /**
   * Reverses a previously granted credit (e.g. a winning payout for a result
   * that's being corrected). Unlike debit(), this does not guard against
   * insufficient balance — the payout may have already been spent or
   * withdrawn, and this is an admin correction rather than a user-initiated
   * spend, so the balance is allowed to go negative. Must run inside the
   * caller's own transaction.
   */
  async reverseCredit(
    userId: string,
    amount: number,
    performedBy: string,
    manager: EntityManager,
  ): Promise<void> {
    const walletRepo = manager.getRepository(WalletEntity);
    await walletRepo.decrement({ userId }, 'balance', amount);
    await walletRepo.update({ userId }, { updatedBy: performedBy });
  }

  /**
   * Generic wallet credit used for winnings and approved refunds. Must run
   * inside the caller's own transaction (declareResult / refund approval)
   * so the credit and the state change that authorized it commit together.
   */
  async credit(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    referenceId: string | undefined,
    performedBy: string,
    manager: EntityManager,
  ): Promise<number> {
    await this.createWalletForUser(userId, performedBy, manager);

    const walletRepo = manager.getRepository(WalletEntity);
    await walletRepo.increment({ userId }, 'balance', amount);
    const wallet = await walletRepo.findOneOrFail({ where: { userId } });

    const txRepo = manager.getRepository(CreditTransactionEntity);
    await txRepo.save(
      txRepo.create({
        userId,
        type,
        amount,
        balanceAfter: wallet.balance,
        referenceId,
        createdBy: performedBy,
      }),
    );

    return wallet.balance;
  }

  async debit(
    userId: string,
    amount: number,
    referenceId: string,
    performedBy: string,
    manager: EntityManager,
    type: CreditTransactionType = CreditTransactionType.BET_DEBIT,
  ): Promise<number> {
    // TypeORM's postgres driver returns raw UPDATE results as a
    // [rows, rowCount] tuple, not the rows array directly.
    const [rows, rowCount]: [Array<{ Balance: number }>, number] =
      await manager.query(
        `UPDATE "UserWalletTbl" SET "Balance" = "Balance" - $1, "UpdatedDate" = now()
         WHERE "UserId" = $2 AND "Balance" >= $1
         RETURNING "Balance"`,
        [amount, userId],
      );

    if (rowCount === 0) {
      throw new BadRequestException('Insufficient credit balance');
    }

    const newBalance = rows[0].Balance;
    const txRepo = manager.getRepository(CreditTransactionEntity);
    await txRepo.save(
      txRepo.create({
        userId,
        type,
        amount,
        balanceAfter: newBalance,
        referenceId,
        createdBy: performedBy,
      }),
    );

    return newBalance;
  }

  async getTransactions(userId: string, query: TransactionsQueryDto) {
    return this.queryTransactions([userId], query);
  }

  async getWalletForActor(actor: CurrentUserPayload, userId?: string) {
    if (userId) {
      await this.assertCanAccessUser(actor, userId);
      const balance = await this.getBalance(userId);
      return { userId, balance };
    }

    const users = await this.userRepository.find({
      where: this.buildAccessibleUsersWhere(actor),
      order: { createdDate: 'DESC' },
    });
    const balanceMap = await this.getBalances(users.map((user) => user.id));
    return users.map((user) => ({
      userId: user.id,
      email: user.email,
      balance: balanceMap.get(user.id) ?? 0,
    }));
  }

  async getTransactionsForActor(
    actor: CurrentUserPayload,
    query: TransactionsQueryDto,
    userId?: string,
  ) {
    const userIds = await this.resolveAccessibleUserIds(actor, userId);
    return this.queryTransactions(userIds, query);
  }

  async getTransactionsSummaryForActor(
    actor: CurrentUserPayload,
    query: TransactionsQueryDto,
    userId?: string,
  ): Promise<Record<CreditTransactionType, number>> {
    const userIds = await this.resolveAccessibleUserIds(actor, userId);
    return this.getTransactionsSummary(userIds, query);
  }

  async getTransactionsSummary(
    candidateUserIds: string[],
    query: TransactionsQueryDto,
  ): Promise<Record<CreditTransactionType, number>> {
    const summary = this.emptyTransactionsSummary();
    if (candidateUserIds.length === 0) {
      return summary;
    }

    const userIds = await this.resolveUserIdsForSearch(candidateUserIds, query.search);
    if (userIds.length === 0) {
      return summary;
    }

    const qb = this.creditTransactionRepository
      .createQueryBuilder('tx')
      .select('tx."Type"', 'type')
      .addSelect('SUM(tx."Amount")', 'total')
      .where('tx."UserId" IN (:...userIds)', { userIds })
      .andWhere('tx."IsDeleted" = false')
      .groupBy('tx."Type"');

    if (query.type) {
      qb.andWhere('tx."Type" = :type', { type: query.type });
    }
    if (query.fromDate) {
      qb.andWhere('tx."CreatedDate" >= :fromDate', {
        fromDate: new Date(`${query.fromDate}T00:00:00.000Z`),
      });
    }
    if (query.toDate) {
      qb.andWhere('tx."CreatedDate" <= :toDate', {
        toDate: new Date(`${query.toDate}T23:59:59.999Z`),
      });
    }

    const rows = await qb.getRawMany<{ type: string; total: string }>();
    for (const row of rows) {
      summary[row.type as CreditTransactionType] = Number(row.total);
    }
    return summary;
  }

  private async queryTransactions(
    candidateUserIds: string[],
    query: TransactionsQueryDto,
  ) {
    const { page, limit, search, type, fromDate, toDate } = query;
    if (candidateUserIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const userIds = await this.resolveUserIdsForSearch(candidateUserIds, search);
    if (userIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const where: FindOptionsWhere<CreditTransactionEntity> = {
      userId: In(userIds),
      isDeleted: false,
    };
    if (type) {
      where.type = type;
    }
    const dateFilter = buildDateRangeFilter(fromDate, toDate);
    if (dateFilter) {
      where.createdDate = dateFilter;
    }

    const [items, total] = await this.creditTransactionRepository.findAndCount({
      where,
      order: { createdDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: await this.enrichTransactionsWithUser(items),
      total,
      page,
      limit,
    };
  }

  /**
   * Narrows candidateUserIds to those whose name/email match the search term.
   * Returns candidateUserIds unchanged when no search term is given.
   */
  private async resolveUserIdsForSearch(
    candidateUserIds: string[],
    search?: string,
  ): Promise<string[]> {
    if (!search) {
      return candidateUserIds;
    }
    const matches = await this.userRepository.find({
      where: [
        { id: In(candidateUserIds), name: ILike(`%${search}%`) },
        { id: In(candidateUserIds), email: ILike(`%${search}%`) },
      ],
      select: ['id'],
    });
    return matches.map((user) => user.id);
  }

  private async resolveAccessibleUserIds(
    actor: CurrentUserPayload,
    userId?: string,
  ): Promise<string[]> {
    if (userId) {
      await this.assertCanAccessUser(actor, userId);
      return [userId];
    }
    const accessibleUsers = await this.userRepository.find({
      where: this.buildAccessibleUsersWhere(actor),
      select: ['id'],
    });
    return accessibleUsers.map((user) => user.id);
  }

  private emptyTransactionsSummary(): Record<CreditTransactionType, number> {
    return {
      [CreditTransactionType.TOPUP]: 0,
      [CreditTransactionType.CREDIT]: 0,
      [CreditTransactionType.BET_DEBIT]: 0,
      [CreditTransactionType.WITHDRAW]: 0,
    };
  }

  private async enrichTransactionsWithUser(items: CreditTransactionEntity[]) {
    if (items.length === 0) {
      return [];
    }

    const userIds = [...new Set(items.map((item) => item.userId))];
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    });
    const userById = new Map(users.map((user) => [user.id, user]));

    return items.map((item) => ({
      ...item,
      userName: userById.get(item.userId)?.name ?? '',
      userEmail: userById.get(item.userId)?.email ?? '',
    }));
  }

  /**
   * Superadmin can access anyone. Admin can only access users they
   * personally created (UserIdentityTbl.createdBy), and never superadmins.
   */
  private async assertCanAccessUser(
    actor: CurrentUserPayload,
    targetUserId: string,
  ): Promise<UserIdentityEntity> {
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }
    if (actor.roles.includes(RoleName.SUPER_ADMIN)) {
      return targetUser;
    }
    if (actor.roles.includes(RoleName.ADMIN)) {
      const targetRoles = await this.roleService.getRoleNamesForUser(
        targetUser.id,
      );
      const isTargetSuperAdmin = targetRoles.includes(RoleName.SUPER_ADMIN);
      if (!isTargetSuperAdmin && targetUser.createdBy === actor.email) {
        return targetUser;
      }
    }
    throw new NotFoundException('User not found');
  }

  private buildAccessibleUsersWhere(
    actor: CurrentUserPayload,
  ): FindOptionsWhere<UserIdentityEntity> {
    if (actor.roles.includes(RoleName.SUPER_ADMIN)) {
      return {};
    }
    return { createdBy: actor.email };
  }
}
