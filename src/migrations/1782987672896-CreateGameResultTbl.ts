import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGameResultTbl1782987672896 implements MigrationInterface {
    name = 'CreateGameResultTbl1782987672896';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "GameResultTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "GameType" character varying(30) NOT NULL,
                "WinningNumber" smallint NOT NULL,
                "SettledBetCount" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_GameResultTbl_Id" PRIMARY KEY ("Id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_GameResultTbl_GameType" ON "GameResultTbl" ("GameType")`);
        await queryRunner.query(`CREATE INDEX "IDX_GameResultTbl_CreatedDate" ON "GameResultTbl" ("CreatedDate")`);

        await queryRunner.query(`ALTER TABLE "GameBetTbl" ADD "ResultId" uuid`);
        await queryRunner.query(`ALTER TABLE "GameBetTbl" ADD CONSTRAINT "FK_GameBetTbl_ResultId" FOREIGN KEY ("ResultId") REFERENCES "GameResultTbl" ("Id") ON DELETE SET NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_GameBetTbl_ResultId" ON "GameBetTbl" ("ResultId")`);
        await queryRunner.query(`CREATE INDEX "IDX_GameBetTbl_GameType_ResultId" ON "GameBetTbl" ("GameType", "ResultId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_GameBetTbl_GameType_ResultId"`);
        await queryRunner.query(`DROP INDEX "IDX_GameBetTbl_ResultId"`);
        await queryRunner.query(`ALTER TABLE "GameBetTbl" DROP CONSTRAINT "FK_GameBetTbl_ResultId"`);
        await queryRunner.query(`ALTER TABLE "GameBetTbl" DROP COLUMN "ResultId"`);

        await queryRunner.query(`DROP INDEX "IDX_GameResultTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_GameResultTbl_GameType"`);
        await queryRunner.query(`DROP TABLE "GameResultTbl"`);
    }
}
