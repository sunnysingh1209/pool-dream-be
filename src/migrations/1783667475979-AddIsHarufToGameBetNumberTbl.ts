import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsHarufToGameBetNumberTbl1783667475979 implements MigrationInterface {
    name = 'AddIsHarufToGameBetNumberTbl1783667475979';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "GameBetNumberTbl" ADD "IsHaruf" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "GameBetNumberTbl" DROP COLUMN "IsHaruf"`);
    }
}
