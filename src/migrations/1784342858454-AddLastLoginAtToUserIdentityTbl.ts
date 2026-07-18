import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastLoginAtToUserIdentityTbl1784342858454 implements MigrationInterface {
    name = 'AddLastLoginAtToUserIdentityTbl1784342858454';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserIdentityTbl" ADD "LastLoginAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserIdentityTbl" DROP COLUMN "LastLoginAt"`);
    }
}
