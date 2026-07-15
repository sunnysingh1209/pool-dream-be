import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnderBaharTagToGameBetNumberTbl1784115391157 implements MigrationInterface {
    name = 'AddAnderBaharTagToGameBetNumberTbl1784115391157';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "GameBetNumberTbl" ADD "AnderBaharDigit" smallint`);
        await queryRunner.query(`ALTER TABLE "GameBetNumberTbl" ADD "AnderBaharPosition" character varying(10)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "GameBetNumberTbl" DROP COLUMN "AnderBaharPosition"`);
        await queryRunner.query(`ALTER TABLE "GameBetNumberTbl" DROP COLUMN "AnderBaharDigit"`);
    }
}
