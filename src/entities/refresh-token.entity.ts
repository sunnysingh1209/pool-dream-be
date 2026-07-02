import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'RefreshTokenTbl' })
export class RefreshTokenEntity extends EntityBase {

    @Index()
    @Column({ name: 'UserId', type: 'uuid' })
    userId: string = "";

    @Index({ unique: true })
    @Column({ name: 'TokenHash', length: 255, type: 'character varying' })
    tokenHash: string = "";

    @Column({ name: 'ExpiresAt', type: 'timestamptz' })
    expiresAt!: Date;

    @Column({ name: 'RevokedAt', type: 'timestamptz', nullable: true })
    revokedAt?: Date;
}
