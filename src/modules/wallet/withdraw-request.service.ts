import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { buildDateRangeFilter } from '../../common/utils/date-range.util';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { WithdrawRequestEntity } from '../../entities/withdraw-request.entity';
import { CreateWithdrawRequestDto } from './dto/create-withdraw-request.dto';
import { ListWithdrawRequestsQueryDto } from './dto/list-withdraw-requests-query.dto';
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

  async listAll(query: ListWithdrawRequestsQueryDto, userId?: string) {
    const { page, limit, search, fromDate, toDate } = query;

    const where: FindOptionsWhere<WithdrawRequestEntity> = {};
    if (userId) {
      where.userId = userId;
    }

    if (search) {
      const userIdFilter: FindOptionsWhere<UserIdentityEntity> = userId ? { id: userId } : {};
      const matches = await this.userRepository.find({
        where: [
          { ...userIdFilter, name: ILike(`%${search}%`) },
          { ...userIdFilter, email: ILike(`%${search}%`) },
        ],
        select: ['id'],
      });
      const searchedUserIds = matches.map((user) => user.id);
      if (searchedUserIds.length === 0) {
        return { items: [], total: 0, page, limit };
      }
      where.userId = In(searchedUserIds);
    }

    const dateFilter = buildDateRangeFilter(fromDate, toDate);
    if (dateFilter) {
      where.createdDate = dateFilter;
    }

    const [items, total] = await this.withdrawRequestRepository.findAndCount({
      where,
      order: { createdDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: await this.enrichWithUser(items),
      total,
      page,
      limit,
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
