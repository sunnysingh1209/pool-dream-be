import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, In, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { RoleName } from '../../common/enums/role.enum';
import { CreditTransactionEntity } from '../../entities/credit-transaction.entity';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { WalletEntity } from '../../entities/wallet.entity';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RoleService } from '../role/role.service';

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

  async topUp(
    userId: string,
    amount: number,
    performedBy: string,
    remarks?: string,
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      await this.createWalletForUser(userId, performedBy, manager);

      const walletRepo = manager.getRepository(WalletEntity);
      await walletRepo.increment({ userId }, 'balance', amount);
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

      return wallet.balance;
    });
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

  async getTransactions(userId: string, pagination: PaginationQueryDto) {
    const [items, total] = await this.creditTransactionRepository.findAndCount({
      where: { userId },
      order: { createdDate: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    return {
      items: await this.enrichTransactionsWithUser(items),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
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
    pagination: PaginationQueryDto,
    userId?: string,
  ) {
    if (userId) {
      await this.assertCanAccessUser(actor, userId);
      return this.getTransactions(userId, pagination);
    }

    const accessibleUsers = await this.userRepository.find({
      where: this.buildAccessibleUsersWhere(actor),
      select: ['id'],
    });
    const userIds = accessibleUsers.map((user) => user.id);
    if (userIds.length === 0) {
      return { items: [], total: 0, page: pagination.page, limit: pagination.limit };
    }

    const [items, total] = await this.creditTransactionRepository.findAndCount({
      where: { userId: In(userIds) },
      order: { createdDate: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    return {
      items: await this.enrichTransactionsWithUser(items),
      total,
      page: pagination.page,
      limit: pagination.limit,
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
