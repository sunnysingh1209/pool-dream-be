import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueIndexToUserIdentityName1784355747735 implements MigrationInterface {
    name = 'AddUniqueIndexToUserIdentityName1784355747735';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_UserIdentityTbl_Name" ON "UserIdentityTbl" ("Name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_UserIdentityTbl_Name"`);
    }
}
