import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { PasswordHashService } from '../../infrastructure/common/password.service';
import { RoleService } from '../role/role.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserListItemDto } from './dto/user-list-item.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserIdentityEntity)
    private readonly userRepository: Repository<UserIdentityEntity>,
    private readonly roleService: RoleService,
    private readonly walletService: WalletService,
  ) {}

  async listUsers(pagination: PaginationQueryDto, excludeUserId: string) {
    const [users, total] = await this.userRepository.findAndCount({
      where: { id: Not(excludeUserId) },
      order: { createdDate: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    const userIds = users.map((user) => user.id);
    const [roleMap, balanceMap] = await Promise.all([
      this.roleService.getRoleNamesForUsers(userIds),
      this.walletService.getBalances(userIds),
    ]);

    return {
      items: users.map((user) =>
        this.toListItem(
          user,
          roleMap.get(user.id) ?? [],
          balanceMap.get(user.id) ?? 0,
        ),
      ),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async createUser(
    actorEmail: string,
    dto: CreateUserDto,
  ): Promise<UserListItemDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      passwordHash: PasswordHashService.hashPassword(dto.password),
      createdBy: actorEmail,
    });
    const savedUser = await this.userRepository.save(user);
    await this.roleService.assignRole(savedUser.id, dto.role, actorEmail);
    await this.walletService.createWalletForUser(savedUser.id, actorEmail);

    return this.toListItem(savedUser, [dto.role], 0);
  }

  async setLockStatus(
    actorEmail: string,
    userId: string,
    isLocked: boolean,
  ): Promise<UserListItemDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isLocked = isLocked;
    user.isActive = !isLocked;
    user.updatedBy = actorEmail;
    const savedUser = await this.userRepository.save(user);

    const [roles, balance] = await Promise.all([
      this.roleService.getRoleNamesForUser(savedUser.id),
      this.walletService.getBalance(savedUser.id),
    ]);

    return this.toListItem(savedUser, roles, balance);
  }

  private toListItem(
    user: UserIdentityEntity,
    roles: string[],
    creditBalance: number,
  ): UserListItemDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      isLocked: user.isLocked,
      roles,
      creditBalance,
      createdDate: user.createdDate,
    };
  }
}
