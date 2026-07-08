import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGameSubTypeTbl1783495792463 implements MigrationInterface {
    name = 'CreateGameSubTypeTbl1783495792463';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "GameSubTypeTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "Name" character varying(30) NOT NULL,
                "DisplayName" character varying(50) NOT NULL,
                "CloseTime" time NOT NULL,
                "IsActive" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_GameSubTypeTbl_Id" PRIMARY KEY ("Id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_GameSubTypeTbl_Name" ON "GameSubTypeTbl" ("Name")`);
        await queryRunner.query(`CREATE INDEX "IDX_GameSubTypeTbl_CreatedDate" ON "GameSubTypeTbl" ("CreatedDate")`);

        await queryRunner.query(`
            INSERT INTO "GameSubTypeTbl" ("CreatedBy", "Name", "DisplayName", "CloseTime") VALUES
                ('system', 'delhi_bazar', 'Delhi Bazar', '14:40:00'),
                ('system', 'shree_ganesh', 'Shree Ganesh', '16:15:00'),
                ('system', 'faridabad', 'Faridabad', '17:45:00'),
                ('system', 'gaziabad', 'Gaziabad', '21:00:00'),
                ('system', 'gali', 'Gali', '23:00:00'),
                ('system', 'disawer', 'Disawer', '03:30:00')
        `);

        await queryRunner.query(`ALTER TABLE "GameBetTbl" ADD "GameSubType" character varying(30)`);
        await queryRunner.query(`UPDATE "GameBetTbl" SET "GameSubType" = 'delhi_bazar' WHERE "GameSubType" IS NULL`);
        await queryRunner.query(`ALTER TABLE "GameBetTbl" ALTER COLUMN "GameSubType" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_GameBetTbl_GameSubType" ON "GameBetTbl" ("GameSubType")`);

        await queryRunner.query(`ALTER TABLE "GameResultTbl" ADD "GameSubType" character varying(30)`);
        await queryRunner.query(`UPDATE "GameResultTbl" SET "GameSubType" = 'delhi_bazar' WHERE "GameSubType" IS NULL`);
        await queryRunner.query(`ALTER TABLE "GameResultTbl" ALTER COLUMN "GameSubType" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_GameResultTbl_GameSubType" ON "GameResultTbl" ("GameSubType")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_GameResultTbl_GameSubType"`);
        await queryRunner.query(`ALTER TABLE "GameResultTbl" DROP COLUMN "GameSubType"`);

        await queryRunner.query(`DROP INDEX "IDX_GameBetTbl_GameSubType"`);
        await queryRunner.query(`ALTER TABLE "GameBetTbl" DROP COLUMN "GameSubType"`);

        await queryRunner.query(`DROP INDEX "IDX_GameSubTypeTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_GameSubTypeTbl_Name"`);
        await queryRunner.query(`DROP TABLE "GameSubTypeTbl"`);
    }
}
