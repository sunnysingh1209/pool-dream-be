import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'UserWalletTbl' })
export class WalletEntity extends EntityBase {

    @Index({ unique: true })
    @Column({ name: 'UserId', type: 'uuid' })
    userId: string = "";

    @Column({ name: 'Balance', type: 'integer', default: 0 })
    balance: number = 0;
}
