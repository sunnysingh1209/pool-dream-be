import { Column, Entity, Index } from "typeorm";
import { AnderBaharPosition } from "../common/enums/ander-bahar-position.enum";
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

    @Column({ name: 'AnderBaharDigit', type: 'smallint', nullable: true })
    anderBaharDigit?: number;

    @Column({ name: 'AnderBaharPosition', length: 10, type: 'character varying', nullable: true })
    anderBaharPosition?: AnderBaharPosition;
}
