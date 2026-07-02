import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWalletAndGameTbl1782977450908 implements MigrationInterface {
    name = 'CreateWalletAndGameTbl1782977450908';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "UserWalletTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "UserId" uuid NOT NULL,
                "Balance" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_UserWalletTbl_Id" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_UserWalletTbl_UserId" FOREIGN KEY ("UserId") REFERENCES "UserIdentityTbl" ("Id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_UserWalletTbl_UserId" ON "UserWalletTbl" ("UserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_UserWalletTbl_CreatedDate" ON "UserWalletTbl" ("CreatedDate")`);

        await queryRunner.query(`
            CREATE TABLE "CreditTransactionTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "UserId" uuid NOT NULL,
                "Type" character varying(20) NOT NULL,
                "Amount" integer NOT NULL,
                "BalanceAfter" integer NOT NULL,
                "ReferenceId" uuid,
                "Remarks" character varying(255),
                CONSTRAINT "PK_CreditTransactionTbl_Id" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_CreditTransactionTbl_UserId" FOREIGN KEY ("UserId") REFERENCES "UserIdentityTbl" ("Id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_CreditTransactionTbl_UserId" ON "CreditTransactionTbl" ("UserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_CreditTransactionTbl_CreatedDate" ON "CreditTransactionTbl" ("CreatedDate")`);

        await queryRunner.query(`
            CREATE TABLE "GameBetTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "UserId" uuid NOT NULL,
                "GameType" character varying(30) NOT NULL,
                "TotalAmount" integer NOT NULL,
                CONSTRAINT "PK_GameBetTbl_Id" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_GameBetTbl_UserId" FOREIGN KEY ("UserId") REFERENCES "UserIdentityTbl" ("Id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_GameBetTbl_UserId" ON "GameBetTbl" ("UserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_GameBetTbl_CreatedDate" ON "GameBetTbl" ("CreatedDate")`);

        await queryRunner.query(`
            CREATE TABLE "GameBetNumberTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "BetId" uuid NOT NULL,
                "Number" smallint NOT NULL,
                "Amount" integer NOT NULL,
                CONSTRAINT "PK_GameBetNumberTbl_Id" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_GameBetNumberTbl_BetId" FOREIGN KEY ("BetId") REFERENCES "GameBetTbl" ("Id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_GameBetNumberTbl_BetId" ON "GameBetNumberTbl" ("BetId")`);
        await queryRunner.query(`CREATE INDEX "IDX_GameBetNumberTbl_CreatedDate" ON "GameBetNumberTbl" ("CreatedDate")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_GameBetNumberTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_GameBetNumberTbl_BetId"`);
        await queryRunner.query(`DROP TABLE "GameBetNumberTbl"`);

        await queryRunner.query(`DROP INDEX "IDX_GameBetTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_GameBetTbl_UserId"`);
        await queryRunner.query(`DROP TABLE "GameBetTbl"`);

        await queryRunner.query(`DROP INDEX "IDX_CreditTransactionTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_CreditTransactionTbl_UserId"`);
        await queryRunner.query(`DROP TABLE "CreditTransactionTbl"`);

        await queryRunner.query(`DROP INDEX "IDX_UserWalletTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_UserWalletTbl_UserId"`);
        await queryRunner.query(`DROP TABLE "UserWalletTbl"`);
    }
}
