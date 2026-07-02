import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'UserRoleTbl' })
@Index(['userId', 'roleId'], { unique: true })
export class UserRoleEntity extends EntityBase {

    @Index()
    @Column({ name: 'UserId', type: 'uuid' })
    userId: string = "";

    @Index()
    @Column({ name: 'RoleId', type: 'uuid' })
    roleId: string = "";
}
