import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'GameBetNumberTbl' })
export class GameBetNumberEntity extends EntityBase {

    @Index()
    @Column({ name: 'BetId', type: 'uuid' })
    betId: string = "";

    @Column({ name: 'Number', type: 'smallint' })
    number: number = 0;

    @Column({ name: 'Amount', type: 'integer' })
    amount: number = 0;

    @Column({ name: 'IsHaruf', type: 'boolean', default: false })
    isHaruf: boolean = false;
}
