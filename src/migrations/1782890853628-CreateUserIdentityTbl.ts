import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserIdentityTbl1782890853628 implements MigrationInterface {
    name = 'CreateUserIdentityTbl1782890853628';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`
            CREATE TABLE "UserIdentityTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "Name" character varying(150) NOT NULL,
                "Email" character varying(255) NOT NULL,
                "PasswordHash" character varying(255) NOT NULL,
                "PhoneNumber" character varying(20),
                "IsActive" boolean NOT NULL DEFAULT true,
                "IsLocked" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_UserIdentityTbl_Id" PRIMARY KEY ("Id")
            )
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_UserIdentityTbl_Email" ON "UserIdentityTbl" ("Email")`);
        await queryRunner.query(`CREATE INDEX "IDX_UserIdentityTbl_CreatedDate" ON "UserIdentityTbl" ("CreatedDate")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_UserIdentityTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_UserIdentityTbl_Email"`);
        await queryRunner.query(`DROP TABLE "UserIdentityTbl"`);
    }
}
