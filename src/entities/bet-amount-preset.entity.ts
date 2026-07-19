import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'BetAmountPresetTbl' })
@Index(['userId', 'amount'], { unique: true })
export class BetAmountPresetEntity extends EntityBase {

    @Index()
    @Column({ name: 'UserId', type: 'uuid' })
    userId: string = "";

    @Column({ name: 'Amount', type: 'integer' })
    amount: number = 0;
}
