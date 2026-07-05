import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWinnersToGameResultTbl1783228362076 implements MigrationInterface {
    name = 'AddWinnersToGameResultTbl1783228362076';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "GameResultTbl" ADD "Winners" jsonb NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "GameResultTbl" DROP COLUMN "Winners"`);
    }
}
