import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'CreditTransactionTbl' })
export class CreditTransactionEntity extends EntityBase {

    @Index()
    @Column({ name: 'UserId', type: 'uuid' })
    userId: string = "";

    @Column({ name: 'Type', length: 20, type: 'character varying' })
    type: string = "";

    @Column({ name: 'Amount', type: 'integer' })
    amount: number = 0;

    @Column({ name: 'BalanceAfter', type: 'integer' })
    balanceAfter: number = 0;

    @Column({ name: 'ReferenceId', type: 'uuid', nullable: true })
    referenceId?: string;

    @Column({ name: 'Remarks', length: 255, type: 'character varying', nullable: true })
    remarks?: string;
}
