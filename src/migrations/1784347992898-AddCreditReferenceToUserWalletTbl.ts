import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditReferenceToUserWalletTbl1784347992898 implements MigrationInterface {
    name = 'AddCreditReferenceToUserWalletTbl1784347992898';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserWalletTbl" ADD "CreditReference" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "UserWalletTbl" ADD "LastCreditRefUpdate" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserWalletTbl" DROP COLUMN "LastCreditRefUpdate"`);
        await queryRunner.query(`ALTER TABLE "UserWalletTbl" DROP COLUMN "CreditReference"`);
    }
}
