import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'GameResultTbl' })
export class GameResultEntity extends EntityBase {

    @Index()
    @Column({ name: 'GameType', length: 30, type: 'character varying' })
    gameType: string = "";

    @Column({ name: 'WinningNumber', type: 'smallint' })
    winningNumber: number = 0;

    @Column({ name: 'SettledBetCount', type: 'integer', default: 0 })
    settledBetCount: number = 0;
}
