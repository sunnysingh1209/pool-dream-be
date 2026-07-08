import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

export interface GameResultWinnerRecord {
    userId: string;
    name: string;
    email: string;
    winningAmount: number;
    betIds: string[];
}

@Entity({ name: 'GameResultTbl' })
export class GameResultEntity extends EntityBase {

    @Index()
    @Column({ name: 'GameType', length: 30, type: 'character varying' })
    gameType: string = "";

    @Index()
    @Column({ name: 'GameSubType', length: 30, type: 'character varying' })
    gameSubType: string = "";

    @Column({ name: 'WinningNumber', type: 'smallint' })
    winningNumber: number = 0;

    @Column({ name: 'SettledBetCount', type: 'integer', default: 0 })
    settledBetCount: number = 0;

    @Column({ name: 'Winners', type: 'jsonb', default: () => "'[]'" })
    winners: GameResultWinnerRecord[] = [];
}
