import * as bcrypt from "bcrypt";
import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedSuperAdminUser1783493287673 implements MigrationInterface {
    name = 'SeedSuperAdminUser1783493287673';

    private readonly email = 'varun@example.com';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const passwordHash = bcrypt.hashSync('StrongP@ssw0rd', 10);

        const [user] = await queryRunner.query(
            `INSERT INTO "UserIdentityTbl" ("CreatedBy", "Name", "Email", "PasswordHash", "PhoneNumber")
             VALUES ('system', 'varun', $1, $2, '+911234567890')
             ON CONFLICT ("Email") DO NOTHING
             RETURNING "Id"`,
            [this.email, passwordHash],
        );

        const userId = user
            ? user.Id
            : (
                await queryRunner.query(
                    `SELECT "Id" FROM "UserIdentityTbl" WHERE "Email" = $1`,
                    [this.email],
                )
            )[0].Id;

        const [role] = await queryRunner.query(
            `SELECT "Id" FROM "RoleTbl" WHERE "Name" = 'superadmin'`,
        );

        await queryRunner.query(
            `INSERT INTO "UserRoleTbl" ("CreatedBy", "UserId", "RoleId")
             VALUES ('system', $1, $2)
             ON CONFLICT ("UserId", "RoleId") DO NOTHING`,
            [userId, role.Id],
        );

        await queryRunner.query(
            `INSERT INTO "UserWalletTbl" ("CreatedBy", "UserId", "Balance")
             VALUES ('system', $1, 0)
             ON CONFLICT ("UserId") DO NOTHING`,
            [userId],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "UserIdentityTbl" WHERE "Email" = $1`,
            [this.email],
        );
    }
}
