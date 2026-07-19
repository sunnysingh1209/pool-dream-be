import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBetAmountPresetTbl1784432790238 implements MigrationInterface {
    name = 'CreateBetAmountPresetTbl1784432790238';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "BetAmountPresetTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "UserId" uuid NOT NULL,
                "Amount" integer NOT NULL,
                CONSTRAINT "PK_BetAmountPresetTbl_Id" PRIMARY KEY ("Id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_BetAmountPresetTbl_UserId" ON "BetAmountPresetTbl" ("UserId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_BetAmountPresetTbl_UserId_Amount" ON "BetAmountPresetTbl" ("UserId", "Amount")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_BetAmountPresetTbl_UserId_Amount"`);
        await queryRunner.query(`DROP INDEX "IDX_BetAmountPresetTbl_UserId"`);
        await queryRunner.query(`DROP TABLE "BetAmountPresetTbl"`);
    }
}
