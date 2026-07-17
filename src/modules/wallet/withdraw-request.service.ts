import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { WithdrawRequestEntity } from '../../entities/withdraw-request.entity';
import { CreateWithdrawRequestDto } from './dto/create-withdraw-request.dto';
import { WalletService } from './wallet.service';

@Injectable()
export class WithdrawRequestService {
  constructor(
    @InjectRepository(WithdrawRequestEntity)
    private readonly withdrawRequestRepository: Repository<WithdrawRequestEntity>,
    @InjectRepository(UserIdentityEntity)
    private readonly userRepository: Repository<UserIdentityEntity>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Superadmin-only: withdraws directly from a user's wallet on their
   * behalf. There is no separate approval step — raising this request IS
   * the withdrawal, so it debits the wallet immediately (atomically
   * balance-checked via WalletService.debit, same guard used for bets).
   */
  async create(
    adminEmail: string,
    dto: CreateWithdrawRequestDto,
  ): Promise<WithdrawRequestEntity> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(WithdrawRequestEntity);
      const request = await repo.save(
        repo.create({
          userId: dto.userId,
          amount: dto.amount,
          remarks: dto.remarks,
          createdBy: adminEmail,
        }),
      );

      await this.walletService.debit(
        dto.userId,
        dto.amount,
        request.id,
        adminEmail,
        manager,
        CreditTransactionType.WITHDRAW,
      );

      return request;
    });
  }

  async listAll(pagination: PaginationQueryDto, userId?: string) {
    const [items, total] = await this.withdrawRequestRepository.findAndCount({
      where: userId ? { userId } : {},
      order: { createdDate: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    return {
      items: await this.enrichWithUser(items),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  private async enrichWithUser(items: WithdrawRequestEntity[]) {
    if (items.length === 0) {
      return [];
    }
    const userIds = [...new Set(items.map((item) => item.userId))];
    const users = await this.userRepository.find({ where: { id: In(userIds) } });
    const userById = new Map(users.map((user) => [user.id, user]));

    return items.map((item) => ({
      ...item,
      userName: userById.get(item.userId)?.name ?? '',
      userEmail: userById.get(item.userId)?.email ?? '',
    }));
  }
}
