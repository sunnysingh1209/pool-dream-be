import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async listUsers(pagination: PaginationQueryDto) {
    const [users, total] = await this.userRepository.findAndCount({
      order: { createdDate: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    const roleMap = await this.roleService.getRoleNamesForUsers(
      users.map((user) => user.id),
    );

    return {
      items: users.map((user) =>
        this.toListItem(user, roleMap.get(user.id) ?? []),
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

    return this.toListItem(savedUser, [dto.role]);
  }

  private toListItem(
    user: UserIdentityEntity,
    roles: string[],
  ): UserListItemDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      isLocked: user.isLocked,
      roles,
      createdDate: user.createdDate,
    };
  }
}
