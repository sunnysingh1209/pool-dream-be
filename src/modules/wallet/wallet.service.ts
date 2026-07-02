import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { CreditTransactionEntity } from '../../entities/credit-transaction.entity';
import { WalletEntity } from '../../entities/wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(CreditTransactionEntity)
    private readonly creditTransactionRepository: Repository<CreditTransactionEntity>,
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

  async debit(
    userId: string,
    amount: number,
    referenceId: string,
    performedBy: string,
    manager: EntityManager,
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
        type: CreditTransactionType.BET_DEBIT,
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
    return { items, total, page: pagination.page, limit: pagination.limit };
  }
}
