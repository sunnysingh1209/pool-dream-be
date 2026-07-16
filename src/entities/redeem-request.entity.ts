import { Column, Entity, Index } from "typeorm";
import { RedeemRequestStatus } from "../common/enums/redeem-request-status.enum";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'RedeemRequestTbl' })
export class RedeemRequestEntity extends EntityBase {

    @Index()
    @Column({ name: 'UserId', type: 'uuid' })
    userId: string = "";

    @Column({ name: 'Amount', type: 'integer' })
    amount: number = 0;

    @Column({ name: 'Remarks', length: 255, type: 'character varying', nullable: true })
    remarks?: string;

    @Index()
    @Column({ name: 'Status', length: 20, type: 'character varying', default: RedeemRequestStatus.PENDING })
    status: RedeemRequestStatus = RedeemRequestStatus.PENDING;

    @Column({ name: 'ReviewedBy', length: 150, type: 'character varying', nullable: true })
    reviewedBy?: string;

    @Column({ name: 'ReviewedDate', type: 'timestamptz', nullable: true })
    reviewedDate?: Date;

    @Column({ name: 'ReviewRemarks', length: 255, type: 'character varying', nullable: true })
    reviewRemarks?: string;
}
