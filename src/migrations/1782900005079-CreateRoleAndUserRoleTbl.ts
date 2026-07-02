import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoleAndUserRoleTbl1782900005079 implements MigrationInterface {
    name = 'CreateRoleAndUserRoleTbl1782900005079';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "RoleTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "Name" character varying(50) NOT NULL,
                CONSTRAINT "PK_RoleTbl_Id" PRIMARY KEY ("Id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_RoleTbl_Name" ON "RoleTbl" ("Name")`);
        await queryRunner.query(`CREATE INDEX "IDX_RoleTbl_CreatedDate" ON "RoleTbl" ("CreatedDate")`);

        await queryRunner.query(`
            CREATE TABLE "UserRoleTbl" (
                "Id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "CreatedBy" character varying(150) NOT NULL,
                "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "UpdatedBy" character varying(150),
                "UpdatedDate" TIMESTAMPTZ,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "UserId" uuid NOT NULL,
                "RoleId" uuid NOT NULL,
                CONSTRAINT "PK_UserRoleTbl_Id" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_UserRoleTbl_UserId" FOREIGN KEY ("UserId") REFERENCES "UserIdentityTbl" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_UserRoleTbl_RoleId" FOREIGN KEY ("RoleId") REFERENCES "RoleTbl" ("Id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_UserRoleTbl_UserId" ON "UserRoleTbl" ("UserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_UserRoleTbl_RoleId" ON "UserRoleTbl" ("RoleId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_UserRoleTbl_UserId_RoleId" ON "UserRoleTbl" ("UserId", "RoleId")`);
        await queryRunner.query(`CREATE INDEX "IDX_UserRoleTbl_CreatedDate" ON "UserRoleTbl" ("CreatedDate")`);

        await queryRunner.query(`
            INSERT INTO "RoleTbl" ("CreatedBy", "Name") VALUES
                ('system', 'superadmin'),
                ('system', 'admin'),
                ('system', 'user')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_UserRoleTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_UserRoleTbl_UserId_RoleId"`);
        await queryRunner.query(`DROP INDEX "IDX_UserRoleTbl_RoleId"`);
        await queryRunner.query(`DROP INDEX "IDX_UserRoleTbl_UserId"`);
        await queryRunner.query(`DROP TABLE "UserRoleTbl"`);

        await queryRunner.query(`DROP INDEX "IDX_RoleTbl_CreatedDate"`);
        await queryRunner.query(`DROP INDEX "IDX_RoleTbl_Name"`);
        await queryRunner.query(`DROP TABLE "RoleTbl"`);
    }
}
