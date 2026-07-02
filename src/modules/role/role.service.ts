import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { RoleEntity } from '../../entities/role.entity';
import { UserRoleEntity } from '../../entities/user-role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  async assignRole(
    userId: string,
    roleName: RoleName,
    assignedBy: string,
  ): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!role) {
      throw new InternalServerErrorException(
        `Role '${roleName}' is not seeded`,
      );
    }

    const userRole = this.userRoleRepository.create({
      userId,
      roleId: role.id,
      createdBy: assignedBy,
    });
    await this.userRoleRepository.save(userRole);
  }

  async getRoleNamesForUser(userId: string): Promise<string[]> {
    const roleMap = await this.getRoleNamesForUsers([userId]);
    return roleMap.get(userId) ?? [];
  }

  async getRoleNamesForUsers(
    userIds: string[],
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (userIds.length === 0) {
      return result;
    }

    const userRoles = await this.userRoleRepository.find({
      where: { userId: In(userIds) },
    });
    if (userRoles.length === 0) {
      return result;
    }

    const roles = await this.roleRepository.find({
      where: { id: In([...new Set(userRoles.map((ur) => ur.roleId))]) },
    });
    const roleNameById = new Map(roles.map((role) => [role.id, role.name]));

    for (const userRole of userRoles) {
      const names = result.get(userRole.userId) ?? [];
      names.push(roleNameById.get(userRole.roleId) ?? 'unknown');
      result.set(userRole.userId, names);
    }
    return result;
  }
}
