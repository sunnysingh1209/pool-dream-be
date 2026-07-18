import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'UserWalletTbl' })
export class WalletEntity extends EntityBase {

    @Index({ unique: true })
    @Column({ name: 'UserId', type: 'uuid' })
    userId: string = "";

    @Column({ name: 'Balance', type: 'integer', default: 0 })
    balance: number = 0;

    @Column({
        name: 'CreditReference',
        type: 'numeric',
        precision: 12,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value?: number) => value,
            from: (value: string | null) => (value === null ? null : Number(value)),
        },
    })
    creditReference?: number | null;

    @Column({ name: 'LastCreditRefUpdate', type: 'timestamptz', nullable: true })
    lastCreditRefUpdate?: Date;
}
