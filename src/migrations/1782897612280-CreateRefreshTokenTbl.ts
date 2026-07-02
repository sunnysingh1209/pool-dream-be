import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshTokenTbl1782897612280 implements MigrationInterface {
    name = 'CreateRefreshTokenTbl1782897612280';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "RefreshTokenTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "UserId" uuid NOT NULL,
                "TokenHash" character varying(255) NOT NULL,
                "ExpiresAt" TIMESTAMPTZ NOT NULL,
                "RevokedAt" TIMESTAMPTZ,
                CONSTRAINT "PK_RefreshTokenTbl_Id" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_RefreshTokenTbl_UserId" FOREIGN KEY ("UserId") REFERENCES "UserIdentityTbl" ("Id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_RefreshTokenTbl_UserId" ON "RefreshTokenTbl" ("UserId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_RefreshTokenTbl_TokenHash" ON "RefreshTokenTbl" ("TokenHash")`);
        await queryRunner.query(`CREATE INDEX "IDX_RefreshTokenTbl_CreatedDate" ON "RefreshTokenTbl" ("CreatedDate")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_RefreshTokenTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_RefreshTokenTbl_TokenHash"`);
        await queryRunner.query(`DROP INDEX "IDX_RefreshTokenTbl_UserId"`);
        await queryRunner.query(`DROP TABLE "RefreshTokenTbl"`);
    }
}
