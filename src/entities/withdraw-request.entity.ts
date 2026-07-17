import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'WithdrawRequestTbl' })
export class WithdrawRequestEntity extends EntityBase {

    @Index()
    @Column({ name: 'UserId', type: 'uuid' })
    userId: string = "";

    @Column({ name: 'Amount', type: 'integer' })
    amount: number = 0;

    @Column({ name: 'Remarks', length: 255, type: 'character varying', nullable: true })
    remarks?: string;
}
