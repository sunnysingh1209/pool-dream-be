import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'RoleTbl' })
export class RoleEntity extends EntityBase {

    @Index({ unique: true })
    @Column({ name: 'Name', length: 50, type: 'character varying' })
    name: string = "";
}
