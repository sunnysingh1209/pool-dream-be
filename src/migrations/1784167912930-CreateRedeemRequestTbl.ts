import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRedeemRequestTbl1784167912930 implements MigrationInterface {
    name = 'CreateRedeemRequestTbl1784167912930';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "RedeemRequestTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "UserId" uuid NOT NULL,
                "Amount" integer NOT NULL,
                "Remarks" character varying(255),
                "Status" character varying(20) NOT NULL DEFAULT 'pending',
                "ReviewedBy" character varying(150),
                "ReviewedDate" TIMESTAMPTZ,
                "ReviewRemarks" character varying(255),
                CONSTRAINT "PK_RedeemRequestTbl_Id" PRIMARY KEY ("Id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_RedeemRequestTbl_UserId" ON "RedeemRequestTbl" ("UserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_RedeemRequestTbl_Status" ON "RedeemRequestTbl" ("Status")`);
        await queryRunner.query(`CREATE INDEX "IDX_RedeemRequestTbl_CreatedDate" ON "RedeemRequestTbl" ("CreatedDate")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_RedeemRequestTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_RedeemRequestTbl_Status"`);
        await queryRunner.query(`DROP INDEX "IDX_RedeemRequestTbl_UserId"`);
        await queryRunner.query(`DROP TABLE "RedeemRequestTbl"`);
    }
}
