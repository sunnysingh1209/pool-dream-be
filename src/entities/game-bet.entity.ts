import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'GameBetTbl' })
export class GameBetEntity extends EntityBase {

    @Index()
    @Column({ name: 'UserId', type: 'uuid' })
    userId: string = "";

    @Column({ name: 'GameType', length: 30, type: 'character varying' })
    gameType: string = "";

    @Column({ name: 'TotalAmount', type: 'integer' })
    totalAmount: number = 0;
}
