import { Column, Entity, Index } from "typeorm";
import { GameSubType } from "../common/enums/game-sub-type.enum";
import { EntityBase } from "../infrastructure/base/entity-base.entity";

@Entity({ name: 'GameSubTypeTbl' })
export class GameSubTypeEntity extends EntityBase {

    @Index({ unique: true })
    @Column({ name: 'Name', length: 30, type: 'character varying' })
    name: GameSubType = GameSubType.DELHI_BAZAR;

    @Column({ name: 'DisplayName', length: 50, type: 'character varying' })
    displayName: string = "";

    @Column({ name: 'CloseTime', type: 'time' })
    closeTime: string = "";

    @Column({ name: 'IsActive', type: 'boolean', default: true })
    isActive: boolean = true;
}
