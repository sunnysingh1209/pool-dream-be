import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'UserIdentityTbl' })
export class UserIdentityEntity extends EntityBase {

    @Column({ name: 'Name', length: 150, type: 'character varying' })
    name: string = "";

    @Index({ unique: true })
    @Column({ name: 'Email', length: 255, type: 'character varying' })
    email: string = "";

    @Column({ name: 'PasswordHash', length: 255, type: 'character varying' })
    passwordHash: string = "";

    @Column({ name: 'PhoneNumber', length: 20, type: 'character varying', nullable: true })
    phoneNumber?: string;

    @Column({ name: 'IsActive', type: 'boolean', default: true })
    isActive: boolean = true;

    @Column({ name: 'IsLocked', type: 'boolean', default: false })
    isLocked: boolean = false;
}
