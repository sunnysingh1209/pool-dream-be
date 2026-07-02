import { BeforeUpdate, Column, CreateDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ITable } from "./itable.entity";

export abstract class EntityBase implements ITable {

    @PrimaryGeneratedColumn('uuid', { name: 'Id' })
    id!: string;

    @Column( { name: "CreatedBy", length: 150, type: 'character varying'  })
    createdBy: string = "";

    @CreateDateColumn({
        name: 'CreatedDate',
        type: 'timestamptz',
    })
    @Index()
    createdDate!: Date;

    @Column( { name: "UpdatedBy", length: 150, nullable: true , type: 'character varying' })
    updatedBy?: string;

    @UpdateDateColumn({
        name: 'UpdatedDate',
        type: 'timestamptz',
        nullable: true
    })
    updatedDate?: Date;

    @Column('boolean', { name: 'IsDeleted', default: false })
    isDeleted: boolean = false;
}
