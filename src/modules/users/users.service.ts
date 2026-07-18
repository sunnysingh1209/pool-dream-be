import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { WalletEntity } from '../../entities/wallet.entity';
import { PasswordHashService } from '../../infrastructure/common/password.service';
import { RoleService } from '../role/role.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-password.dto';
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
    const [roleMap, walletMap] = await Promise.all([
      this.roleService.getRoleNamesForUsers(userIds),
      this.walletService.getWallets(userIds),
    ]);

    return {
      items: users.map((user) =>
        this.toListItem(user, roleMap.get(user.id) ?? [], walletMap.get(user.id)),
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
    const wallet = await this.walletService.createWalletForUser(savedUser.id, actorEmail);

    return this.toListItem(savedUser, [dto.role], wallet);
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

    const [roles, wallet] = await Promise.all([
      this.roleService.getRoleNamesForUser(savedUser.id),
      this.walletService.getWallet(savedUser.id),
    ]);

    return this.toListItem(savedUser, roles, wallet ?? undefined);
  }

  async resetPassword(
    actorEmail: string,
    userId: string,
    dto: ResetUserPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.passwordHash = PasswordHashService.hashPassword(dto.newPassword);
    user.updatedBy = actorEmail;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully' };
  }

  private toListItem(
    user: UserIdentityEntity,
    roles: string[],
    wallet?: WalletEntity,
  ): UserListItemDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      isLocked: user.isLocked,
      roles,
      creditBalance: wallet?.balance ?? 0,
      creditReference: wallet?.creditReference ?? null,
      lastCreditRefUpdate: wallet?.lastCreditRefUpdate ?? null,
      createdDate: user.createdDate,
    };
  }
}
