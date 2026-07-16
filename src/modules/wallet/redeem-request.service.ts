import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { RedeemRequestStatus } from '../../common/enums/redeem-request-status.enum';
import { RedeemRequestEntity } from '../../entities/redeem-request.entity';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { CreateRedeemRequestDto } from './dto/create-redeem-request.dto';
import { WalletService } from './wallet.service';

@Injectable()
export class RedeemRequestService {
  constructor(
    @InjectRepository(RedeemRequestEntity)
    private readonly redeemRequestRepository: Repository<RedeemRequestEntity>,
    @InjectRepository(UserIdentityEntity)
    private readonly userRepository: Repository<UserIdentityEntity>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  async createRequest(
    userId: string,
    userEmail: string,
    dto: CreateRedeemRequestDto,
  ): Promise<RedeemRequestEntity> {
    const currentBalance = await this.walletService.getBalance(userId);
    const pendingAmount = await this.getPendingAmount(userId);
    const available = currentBalance - pendingAmount;

    if (dto.amount > available) {
      throw new BadRequestException(
        `Redeem amount exceeds available wallet balance (available: ${available})`,
      );
    }

    const request = this.redeemRequestRepository.create({
      userId,
      amount: dto.amount,
      remarks: dto.remarks,
      status: RedeemRequestStatus.PENDING,
      createdBy: userEmail,
    });
    return this.redeemRequestRepository.save(request);
  }

  async listMyRequests(userId: string, pagination: PaginationQueryDto) {
    const [items, total] = await this.redeemRequestRepository.findAndCount({
      where: { userId },
      order: { createdDate: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  async listAllRequests(
    pagination: PaginationQueryDto,
    status?: RedeemRequestStatus,
  ) {
    const [items, total] = await this.redeemRequestRepository.findAndCount({
      where: status ? { status } : {},
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

  async approve(id: string, adminEmail: string): Promise<RedeemRequestEntity> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RedeemRequestEntity);
      const request = await repo.findOne({ where: { id } });
      if (!request) {
        throw new NotFoundException('Redeem request not found');
      }
      if (request.status !== RedeemRequestStatus.PENDING) {
        throw new BadRequestException('Redeem request has already been reviewed');
      }

      // Atomic balance check — re-verifies funds are still available even
      // if the user's balance dropped (e.g. new bets) since the request was
      // raised, guaranteeing the user can never redeem more than they have.
      await this.walletService.debit(
        request.userId,
        request.amount,
        request.id,
        adminEmail,
        manager,
        CreditTransactionType.REDEEM,
      );

      request.status = RedeemRequestStatus.APPROVED;
      request.reviewedBy = adminEmail;
      request.reviewedDate = new Date();
      request.updatedBy = adminEmail;
      return repo.save(request);
    });
  }

  async reject(
    id: string,
    adminEmail: string,
    remarks?: string,
  ): Promise<RedeemRequestEntity> {
    const request = await this.redeemRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Redeem request not found');
    }
    if (request.status !== RedeemRequestStatus.PENDING) {
      throw new BadRequestException('Redeem request has already been reviewed');
    }

    request.status = RedeemRequestStatus.REJECTED;
    request.reviewedBy = adminEmail;
    request.reviewedDate = new Date();
    request.reviewRemarks = remarks;
    request.updatedBy = adminEmail;
    return this.redeemRequestRepository.save(request);
  }

  private async getPendingAmount(userId: string): Promise<number> {
    const [row] = await this.dataSource.query(
      `SELECT COALESCE(SUM("Amount"), 0)::int AS "total"
       FROM "RedeemRequestTbl"
       WHERE "UserId" = $1 AND "Status" = $2`,
      [userId, RedeemRequestStatus.PENDING],
    );
    return Number(row?.total ?? 0);
  }

  private async enrichWithUser(items: RedeemRequestEntity[]) {
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
